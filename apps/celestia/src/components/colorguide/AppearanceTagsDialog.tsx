import { useTranslations } from 'next-intl';
import { FC, useEffect, useRef, useState } from 'react';
import { FormGroup, FormText, Input, Label } from 'reactstrap';

import { TagSuggestions } from 'src/components/colorguide/TagSuggestions';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation, useTagSuggestions } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  appearanceId: number;
  isOpen: boolean;
  onClose: () => void;
}

/** Tags are edited as one comma separated text, `origTags` lets the API notice somebody else changed them meanwhile */
export const AppearanceTagsDialog: FC<PropTypes> = ({ appearanceId, isOpen, onClose }) => {
  const t = useTranslations();
  const [tags, setTags] = useState('');
  const original = useRef('');
  const [loaded, setLoaded] = useState(false);

  const load = useApiMutation(() => AppearanceEditService.getTags(appearanceId), {
    onSuccess: (data) => {
      original.current = data.tags ?? '';
      setTags(original.current);
      setLoaded(true);
    },
  });
  useEffect(() => {
    if (isOpen && !loaded && !load.isPending) load.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loaded]);

  const save = useApiMutation(() => AppearanceEditService.setTags(appearanceId, tags, original.current), {
    invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]],
    onSuccess: () => {
      setLoaded(false);
      onClose();
    },
  });

  const errors = fieldErrors(save.error);
  const error = save.error ?? load.error;

  // The tag being typed (the text between the commas around the caret) is looked up while typing and can be taken from a short list
  const field = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const tokenStart = tags.lastIndexOf(',', Math.max(0, caret - 1)) + 1;
  const nextComma = tags.indexOf(',', caret);
  const tokenEnd = nextComma === -1 ? tags.length : nextComma;
  const token = tags.slice(tokenStart, tokenEnd).trim();
  const suggestions = useTagSuggestions(token, { enabled: isOpen });
  const pick = (name: string) => {
    const before = tags.slice(0, tokenStart).replace(/\s*$/, '');
    const after = tags.slice(tokenEnd).replace(/^\s*/, '');
    const next = `${before}${before ? ', ' : ''}${name}, ${after}`;
    setTags(next);
    setActive(null);
    const position = `${before}${before ? ', ' : ''}${name}, `.length;
    setTimeout(() => {
      field.current?.focus();
      field.current?.setSelectionRange(position, position);
      setCaret(position);
    });
  };

  return (
    <FormDialog
      title={t('colorGuide.edit.tags.title')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        setLoaded(false);
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={t('colorGuide.edit.tags.save')}
      busy={save.isPending || load.isPending}
      error={error && !errors.tags ? describeApiError(error) : null}
    >
      <FormGroup>
        <Label for={`tags-${appearanceId}`}>{t('colorGuide.edit.tags.label')}</Label>
        <Input
          id={`tags-${appearanceId}`}
          type="textarea"
          rows={4}
          innerRef={field}
          disabled={load.isPending || !loaded}
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            setCaret(e.target.selectionStart ?? 0);
            setActive(null);
          }}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
          onKeyDown={(e) => {
            if (suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => (i === null ? 0 : Math.min(i + 1, suggestions.length - 1)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => (i === null || i === 0 ? null : i - 1));
            } else if ((e.key === 'Enter' || e.key === 'Tab') && active !== null) {
              e.preventDefault();
              pick(suggestions[active].name);
            } else if (e.key === 'Escape' && active !== null) {
              e.stopPropagation();
              setActive(null);
            }
          }}
          invalid={Boolean(errors.tags)}
          aria-controls={`tag-suggestions-${appearanceId}`}
        />
        <TagSuggestions suggestions={suggestions} active={active} onPick={(tag) => pick(tag.name)} id={`tag-suggestions-${appearanceId}`} />
        {errors.tags && <div className="invalid-feedback d-block">{errors.tags}</div>}
        <FormText>{t('colorGuide.edit.tags.help')}</FormText>
      </FormGroup>
    </FormDialog>
  );
};

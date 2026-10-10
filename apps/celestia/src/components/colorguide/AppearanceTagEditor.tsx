import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Alert, Button, Input } from 'reactstrap';

import styles from 'modules/AppearanceTagEditor.module.scss';
import { Tag } from 'src/components/colorguide/Tag';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import InlineIcon from 'src/components/shared/InlineIcon';
import LoadingRing from 'src/components/shared/LoadingRing';
import { describeApiError, fieldErrors, useApiMutation, useTagSuggestions } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { TagType } from 'src/types/api-alias';
import { ENDPOINTS, httpResponseMapper } from 'src/utils';

const MAX_TAG_LENGTH = 64;

const parseTags = (raw: string): string[] => [
  ...new Set(
    raw
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  ),
];

/** The API has the last word on which characters a tag may have, this only keeps out what can never be one */
const isAcceptable = (name: string) => name.length > 0 && name.length <= MAX_TAG_LENGTH && !name.startsWith('-') && !name.includes(',');

interface PropTypes {
  appearanceId: number;
  onClose: () => void;
}

/**
 * Edits the tags of an appearance in place of the tag list, like the old site: the tags as removable chips and a field that adds one on Enter
 * or a comma (suggesting existing tags with their use count while typing), or the same tags as one comma separated text. `origTags` lets the API
 * notice somebody else changed them meanwhile
 */
export const AppearanceTagEditor: FC<PropTypes> = ({ appearanceId, onClose }) => {
  const t = useTranslations();
  const original = useRef('');
  const input = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [plain, setPlain] = useState(false);
  const [typed, setTyped] = useState('');
  const [typedInvalid, setTypedInvalid] = useState(false);
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  // A tag that was added again flashes where it already is
  const [flash, setFlash] = useState<{ name: string; count: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    AppearanceEditService.getTags(appearanceId)
      .then(({ data }) => {
        if (cancelled) return;
        original.current = data.tags ?? '';
        setNames(parseTags(original.current));
        setText(original.current);
        setLoaded(true);
      })
      .catch((e: unknown) => !cancelled && setLoadError(describeApiError(httpResponseMapper(e))));
    return () => {
      cancelled = true;
    };
  }, [appearanceId]);

  useEffect(() => {
    if (loaded && !plain) input.current?.focus();
  }, [loaded, plain]);

  const suggestions = useTagSuggestions(typed, { enabled: loaded && !plain });
  const showSuggestions = open && suggestions.length > 0;

  const add = (raw: string): boolean => {
    const name = raw.trim();
    if (name === '') return false;
    if (!isAcceptable(name)) {
      setTypedInvalid(true);
      return false;
    }
    if (names.includes(name)) {
      setFlash((current) => ({ name, count: (current?.count ?? 0) + 1 }));
    } else {
      setNames((current) => [...current, name]);
    }
    setTyped('');
    setTypedInvalid(false);
    setActive(null);
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setActive((i) => (i === null ? 0 : Math.min(i + 1, suggestions.length - 1)));
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setActive((i) => (i === null || i === 0 ? null : i - 1));
    } else if (e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && active !== null)) {
      // Enter never submits anything here, saving is the button's job
      e.preventDefault();
      add(showSuggestions && active !== null ? suggestions[active].name : typed);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
      setActive(null);
    }
  };

  const switchMode = () => {
    if (plain) {
      setNames(parseTags(text));
    } else {
      setText(names.join(', '));
      setTyped('');
    }
    setPlain(!plain);
  };

  const save = useApiMutation(
    () => {
      const final = plain
        ? text
        : [...names, ...(isAcceptable(typed.trim()) && !names.includes(typed.trim()) ? [typed.trim()] : [])].join(', ');
      return AppearanceEditService.setTags(appearanceId, final, original.current);
    },
    { invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]], onSuccess: onClose }
  );
  const errors = fieldErrors(save.error);
  const error = loadError ?? (save.error && !errors.tags ? describeApiError(save.error) : null);

  return (
    <div data-testid="tag-editor">
      <div className={classNames('tag-editor', styles.editor)}>
        {!loaded && !loadError && <LoadingRing />}
        {loaded && plain && (
          <Input
            type="textarea"
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label={t('colorGuide.edit.tags.label')}
            invalid={Boolean(errors.tags)}
            autoFocus
          />
        )}
        {loaded && !plain && (
          <>
            {names.map((name) => (
              <span
                key={name === flash?.name ? `${name}-${flash.count}` : name}
                className={classNames(styles.chip, { [styles.noticeMe]: name === flash?.name })}
              >
                <Tag
                  tag={{ id: 0, name, type: null }}
                  extra={
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={t('colorGuide.edit.tags.remove', { name })}
                      onClick={() => setNames((current) => current.filter((n) => n !== name))}
                    >
                      &times;
                    </button>
                  }
                />
              </span>
            ))}
            <div className={styles.inputWrap}>
              <Input
                innerRef={input}
                bsSize="sm"
                className={styles.input}
                value={typed}
                maxLength={MAX_TAG_LENGTH}
                placeholder={t('colorGuide.edit.tags.placeholder')}
                aria-label={t('colorGuide.edit.tags.add')}
                aria-controls={`tag-suggestions-${appearanceId}`}
                aria-expanded={showSuggestions}
                role="combobox"
                aria-autocomplete="list"
                invalid={typedInvalid}
                autoComplete="off"
                onChange={(e) => {
                  setTyped(e.target.value.replace(/,/g, ''));
                  setTypedInvalid(false);
                  setActive(null);
                  setOpen(true);
                }}
                onKeyDown={onKeyDown}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
              />
              {showSuggestions && (
                <ul className={styles.suggestions} role="listbox" id={`tag-suggestions-${appearanceId}`}>
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.id}
                      role="option"
                      aria-selected={active === index}
                      className={classNames({ [styles.active]: active === index })}
                    >
                      <button
                        type="button"
                        className={styles.suggestion}
                        // The field keeps the focus, so a click does not close the list before it is taken
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          add(suggestion.name);
                          input.current?.focus();
                        }}
                      >
                        <Tag
                          tag={{
                            id: suggestion.id,
                            name: suggestion.name,
                            type: suggestion.type as TagType | null,
                            synonymOf: suggestion.synonymOf,
                          }}
                          extra={
                            <span className={styles.uses}>
                              {suggestion.synonymOf !== null ? (
                                <>
                                  <InlineIcon icon="sitemap" first />
                                  {suggestion.synonymTarget}
                                </>
                              ) : (
                                suggestion.uses
                              )}
                            </span>
                          }
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
      {plain && <p className="form-text mb-0">{t('colorGuide.edit.tags.help')}</p>}
      {errors.tags && <div className="invalid-feedback d-block">{errors.tags}</div>}
      {error && (
        <Alert color="danger" fade={false} className="mt-2 mb-0" role="alert">
          {error}
        </Alert>
      )}
      <ButtonCollection leftAlign>
        <Button color="success" data-testid="tag-editor-save" disabled={!loaded || save.isPending} onClick={() => save.mutate()}>
          <InlineIcon icon="check" first loading={save.isPending} />
          {t('colorGuide.edit.tags.save')}
        </Button>
        <Button color="darkblue" data-testid="tag-editor-mode" disabled={!loaded || save.isPending} onClick={switchMode}>
          <InlineIcon icon={plain ? 'edit' : 'pencil-alt'} first />
          {plain ? t('colorGuide.edit.tags.interactiveEditor') : t('colorGuide.edit.tags.plainEditor')}
        </Button>
        <Button color="orange" data-testid="tag-editor-discard" disabled={save.isPending} onClick={onClose}>
          <InlineIcon icon="times" first />
          {t('colorGuide.edit.tags.discard')}
        </Button>
      </ButtonCollection>
    </div>
  );
};

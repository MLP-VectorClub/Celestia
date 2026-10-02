import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FC } from 'react';
import { Button, FormGroup, Input, InputGroup, Label } from 'reactstrap';

import { PostPostsCheckImageResult } from '@mlp-vectorclub/api-types';
import { describeApiError, useApiMutation } from 'src/hooks';
import { PostService } from 'src/services/posts';

interface PropTypes {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Error for the field from the form's own request */
  error?: string;
  /** Called with what the API found at the link, once it has been checked */
  onChecked?: (result: PostPostsCheckImageResult) => void;
  autoFocus?: boolean;
}

/** An image link with a Check button that asks the API what it found there and shows the preview */
export const PostImageField: FC<PropTypes> = ({ id, label, value, onChange, error, onChecked, autoFocus }) => {
  const t = useTranslations();
  const shownLabel = label ?? t('show.post.image.link');
  const check = useApiMutation((url: string) => PostService.checkImage(url), { onSuccess: onChecked });
  const trimmed = value.trim();

  return (
    <FormGroup>
      <Label for={id}>{shownLabel}</Label>
      <InputGroup>
        <Input
          id={id}
          type="url"
          placeholder="https://www.deviantart.com/…"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            check.reset();
          }}
          onBlur={() => trimmed && !check.isPending && !check.data && check.mutate(trimmed)}
          invalid={Boolean(error) || Boolean(check.error)}
          autoFocus={autoFocus}
          required
        />
        <Button type="button" outline onClick={() => check.mutate(trimmed)} disabled={!trimmed || check.isPending}>
          {t('show.post.image.check')}
        </Button>
      </InputGroup>
      {(error || check.error) && <div className="invalid-feedback d-block">{error ?? (check.error && describeApiError(check.error))}</div>}
      {check.data && (
        <Image
          src={check.data.preview}
          alt={t('show.post.image.preview')}
          width={160}
          height={120}
          unoptimized
          className="mt-2"
          style={{ objectFit: 'cover' }}
        />
      )}
    </FormGroup>
  );
};

import classNames from 'classnames';
import { FC, UIEvent, useRef } from 'react';

import styles from 'modules/ColorTextEditor.module.scss';
import { tokenizeColorLine } from 'src/utils/color-group-text';

interface PropTypes {
  value: string;
  onChange: (value: string) => void;
  label: string;
  invalid?: boolean;
  rows?: number;
}

/** The plain text color list with the old site's syntax highlighting: a colored copy of the text sits behind a textarea whose own text is invisible */
export const ColorTextEditor: FC<PropTypes> = ({ value, onChange, label, invalid = false, rows = 8 }) => {
  const highlightRef = useRef<HTMLPreElement>(null);

  const syncScroll = (e: UIEvent<HTMLTextAreaElement>) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = e.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  return (
    <div className={classNames(styles.editor, { [styles.invalidEditor]: invalid })}>
      <pre ref={highlightRef} className={styles.highlight} aria-hidden="true">
        <code>
          {value.split('\n').map((line, index) => (
             
            <span key={index}>
              {tokenizeColorLine(line).map((token, i) => (
                 
                <span key={i} className={token.kind === 'plain' ? undefined : styles[token.kind]}>
                  {token.text}
                </span>
              ))}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
      <textarea
        className={styles.input}
        data-testid="form-color-text"
        aria-label={label}
        aria-invalid={invalid || undefined}
        rows={rows}
        wrap="off"
        spellCheck={false}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
      />
    </div>
  );
};

import classNames from 'classnames';
import { debounce } from 'lodash';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChangeEventHandler,
  FC,
  FocusEvent,
  FormEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button, Col, Form, Input, InputGroup, ListGroupItem, Row, UncontrolledTooltip } from 'reactstrap';

import { GuideName } from '@mlp-vectorclub/api-types';
import styles from 'modules/SearchBar.module.scss';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import { NutshellLabel } from 'src/components/colorguide/NutshellLabel';
import InlineIcon from 'src/components/shared/InlineIcon';
import { Tooltipped } from 'src/components/shared/Tooltipped';
import { useGuideAutocomplete } from 'src/hooks';
import { PATHS } from 'src/paths';
import { Nullable, Status } from 'src/types';

interface PropTypes {
  initialQuery: string;
  guide: Nullable<GuideName>;
}

const RESULT_ITEM_CLASS = styles.acResultItem;

const acOptionId = (index: number | null): string | undefined => (index === null ? undefined : `ac-option-${index}`);

const SearchBar: FC<PropTypes> = ({ initialQuery, guide }) => {
  const t = useTranslations();
  const router = useRouter();
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  const [searchInputDirty, setSearchInputDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [acQuery, setAcQuery] = useState(initialQuery);
  const [activeResult, setActiveResult] = useState<Nullable<number>>(null);
  const { results, status } = useGuideAutocomplete({ guide, q: acQuery });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null) as RefObject<HTMLButtonElement>;

  const handleAcQueryChange = useRef(debounce((query: string) => setAcQuery(query), 400));
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const newQuery = e.target.value;
      setSearchQuery(newQuery);
      handleAcQueryChange.current(newQuery);
      if (!searchInputDirty) setSearchInputDirty(true);
    },
    [searchInputDirty]
  );
  const handleInputFocusChange = useCallback(
    (isFocused: boolean) => (e: FocusEvent<HTMLElement>) => {
      if (e.relatedTarget && (e.relatedTarget as HTMLElement).classList.contains(RESULT_ITEM_CLASS)) {
        return;
      }
      if (isFocused) {
        setActiveResult(null);
        setSearchInputDirty(true);
      } else {
        setSearchInputDirty(false);
      }
      setSearchInputFocused(isFocused);
    },
    []
  );
  const handleResultFocusChange = useCallback(
    (isFocused: boolean, index: number) => (e: FocusEvent<HTMLElement>) => {
      if (e.relatedTarget) {
        const target = e.relatedTarget as HTMLElement;
        if (target === searchInputRef.current && target.classList.contains(RESULT_ITEM_CLASS)) {
          return;
        }
      }
      if (isFocused) {
        setActiveResult(index);
      }
    },
    []
  );
  const handleResultMouseEnter = useCallback(
    (index: number): MouseEventHandler<HTMLElement> =>
      (e) => {
        setActiveResult(index);
        (e.target as HTMLElement).focus();
      },
    []
  );
  const handleInputKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (searchInputDirty && e.key === 'Escape') {
        e.preventDefault();
        setActiveResult(null);
        setSearchInputDirty(false);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const resultsListEl = resultsListRef.current;
        const resultItems = resultsListEl?.getElementsByClassName(RESULT_ITEM_CLASS) as HTMLCollectionOf<HTMLElement>;
        if (resultItems?.length > 0) {
          resultItems[0].focus();
        }
      }
    },
    [searchInputDirty]
  );
  const handleResultKeyDown =
    (index: number): KeyboardEventHandler<HTMLElement> =>
    (e) => {
      if (searchInputDirty && e.key === 'Escape') {
        e.preventDefault();
        setActiveResult(null);
        setSearchInputDirty(false);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const item = e.target as HTMLElement;
        if (item) {
          if (item.previousElementSibling === null || !item.previousElementSibling.classList.contains(RESULT_ITEM_CLASS)) {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
              setActiveResult(null);
            }
          } else {
            (item.previousElementSibling as HTMLElement).focus();
            setActiveResult(index - 1);
          }
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const item = e.target as HTMLElement;
        if (item) {
          if (item.nextElementSibling !== null && item.nextElementSibling.classList.contains(RESULT_ITEM_CLASS)) {
            (item.nextElementSibling as HTMLElement).focus();
            setActiveResult(index + 1);
          }
        }
      }
    };

  const setSearchState = useCallback((query: string = '') => {
    setSearchQuery(query);
    setAcQuery(query);
  }, []);
  const handleClearSearch: FormEventHandler = useCallback(
    (e) => {
      e.preventDefault();

      if (!guide) return;
      if (initialQuery.length === 0) {
        setSearchState();
        return;
      }

      void router.push(PATHS.GUIDE(guide)).then(() => setSearchState());
    },
    [setSearchState, guide, initialQuery, router]
  );
  const deactivateSuggestion = useCallback(() => {
    setActiveResult(null);
  }, []);

  // Force an update to the search query if it changes in the URL
  useEffect(() => {
    setSearchState(initialQuery);
  }, [initialQuery, setSearchState]);

  const acResultsLoading = status === Status.LOAD;
  const acResultsExist = results && results.length > 0;
  const autocompleteOpen = searchInputFocused && searchInputDirty && (acResultsLoading || acResultsExist);
  const clearButtonDisabled = searchQuery.length === 0 && initialQuery.length === 0;

  return (
    <Row className="align-items-center justify-content-center mb-3">
      <Col sm={12} xl={6} className={styles.searchBarCol}>
        <Form className="position-relative" onReset={handleClearSearch}>
          <InputGroup
            size="lg"
            className={classNames(`${styles.searchInputGroup} justify-content-center align-items-center`, {
              [styles.acOpen]: autocompleteOpen,
            })}
          >
            <Input
              innerRef={searchInputRef}
              name="q"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocusChange(true)}
              onBlur={handleInputFocusChange(false)}
              onKeyDown={handleInputKeyDown}
              onClick={deactivateSuggestion}
              autoComplete="off"
              role="searchbox"
              aria-haspopup={autocompleteOpen}
              aria-autocomplete="list"
              aria-activedescendant={acOptionId(activeResult)}
            />
            <Tooltipped title={t('colorGuide.search.lucky')}>
              {(ref) => (
                <Button color="success" type="submit" name="btnl" innerRef={ref} aria-label={t('colorGuide.search.lucky')}>
                  <InlineIcon icon="bolt" />
                </Button>
              )}
            </Tooltipped>
            <Button outline type="reset" disabled={clearButtonDisabled} innerRef={clearButtonRef}>
              <InlineIcon icon="times" />
            </Button>
            <Button color="ui" className="d-none d-lg-inline-block">
              <InlineIcon icon="search" first />
              {t('colorGuide.search.button')}
            </Button>
            <Button color="ui" className="d-lg-none">
              <InlineIcon icon="search" />
            </Button>
          </InputGroup>
          <UncontrolledTooltip target={clearButtonRef} fade={false} placement="bottom">
            {t('colorGuide.search.clear')}
          </UncontrolledTooltip>
          {autocompleteOpen && (
            <div
              className={`${styles.acResults} list-group shadow`}
              ref={resultsListRef}
              tabIndex={-1}
              role="listbox"
              aria-expanded="true"
              onMouseLeave={deactivateSuggestion}
            >
              {acResultsLoading ? (
                <ListGroupItem>
                  <InlineIcon loading first />
                  {t('colorGuide.search.loading')}
                </ListGroupItem>
              ) : (
                acResultsExist && (
                  <>
                    <ListGroupItem className="text-center p-2" disabled role="option" aria-disabled>
                      {t.rich('colorGuide.search.help', {
                        up: () => (
                          <kbd>
                            <InlineIcon icon="arrow-up" size="sm" />
                          </kbd>
                        ),
                        down: () => (
                          <kbd>
                            <InlineIcon icon="arrow-down" size="sm" />
                          </kbd>
                        ),
                        enter: () => <kbd>Enter</kbd>,
                        esc: () => <kbd>Esc</kbd>,
                      })}
                    </ListGroupItem>
                    {results!.map((r, i) => (
                      <Link key={r.id} href={PATHS.APPEARANCE(r)} passHref legacyBehavior>
                        <ListGroupItem
                          tag="a"
                          className={`${RESULT_ITEM_CLASS} p-2`}
                          active={activeResult === i}
                          onFocus={handleResultFocusChange(true, i)}
                          onBlur={handleResultFocusChange(false, i)}
                          onMouseEnter={handleResultMouseEnter(i)}
                          onKeyDown={handleResultKeyDown(i)}
                          role="option"
                          aria-label={r.label}
                          id={acOptionId(i)}
                        >
                          <AppearancePreview data={r.previewData} className={styles.acResultPreview} />
                          <span className={`${styles.acResultLabel} ms-2`}>
                            <NutshellLabel appearance={r} />
                          </span>
                        </ListGroupItem>
                      </Link>
                    ))}
                  </>
                )
              )}
            </div>
          )}
        </Form>
      </Col>
    </Row>
  );
};

export default SearchBar;

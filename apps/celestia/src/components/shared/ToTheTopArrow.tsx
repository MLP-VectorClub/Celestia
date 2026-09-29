import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC, useEffect, useState } from 'react';
import { Button } from 'reactstrap';
import { fromEvent } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';

const ToTheTopArrow: FC = () => {
  const [visible, setVisible] = useState(false);

  const handleClick = () => {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(document.documentElement.scrollTop !== 0);
    };
    const sub = fromEvent(document, 'scroll').pipe(debounceTime(50), tap(updateVisibility)).subscribe();
    updateVisibility();

    return () => {
      sub.unsubscribe();
    };
  }, []);

  return (
    <Button color="link" id="to-the-top" onClick={handleClick} className={visible ? 'show' : ''}>
      <FontAwesomeIcon icon="arrow-up" />
    </Button>
  );
};

export default ToTheTopArrow;

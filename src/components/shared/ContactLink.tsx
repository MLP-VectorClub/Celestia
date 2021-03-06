import { useDispatch } from 'react-redux';
import { coreActions } from 'src/store/slices';
import { FC, MouseEventHandler } from 'react';

const ContactLink: FC = ({ children, ...rest }) => {
  const dispatch = useDispatch();
  const openModal: MouseEventHandler = e => {
    e.preventDefault();
    dispatch(coreActions.toggleContact(true));
  };
  return (
    <a href="#" className="send-feedback" onClick={openModal} {...rest}>
      {children}
    </a>
  );
};

export default ContactLink;

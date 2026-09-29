import classNames from 'classnames';
import { FC, PropsWithChildren, ReactNode } from 'react';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

interface CenterProps extends PropsWithChildren {
  header?: ReactNode;
  className?: string;
  color?: string;
}

const Center: FC<CenterProps> = ({ children, header, className, color }) => (
  <Modal className={classNames(className, color && `modal-${color}`)} centered backdrop={false} fade={false} isOpen>
    {typeof header !== 'undefined' && <ModalHeader className="justify-content-center">{header}</ModalHeader>}
    <ModalBody>{children}</ModalBody>
  </Modal>
);

export default Center;

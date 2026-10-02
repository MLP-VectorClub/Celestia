import { FC } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

/** What the picker is for and how to find its controls */
export const AboutDialog: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <Modal className="modal-ui" centered isOpen={isOpen} toggle={onClose}>
    <ModalHeader toggle={onClose}>About the color picker</ModalHeader>
    <ModalBody>
      <p>
        This color picker is meant to serve as an easy way to get accurate color readings from screencaps taken from the show. The interface
        mimics the controls and look of Adobe Photoshop, while giving you the ability to use multiple picking areas with variable sizes
        across as many images as your browser can handle.
      </p>
      <p>
        While hovering over or focusing parts of the interface, an explanation of what they do is displayed in the bottom left to make the
        controls easier to learn.
      </p>
      <p>
        Colors are averaged over every pixel of a picking area. The color of an area that is partly transparent includes its opacity, and
        areas that stick out of the image only count the part that lies on it.
      </p>
      <p className="mb-0">
        Huge thanks to Discorded, Masem, Pirill and Trildar for helping with the creation of the original tool via code, feedback and ideas.
      </p>
    </ModalBody>
    <ModalFooter>
      <Button color="primary" onClick={onClose}>
        Close
      </Button>
    </ModalFooter>
  </Modal>
);

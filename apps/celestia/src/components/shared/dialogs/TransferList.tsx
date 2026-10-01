import { ReactNode } from 'react';
import { Button, Col, ListGroup, ListGroupItem, Row } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';

export interface TransferItem {
  id: number;
  label: string;
}

interface PropTypes<T extends TransferItem> {
  available: T[];
  selected: T[];
  availableTitle: string;
  selectedTitle: string;
  onChange: (selectedIds: number[]) => void;
  /** Extra controls for a selected row, e.g. a "mutual" toggle */
  renderSelectedExtra?: (item: T) => ReactNode;
}

/**
 * Two lists with the entries that can be picked and the ones that were: clicking an entry moves it to the other side
 */
export const TransferList = <T extends TransferItem>({
  available,
  selected,
  availableTitle,
  selectedTitle,
  onChange,
  renderSelectedExtra,
}: PropTypes<T>) => {
  const selectedIds = selected.map((i) => i.id);
  return (
    <Row>
      <Col md="6">
        <h3 className="h6">{availableTitle}</h3>
        <ListGroup flush style={{ maxHeight: '20rem', overflowY: 'auto' }}>
          {available.map((item) => (
            <ListGroupItem key={item.id} tag="button" type="button" action onClick={() => onChange([...selectedIds, item.id])}>
              <InlineIcon icon="plus" first /> {item.label}
            </ListGroupItem>
          ))}
        </ListGroup>
      </Col>
      <Col md="6">
        <h3 className="h6">{selectedTitle}</h3>
        <ListGroup flush style={{ maxHeight: '20rem', overflowY: 'auto' }}>
          {selected.map((item) => (
            <ListGroupItem key={item.id} className="d-flex justify-content-between align-items-center">
              <span>{item.label}</span>
              <span>
                {renderSelectedExtra?.(item)}
                <Button
                  type="button"
                  size="sm"
                  color="link"
                  className="text-danger"
                  aria-label={`Remove ${item.label}`}
                  onClick={() => onChange(selectedIds.filter((id) => id !== item.id))}
                >
                  <InlineIcon icon="times" />
                </Button>
              </span>
            </ListGroupItem>
          ))}
        </ListGroup>
      </Col>
    </Row>
  );
};

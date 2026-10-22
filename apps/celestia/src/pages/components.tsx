import { SlimGuideTag } from '@went.tf/mlp-vectorclub-api-types';
import { NextPage } from 'next';
import Head from 'next/head';
import { FC, PropsWithChildren, useMemo } from 'react';
import { Alert, Badge, Button, Card, CardBody, Dropdown, DropdownItem, DropdownMenu, Input, InputGroup, Label, Pagination, PaginationItem, PaginationLink, Table } from 'reactstrap';

import { Tag } from 'src/components/colorguide/Tag';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import UserLinkWithAvatar from 'src/components/shared/UserLinkWithAvatar';
import { useTitleSetter } from 'src/hooks';
import { useAppDispatch, wrapper } from 'src/store';
import { TitleFactory } from 'src/types/title';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

import styles from 'modules/ComponentsPage.module.scss';

const titleFactory: TitleFactory = () => ({
  title: 'Components',
  breadcrumbs: [{ label: 'Components', active: true }],
});

/** The buttons of the old site's components page, then the rest of Celestia's colors */
const BUTTONS: Array<{ color: string; label: string }> = [
  { color: 'secondary', label: 'Regular' },
  { color: 'darkblue', label: 'Dark blue' },
  { color: 'blue', label: 'Blue' },
  { color: 'success', label: 'Green' },
  { color: 'warning', label: 'Yellow' },
  { color: 'orange', label: 'Orange' },
  { color: 'danger', label: 'Red' },
  { color: 'guide-link', label: 'Link' },
  { color: 'teal', label: 'Teal' },
  { color: 'primary', label: 'Primary' },
  { color: 'info', label: 'Info' },
  { color: 'ui', label: 'UI' },
  { color: 'red', label: 'Dark red' },
  { color: 'club', label: 'Club' },
  { color: 'discord', label: 'Discord' },
  { color: 'deviantart', label: 'DeviantArt' },
  { color: 'light', label: 'Light' },
  { color: 'dark', label: 'Dark' },
];

/** What the notices of the site can be (`NOTICE_COLORS` in `Notices.tsx`), and the status alert's `ui` */
const NOTICES: Array<{ color: string; name: string }> = [
  { color: 'secondary', name: 'Regular' },
  { color: 'info', name: 'Info' },
  { color: 'success', name: 'Success' },
  { color: 'warning', name: 'Caution / warn' },
  { color: 'danger', name: 'Fail' },
  { color: 'ui', name: 'Loading' },
];

const TAGS: Array<{ id: number; name: string; type: SlimGuideTag['type'] }> = [
  { id: 1, name: 'Category', type: 'cat' },
  { id: 2, name: 'Species', type: 'spec' },
  { id: 3, name: 'Gender', type: 'gen' },
  { id: 4, name: 'Clothing', type: 'app' },
  { id: 5, name: 'Warning', type: 'warn' },
  { id: 6, name: 'Character', type: 'char' },
];

const Section: FC<PropsWithChildren<{ id: string; title: string }>> = ({ id, title, children }) => (
  <section id={id} className={styles.section} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>{title}</h2>
    {children}
  </section>
);

const ComponentsPage: NextPage = () => {
  const dispatch = useAppDispatch();
  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <StandardHeading heading="Components" lead="Every kind of element the site uses, in the current theme" />

      <Section id="buttons" title="Buttons">
        <div className={styles.row}>
          {BUTTONS.map(({ color, label }) => (
            <Button key={color} color={color}>
              {label} button
            </Button>
          ))}
        </div>
        <div className={styles.row}>
          {BUTTONS.map(({ color }) => (
            <Button key={color} color={color}>
              <InlineIcon icon="paint-brush" first />
              With icon
            </Button>
          ))}
        </div>
        <div className={styles.row}>
          {BUTTONS.filter(({ color }) => color !== 'light').map(({ color, label }) => (
            <Button key={color} color={color} outline>
              {label} outline
            </Button>
          ))}
        </div>
        <div className={styles.row}>
          <Button color="primary" size="sm">
            Small
          </Button>
          <Button color="primary">Default</Button>
          <Button color="primary" size="lg">
            Large
          </Button>
          <Button color="primary" disabled>
            Disabled
          </Button>
          <Button color="link">Link style</Button>
        </div>
      </Section>

      <Section id="notices" title="Notices">
        <div>
          {NOTICES.map(({ color, name }) => (
            <Alert key={color} color={color} fade={false}>
              Single-line notice ({name})
            </Alert>
          ))}
          {NOTICES.map(({ color, name }) => (
            <Alert key={color} color={color} fade={false} className="text-center">
              Centered notice ({name})
            </Alert>
          ))}
          {NOTICES.map(({ color, name }) => (
            <Alert key={color} color={color} fade={false}>
              <h3 className="alert-heading h6">Notice with title ({name})</h3>
              <p className="mb-0">
                Notice contents with <a href="#notices">a link</a>.
              </p>
            </Alert>
          ))}
        </div>
      </Section>

      <Section id="text" title="Text">
        <p>
          Regular paragraph with <a href="#text">a link</a>. <em>Emphasis</em> mine. What a <strong>bold</strong> statement.
        </p>
        <p className="text-muted">Muted text, for hints and secondary information.</p>
        <p>
          <small>Small text.</small> <mark>Highlighted text.</mark> Inline <code>code</code>. <abbr title="Abbreviation">Abbr</abbr>.
        </p>
        <blockquote className="blockquote">A quote, for when somebody else said it better.</blockquote>
        <p>
          {['primary', 'secondary', 'success', 'danger', 'warning', 'info'].map((color) => (
            <span key={color} className={`text-${color}-emphasis me-3`}>
              {color}
            </span>
          ))}
        </p>
      </Section>

      <Section id="badges" title="Badges and tags">
        <div className={styles.row}>
          {['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'ui', 'guide-link', 'teal', 'club'].map((color) => (
            <Badge key={color} color={color}>
              {color}
            </Badge>
          ))}
        </div>
        <div className={styles.row}>
          {TAGS.map((tag) => (
            <Tag key={tag.id} tag={tag as SlimGuideTag} guide="pony" />
          ))}
        </div>
      </Section>

      <Section id="users" title="User links">
        <div className={styles.row}>
          <UserLinkWithAvatar id={1} name="Some Pony" avatarUrl={null} />
        </div>
        <div className={styles.row}>
          {[undefined, 'illustrator', 'inkscape', 'ponyscape'].map((app) => (
            <UserLinkWithAvatar key={app ?? 'none'} id={1} name="Some Pony" avatarUrl={null} caption="Reserved by:" vectorApp={app} />
          ))}
        </div>
      </Section>

      <Section id="forms" title="Forms">
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <Label htmlFor="components-text">Text field</Label>
          <Input id="components-text" placeholder="Placeholder text" />
          <Label htmlFor="components-filled">Filled field</Label>
          <Input id="components-filled" defaultValue="Some value" />
          <Label htmlFor="components-select">Select</Label>
          <Input id="components-select" type="select" defaultValue="two">
            <option value="one">One</option>
            <option value="two">Two</option>
          </Input>
          <Label htmlFor="components-area">Text area</Label>
          <Input id="components-area" type="textarea" defaultValue="Several lines of text" />
          <Label htmlFor="components-valid">Valid field</Label>
          <Input id="components-valid" valid defaultValue="Looks good" />
          <div className="valid-feedback d-block">Everything is fine.</div>
          <Label htmlFor="components-invalid">Invalid field</Label>
          <Input id="components-invalid" invalid defaultValue="Looks wrong" />
          <div className="invalid-feedback d-block">Something needs another look.</div>
          <InputGroup className="mt-2">
            <Input aria-label="Search" placeholder="Input group" />
            <Button color="primary">Go</Button>
          </InputGroup>
          <div className="form-check mt-2">
            <input id="components-check" className="form-check-input" type="checkbox" defaultChecked />
            <label className="form-check-label" htmlFor="components-check">
              Checkbox
            </label>
          </div>
          <div className="form-check form-switch">
            <input id="components-switch" className="form-check-input" type="checkbox" role="switch" defaultChecked />
            <label className="form-check-label" htmlFor="components-switch">
              Switch
            </label>
          </div>
        </form>
      </Section>

      <Section id="tables" title="Tables, cards and lists">
        <Table bordered>
          <caption>A table</caption>
          <thead>
            <tr>
              <th scope="col">Column</th>
              <th scope="col">Another column</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cell</td>
              <td>
                <a href="#tables">Cell with a link</a>
              </td>
            </tr>
            <tr className="table-active">
              <td>Active row</td>
              <td className="text-muted">Muted cell</td>
            </tr>
          </tbody>
        </Table>
        <Card className="mb-3">
          <CardBody>
            A card with <a href="#tables">a link</a>.
          </CardBody>
        </Card>
        <ul className="list-group mb-3">
          <li className="list-group-item">List item</li>
          <li className="list-group-item active" aria-current="true">
            Active list item
          </li>
          <li className="list-group-item list-group-item-action">
            <a href="#tables">List item link</a>
          </li>
        </ul>
        <Pagination aria-label="Pagination">
          <PaginationItem disabled>
            <PaginationLink previous href="#tables" />
          </PaginationItem>
          <PaginationItem active>
            <PaginationLink href="#tables">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#tables">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink next href="#tables" />
          </PaginationItem>
        </Pagination>
      </Section>

      <Section id="menus" title="Menus and dialogs">
        <Dropdown isOpen toggle={() => undefined} className={styles.menu}>
          <DropdownMenu static className="position-static">
            <DropdownItem header>Menu header</DropdownItem>
            <DropdownItem>Menu item</DropdownItem>
            <DropdownItem active>Active item</DropdownItem>
            <DropdownItem divider />
            <DropdownItem disabled>Disabled item</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <div className={styles.dialogs}>
          {['ui', 'success', 'danger', 'warning', 'info'].map((color) => (
            <div key={color} className={`modal-${color}`}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title h5">{color} dialog</h3>
                  <button type="button" className="btn-close" aria-label="Close" />
                </div>
                <div className="modal-body">Dialog contents with a link: <a href="#menus">like this</a>.</div>
                <div className="modal-footer">
                  <Button color="secondary">Cancel</Button>
                  <Button color={color === 'ui' ? 'primary' : color}>Confirm</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return {
    props: {
      ...(await typedServerSideTranslations(locale)),
    },
  };
});

export default ComponentsPage;

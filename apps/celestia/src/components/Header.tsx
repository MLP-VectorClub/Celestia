import { FC } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { Collapse, Navbar, NavbarBrand } from 'reactstrap';

import MainNavigation from 'src/components/shared/MainNavigation';
import SidebarToggler from 'src/components/shared/SidebarToggler';
import ToTheTopArrow from 'src/components/shared/ToTheTopArrow';

const Header: FC = () => (
  <header id="header">
    <ScrollContainer>
      <Navbar expand="lg" dark>
        <SidebarToggler />

        <NavbarBrand className="d-lg-none">MLP Vector Club</NavbarBrand>

        <Collapse navbar isOpen className="d-none d-lg-flex">
          <MainNavigation />
        </Collapse>
      </Navbar>
    </ScrollContainer>
    <ToTheTopArrow />
  </header>
);

export default Header;

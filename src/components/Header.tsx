import { Collapse, Navbar, NavbarBrand } from 'reactstrap';
import ScrollContainer from 'react-indiana-drag-scroll';
import ToTheTopArrow from 'src/components/shared/ToTheTopArrow';
import MainNavigation from 'src/components/shared/MainNavigation';
import SidebarToggler from 'src/components/shared/SidebarToggler';
import { VFC } from 'react';

const Header: VFC = () => (
  <header id="header">
    <ScrollContainer>
      <Navbar expand="lg" dark className="bg-primary">
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

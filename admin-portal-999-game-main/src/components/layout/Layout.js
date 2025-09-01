import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => setSidebarOpen((open) => !open);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <TopNavbar onSidebarToggle={handleSidebarToggle} />
        <div className="content-wrapper">
          <Container fluid className="content-container">
            {children}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default Layout;

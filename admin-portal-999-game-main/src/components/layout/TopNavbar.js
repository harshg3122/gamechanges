import React from 'react';
import { FaBars } from 'react-icons/fa';
import './TopNavbar.css';

const TopNavbar = ({ onSidebarToggle }) => (
  <nav className="top-navbar">
    <button
      className="sidebar-toggle"
      aria-label="Toggle sidebar"
      onClick={onSidebarToggle}
    >
      <FaBars size={24} />
    </button>
    <div className="navbar-title">Admin Panel</div>
    {/* Add other navbar content */}
  </nav>
);

export default TopNavbar;
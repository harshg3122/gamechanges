import React, { forwardRef } from "react";
import { Nav, Navbar } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import {
  FaTachometerAlt,
  FaUsers,
  FaUserShield,
  FaGamepad,
  FaListAlt,
  FaListOl,
  FaMoneyBillWave,
  FaHistory,
  FaQrcode,
  FaCog,
  FaBell,
  FaChartBar,
  FaFileAlt,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import "./Sidebar.css";

const Sidebar = forwardRef(({ isOpen, toggleSidebar, closeSidebar }, ref) => {
  const { logout, user } = useAuth();

  const adminMenu = [
    { path: "/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
    { path: "/users", icon: FaUsers, label: "User Management" },
    { path: "/agents", icon: FaUserShield, label: "Agent Management" },
    { path: "/results", icon: FaListOl, label: "Number Selection & Results" },
    {
      path: "/withdrawals",
      icon: FaMoneyBillWave,
      label: "Withdrawal Requests",
    },
    { path: "/transactions", icon: FaHistory, label: "Transaction History" },
    { path: "/qr-codes", icon: FaQrcode, label: "QR Code Management" },
    { path: "/settings", icon: FaCog, label: "Settings" },
    { path: "/notifications", icon: FaBell, label: "Notifications" },
    { path: "/reports", icon: FaFileAlt, label: "Reports" },
  ];

  const agentMenu = [
    { path: "/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
    { path: "/users", icon: FaUsers, label: "User Management" },
    { path: "/results", icon: FaListOl, label: "Number Selection & Results" },
  ];

  const handleLogout = () => {
    logout();
    if (closeSidebar) {
      closeSidebar();
    }
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked
    if (closeSidebar) {
      closeSidebar();
    }
  };

  return (
    <>
      <div
        ref={ref}
        className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        <div className="sidebar-header">
          <h4 className="sidebar-title">
            <FaUser className="me-2" />
            {isOpen && (
              <span>
                {user?.role === "agent" ? "Agent Panel" : "Admin Panel"}
              </span>
            )}
          </h4>
          {user && (
            <div className="user-info">
              <small className="text-muted">{user.name}</small>
              <small className="text-muted d-block">{user.role}</small>
            </div>
          )}
        </div>

        <Nav className="flex-column sidebar-nav">
          {(user?.role === "agent" ? agentMenu : adminMenu).map(
            (item, index) => (
              <LinkContainer key={index} to={item.path}>
                <Nav.Link className="sidebar-link" onClick={handleNavClick}>
                  <item.icon className="sidebar-icon" />
                  {isOpen && <span className="sidebar-text">{item.label}</span>}
                </Nav.Link>
              </LinkContainer>
            )
          )}

          <Nav.Link className="sidebar-link logout-link" onClick={handleLogout}>
            <FaSignOutAlt className="sidebar-icon" />
            {isOpen && <span className="sidebar-text">Logout</span>}
          </Nav.Link>
        </Nav>
      </div>
      {/* Overlay only when sidebar is open and on mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
          style={{ display: "block" }}
        />
      )}
    </>
  );
});

export default Sidebar;

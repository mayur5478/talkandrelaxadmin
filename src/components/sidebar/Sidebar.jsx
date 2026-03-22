import React, { useState } from "react";
import "./sidebar.scss";
import { Link, useLocation } from "react-router-dom";
import { links } from "./sidebarLink";
import logo from "../assets/logo.png";
import downArrow from "../assets/down-arr.png";
function Sidebar({ isSidebarOpen, closeSidebar }) {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState({});

  // Function to toggle dropdown visibility
  const toggleDropdown = (index) => {
    setOpenDropdowns((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <div className="sidebar">
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}
      <aside
        id="sidebar"
        className={`sidebar ${isSidebarOpen ? "toggle-sidebar" : ""}`}
      >
        <img className="logo" src={logo} alt="logo" />
        <ul className="sidebar-nav" id="sidebar-nav">
          {links.map(({ title, path, icon, type, children }, index) => {
            const isActive = location.pathname.startsWith(path);

            if (type === "button") {
              return (
                <li className="nav-item" key={index}>
                  <Link
                    className={`nav-link ${!isActive ? "collapsed" : ""}`}
                    to={path}
                  >
                    <img src={icon} alt="icon" />
                    <span className="overflow-ellipsis">{title}</span>
                  </Link>
                </li>
              );
            } else if (type === "dropdown") {
              // Dropdown Link
              return (
                <li className="nav-item" key={index}>
                  <div
                    className={`nav-link drop-background ${
                      openDropdowns[index] ? "" : "collapsed"
                    }`}
                    onClick={() => toggleDropdown(index)}
                  >
                    <img src={icon} alt="icon" />
                    <span className="overflow-ellipsis">{title}</span>
                    <img
                      src={downArrow}
                      alt={downArrow}
                      className={`${
                        openDropdowns[index] ? "rotate arr-image" : "arr-image"
                      }  `}
                    />
                  </div>
                  {openDropdowns[index] && (
                    <ul className="nav-content">
                      {children.map((child, childIndex) => (
                        <li
                          className={`${
                            location.pathname.includes(child.path)
                              ? "active drop-tab"
                              : "drop-tab"
                          }`}
                          key={childIndex}
                        >
                          <img src={child.icon} alt={child.icon} />
                          <Link
                            to={child.path}
                            className={`${
                              location.pathname.includes(child.path)
                                ? "active"
                                : ""
                            }`}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            return null;
          })}
        </ul>
      </aside>
    </div>
  );
}

export default Sidebar;

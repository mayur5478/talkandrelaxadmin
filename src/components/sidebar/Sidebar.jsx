import React, { useState } from "react";
import "./sidebar.scss";
import { Link, useLocation } from "react-router-dom";
import { links } from "./sidebarLink";
import logo from "../assets/logo.png";
import downArrow from "../assets/down-arr.png";

function Sidebar({ isSidebarOpen, closeSidebar }) {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (index) => {
    setOpenDropdowns((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? "show" : ""}`} 
        onClick={closeSidebar}
      ></div>
      <aside
        id="sidebar"
        className={`sidebar ${isSidebarOpen ? "toggle-sidebar" : ""}`}
      >
        <div className="logo-container">
          <img className="logo" src={logo} alt="logo" />
        </div>
        <ul className="sidebar-nav">
          {links.map(({ title, path, icon, type, children }, index) => {
            const isActive = location.pathname.startsWith(path);
            const isDropdownOpen = !!openDropdowns[index];

            if (type === "button") {
              return (
                <li className="nav-item" key={index}>
                  <Link
                    className={`nav-link ${isActive ? "active" : ""}`}
                    to={path}
                    onClick={closeSidebar}
                  >
                    <img src={icon} alt={title} />
                    <span className="overflow-ellipsis">{title}</span>
                  </Link>
                </li>
              );
            } else if (type === "dropdown") {
              return (
                <li className="nav-item" key={index}>
                  <div
                    className={`nav-link drop-background ${
                      isDropdownOpen ? "" : "collapsed"
                    }`}
                    onClick={() => toggleDropdown(index)}
                  >
                    <img src={icon} alt={title} />
                    <span className="overflow-ellipsis">{title}</span>
                    <img
                      src={downArrow}
                      alt="Toggle"
                      className={`arr-image ${isDropdownOpen ? "rotate" : ""}`}
                    />
                  </div>
                  {isDropdownOpen && (
                    <ul className="nav-content">
                      {children.map((child, childIndex) => {
                        const isChildActive = location.pathname.includes(child.path);
                        return (
                          <li
                            className={`drop-tab ${isChildActive ? "active" : ""}`}
                            key={childIndex}
                          >
                            <Link
                              to={child.path}
                              className={isChildActive ? "active" : ""}
                              onClick={closeSidebar}
                            >
                              {child.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return null;
          })}
        </ul>
      </aside>
    </>
  );
}

export default Sidebar;

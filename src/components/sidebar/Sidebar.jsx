import React, { useState, useMemo } from "react";
import "./sidebar.scss";
import { Link, useLocation } from "react-router-dom";
import { links } from "./sidebarLink";
import logo from "../assets/logo.png";
import { motion, AnimatePresence } from "framer-motion";

/* ─── animation variants ──────────────────────────────────────────── */

const dropdownVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] },
      opacity: { duration: 0.2, delay: 0.05 },
      staggerChildren: 0.04,
      delayChildren: 0.06,
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.22, ease: "easeIn" },
      opacity: { duration: 0.15 },
    },
  },
};

const dropChildVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit:   { x: -6,  opacity: 0, transition: { duration: 0.12 } },
};

const navItemVariants = {
  hidden:  { x: -16, opacity: 0 },
  visible: (i) => ({
    x: 0,
    opacity: 1,
    transition: { delay: i * 0.04, duration: 0.26, ease: "easeOut" },
  }),
};

const groupLabelVariants = {
  hidden:  { opacity: 0, x: -8 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: "easeOut" },
  }),
};

/* ─── build sections from flat links array ────────────────────────── */

function buildSections(links) {
  const sections = [];
  let currentGroup = "__none__";
  let currentSection = null;

  links.forEach((link, index) => {
    const group = link.group || null;
    const groupKey = group || "__none__";
    if (groupKey !== currentGroup) {
      currentSection = { group, items: [] };
      sections.push(currentSection);
      currentGroup = groupKey;
    }
    currentSection.items.push({ ...link, index });
  });
  return sections;
}

/* ─── component ───────────────────────────────────────────────────── */

function Sidebar({ isSidebarOpen, closeSidebar }) {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const sections = useMemo(() => buildSections(links), []);

  const toggleDropdown = (index) => {
    setOpenDropdowns((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const renderItem = ({ title, path, icon, type, children, index }) => {
    const isActive = path && location.pathname.startsWith(path);
    const isDropdownOpen = !!openDropdowns[index];

    if (type === "button") {
      return (
        <motion.li
          className="nav-item"
          key={index}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={navItemVariants}
        >
          <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Link
              className={`nav-link ${isActive ? "active" : ""}`}
              to={path}
              onClick={closeSidebar}
            >
              <img src={icon} alt={title} className="nav-icon" />
              <span className="overflow-ellipsis">{title}</span>
              {isActive && (
                <motion.span
                  className="active-pip"
                  layoutId="active-pip"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          </motion.div>
        </motion.li>
      );
    }

    if (type === "dropdown") {
      const anyChildActive = children?.some((c) => location.pathname.includes(c.path));
      return (
        <motion.li
          className="nav-item"
          key={index}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={navItemVariants}
        >
          <motion.div
            className={`nav-link drop-background ${isDropdownOpen ? "open" : ""} ${anyChildActive ? "child-active" : ""}`}
            onClick={() => toggleDropdown(index)}
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <img src={icon} alt={title} className="nav-icon" />
            <span className="overflow-ellipsis">{title}</span>
            <motion.span
              className="arr-icon"
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              ▾
            </motion.span>
          </motion.div>

          <AnimatePresence initial={false}>
            {isDropdownOpen && (
              <motion.ul
                className="nav-content"
                key="dropdown-content"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={dropdownVariants}
                style={{ overflow: "hidden" }}
              >
                {children.map((child, childIndex) => {
                  const isChildActive = location.pathname.includes(child.path);
                  return (
                    <motion.li
                      className={`drop-tab ${isChildActive ? "active" : ""}`}
                      key={childIndex}
                      variants={dropChildVariants}
                    >
                      <Link
                        to={child.path}
                        className={isChildActive ? "active" : ""}
                        onClick={closeSidebar}
                      >
                        <span className="drop-dot" />
                        {child.title}
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.li>
      );
    }

    return null;
  };

  /* ── track a global stagger counter across all sections ── */
  let staggerCounter = 0;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      <aside id="sidebar" className={`sidebar ${isSidebarOpen ? "toggle-sidebar" : ""}`}>
        {/* Logo */}
        <div className="logo-container">
          <motion.img
            className="logo"
            src={logo}
            alt="logo"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        </div>

        {/* Navigation */}
        <ul className="sidebar-nav">
          {sections.map((section, sIdx) => {
            const groupStagger = staggerCounter;
            staggerCounter += section.items.length + (section.group ? 1 : 0);

            return (
              <React.Fragment key={sIdx}>
                {/* Section label */}
                {section.group && (
                  <motion.li
                    className="nav-group-label"
                    custom={groupStagger}
                    initial="hidden"
                    animate="visible"
                    variants={groupLabelVariants}
                  >
                    <span>{section.group}</span>
                  </motion.li>
                )}
                {section.items.map((item) => {
                  const itemStagger = staggerCounter;
                  // index already set above, no increment needed here since
                  // staggerCounter was computed per-section before the loop
                  return renderItem({ ...item, index: item.index });
                })}
              </React.Fragment>
            );
          })}
        </ul>

        {/* Sidebar footer */}
        <motion.div
          className="sidebar-footer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="footer-brand">Talk &amp; Relax</div>
          <div className="footer-version">Admin v1.0</div>
        </motion.div>
      </aside>
    </>
  );
}

export default Sidebar;

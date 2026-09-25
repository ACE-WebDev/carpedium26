"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./navbar.css";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about-us" },
  { label: "Events", href: "/events" },
  { label: "Sponsors", href: "/#sponsors" },
  { label: "Merch", href: "/merch" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLinkClick = (e, href) => {
    setMenuOpen(false);

    // Smooth-scroll to hash section if already on home page
    if (href.startsWith("/#") && pathname === "/") {
      const targetId = href.replace("/#", "");
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 w-full">
        <div className="bod">
          {/* Mobile Hamburger Button (Three Lines) */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>

          {/* Desktop Left Nav Links */}
          <Link
            href="/"
            className={`nav-link desktop-link ${pathname === "/" ? "active" : ""}`}
            onClick={(e) => handleLinkClick(e, "/")}
          >
            Home
          </Link>
          <Link
            href="/#about-us"
            className="nav-link desktop-link"
            onClick={(e) => handleLinkClick(e, "/#about-us")}
          >
            About
          </Link>
          <Link
            href="/events"
            className={`nav-link desktop-link ${pathname === "/events" ? "active" : ""}`}
            onClick={(e) => handleLinkClick(e, "/events")}
          >
            Events
          </Link>

          {/* Center Logo with Oval Background Dip */}
          <div className="oval-nav">
            <Link href="/" className="navbar-logo" role="img" aria-label="Carpe Diem" />
          </div>

          {/* Desktop Right Nav Links */}
          <Link
            href="/#sponsors"
            className="nav-link desktop-link"
            onClick={(e) => handleLinkClick(e, "/#sponsors")}
          >
            Sponsors
          </Link>
          <Link
            href="/merch"
            className={`nav-link desktop-link ${pathname === "/merch" ? "active" : ""}`}
            onClick={(e) => handleLinkClick(e, "/merch")}
          >
            Merch
          </Link>
          <Link
            href="/#contact"
            className="nav-link desktop-link"
            onClick={(e) => handleLinkClick(e, "/#contact")}
          >
            Contact
          </Link>

          {/* Spacer to keep center logo balanced on mobile */}
          <div className="mobile-spacer" aria-hidden="true" />
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {menuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidepanel Drawer (Transparent Glassy Layer) */}
      <aside
        className={`mobile-sidepanel ${menuOpen ? "open" : ""}`}
        aria-label="Mobile Navigation"
      >
        {/* Top-Right Circular Green Close Button */}
        <button
          type="button"
          className="sidepanel-close-btn"
          onClick={() => setMenuOpen(false)}
          aria-label="Close Navigation Menu"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1b2b3c"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Vertical Links List */}
        <div className="sidepanel-links">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`sidepanel-link ${isActive ? "active" : ""}`}
                onClick={(e) => handleLinkClick(e, href)}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Vintage Compass Artwork at Bottom-Right */}
        <div className="sidepanel-compass" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/compass.png"
            alt=""
            className="sidepanel-compass-img"
          />
        </div>
      </aside>
    </>
  );
}

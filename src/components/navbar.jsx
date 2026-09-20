import "./navbar.css";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 z-50 w-full">
      <div className="bod">
        <button className="nav-link">Home</button>
        <button className="nav-link">About</button>
        <button className="nav-link">Events</button>
        <div className="oval-nav"><div className="navbar-logo" role="img" aria-label="Carpe Diem" /></div>
        <button className="nav-link">Sponsors</button>
        <button className="nav-link">Merch</button>
        <button className="nav-link">Contact</button>
      </div>
      
    </nav>
  );
}

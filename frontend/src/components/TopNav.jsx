import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function TopNav() {
  const { isLoggedIn, logout, user } = useAuth();

  return (
    <header className="topbar">
      <div>
        <h1>AptHive</h1>
        <p className="subtitle">Apartment community workspace</p>
      </div>
      <nav>
        <NavLink to="/">Dashboard</NavLink>
        {!isLoggedIn ? <NavLink to="/login">Login</NavLink> : null}
        {!isLoggedIn ? <NavLink to="/register">Register</NavLink> : null}
        {isLoggedIn ? <button onClick={logout}>Logout</button> : null}
      </nav>
      {isLoggedIn ? <p className="user-chip">{user?.fullName}</p> : null}
    </header>
  );
}

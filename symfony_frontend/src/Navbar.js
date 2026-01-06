import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={styles.nav}>
      <h3 style={styles.logo}>SmartTutor</h3>

      <div>
        <Link to="/auth/register" style={styles.link}>
          Register
        </Link>
        <Link to="/auth/login" style={styles.link}>
          Login
        </Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    background: "#222",
  },
  logo: {
    color: "#fff",
    margin: 0,
  },
  link: {
    color: "#fff",
    marginLeft: "20px",
    textDecoration: "none",
    fontSize: "16px",
  },
};

export default Navbar;

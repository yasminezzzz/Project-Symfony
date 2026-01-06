import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    // Hardcoded admin
    if (form.email === "admin@test.com" && form.password === "admin123") {
      navigate(`/Pages/PageAdmin`, {
        state: { email: form.email, role: "ROLE_ADMIN", id: 0 },
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      const role = data.role;
      const userId = data.id;

      if (role === "ROLE_STUDENT") {
        navigate(`/student/${userId}`, { state: { email: data.email, role, id: userId } });
      } else if (role === "ROLE_TUTOR") {
        navigate(`/tutor/${userId}`, { state: { email: data.email, role, id: userId } });
      } else {
        setError("Unknown role");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Login</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundImage: "url('https://photoshopgimptutorials.wordpress.com/wp-content/uploads/2012/08/spotted-background2.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  form: {
    background: "rgba(255,255,255,0.95)",
    padding: "2rem",
    width: "360px",
    borderRadius: "10px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
  },
  title: { textAlign: "center", marginBottom: "1rem", color: "#333" },
  input: { width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  button: { width: "100%", padding: "12px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
  error: { color: "red", fontSize: "14px", marginBottom: "10px", textAlign: "center" },
};

export default Login;

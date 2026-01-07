import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password || !form.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:8001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Registration failed");

      // Redirection vers /home avec le role
      navigate("/auth/login", { state: { email: data.email, role: data.role } });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Create Account</h2>
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
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          style={styles.input}
        />

        <select name="role" value={form.role} onChange={handleChange} style={styles.select}>
          <option value="student">Student</option>
          <option value="tutor">Tutor</option>
        </select>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Registering..." : "Register"}
        </button>
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
  select: { width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", background: "#fff" },
  button: { width: "100%", padding: "12px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
  error: { color: "red", fontSize: "14px", marginBottom: "10px", textAlign: "center" },
};

export default Register;
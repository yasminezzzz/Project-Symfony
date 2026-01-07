import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Register from "./auth/register";
import Login from "./auth/login";
import Navbar from "./Navbar";
import PageAdmin from "./Pages/PageAdmin";
import TutorPage from "./Pages/PageTutorial";
import StudentDashboard from "./Pages/PageStudent";
import PageCourse from "./Pages/PageCourse";
import Home from "./Home";   // ✅ IMPORT HOME

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* ✅ Home page */}
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/login" element={<Login />} />

        {/* Dashboards */}
        <Route path="/Pages/PageAdmin" element={<PageAdmin />} />
        <Route path="/tutor/:tutorialId" element={<TutorPage />} />
        <Route path="/student/:studentId" element={<StudentDashboard />} />

        {/* Courses */}
        <Route path="/courses/:groupId" element={<PageCourse />} />
      </Routes>
    </Router>
  );
}

export default App;

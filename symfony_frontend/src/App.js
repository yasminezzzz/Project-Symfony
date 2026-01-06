import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Register from "./auth/register";
import Login from "./auth/login";
import Navbar from "./Navbar";
import PageAdmin from "./Pages/PageAdmin";
import TutorPage from "./Pages/PageTutorial";
import StudentDashboard from "./Pages/PageStudent";
import PageCourse from "./Pages/PageCourse"; // ✅ NEW

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/auth/register" replace />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/login" element={<Login />} />

        <Route path="/Pages/PageAdmin" element={<PageAdmin />} />
        <Route path="/tutor/:tutorialId" element={<TutorPage />} />

        {/* ✅ Assign Course page */}
<Route path="/PageCourse" element={<PageCourse />} />

        {/* ✅ Student interface */}
        <Route path="/student/:studentId" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

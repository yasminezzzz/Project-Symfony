import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Slider images
import slide1 from "./assets/slidebar1.jpg";
import slide2 from "./assets/slidebar2.jpg";

// Subject images
import JavascriptImg from "./assets/Javascript.png";
import PythonImg from "./assets/Python.svg.png";
import CppImg from "./assets/c++.jpg";
import CloudImg from "./assets/Cloud.jpg";
import LinuxImg from "./assets/Linux.jpg";
import KubernetesImg from "./assets/Kubernetes.png";

// Image pour la section info
import HomeImage from "./assets/home.webp";

// Map IDs → images
const subjectImages = {
  1: JavascriptImg,
  2: PythonImg,
  3: CppImg,
  4: CloudImg,
  5: LinuxImg,
  6: KubernetesImg,
};

const Home = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const sliderImages = [slide1, slide2];
  const carouselRef = useRef(null);

  // Slider automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Charger les subjects depuis le backend
  useEffect(() => {
    axios
      .get("http://localhost:8082/api/subjects")
      .then((res) => setSubjects(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Scroll manuel du carousel
  const scroll = (direction) => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.firstChild.clientWidth + 20; // largeur + gap
      carouselRef.current.scrollBy({
        left: direction === "left" ? -cardWidth * 4 : cardWidth * 4, // 4 cartes à la fois
        behavior: "smooth",
      });
    }
  };

  const goToLogin = () => navigate("/auth/login");

  return (
    <>
      {/* Slider principal */}
      <div style={{ paddingTop: "60px", position: "relative" }}>
        <img
          src={sliderImages[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          style={{ width: "100%", height: "400px", objectFit: "cover" }}
        />
        {/* Flèches slider */}
        <button
          onClick={() =>
            setCurrentIndex(
              (currentIndex - 1 + sliderImages.length) % sliderImages.length
            )
          }
          style={{
            position: "absolute",
            top: "50%",
            left: "20px",
            transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.5)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            padding: "10px",
            cursor: "pointer",
            fontSize: "20px",
          }}
        >
          &#10094;
        </button>
        <button
          onClick={() =>
            setCurrentIndex((currentIndex + 1) % sliderImages.length)
          }
          style={{
            position: "absolute",
            top: "50%",
            right: "20px",
            transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.5)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            padding: "10px",
            cursor: "pointer",
            fontSize: "20px",
          }}
        >
          &#10095;
        </button>

        {/* Bouton Start Learning */}
        <button
          onClick={goToLogin}
          style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          Start Learning Now
        </button>
      </div>

      {/* Carousel subjects */}
      <div style={{ position: "relative", marginTop: "40px", padding: "0 40px" }}>
        {/* Flèche gauche */}
        <button
          onClick={() => scroll("left")}
          style={{
            position: "absolute",
            left: 0,
            top: "35%",
            zIndex: 10,
            background: "rgba(0,0,0,0.5)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            padding: "10px",
            cursor: "pointer",
          }}
        >
          &#10094;
        </button>

        {/* Flèche droite */}
        <button
          onClick={() => scroll("right")}
          style={{
            position: "absolute",
            right: 0,
            top: "35%",
            zIndex: 10,
            background: "rgba(0,0,0,0.5)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            padding: "10px",
            cursor: "pointer",
          }}
        >
          &#10095;
        </button>

        <div
          ref={carouselRef}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollBehavior: "smooth",
            gap: "20px",
            padding: "20px 0",
          }}
        >
          {subjects.map((subject) => (
            <div
              key={subject.id}
              style={{
                flex: "0 0 23%", // 4 cartes visibles
                border: "1px solid #ddd",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                cursor: "pointer",
                textAlign: "center",
              }}
              onClick={() => navigate(`/subject/${subject.id}`)}
            >
              <div
                style={{
                  width: "100%",
                  height: "150px",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={subjectImages[subject.id]}
                  alt={subject.name}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>
              <div
                style={{
                  padding: "10px",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                {subject.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section info avec image à droite */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "60px 40px",
          gap: "40px",
          flexWrap: "wrap",
        }}
      >
        {/* Texte à gauche */}
        <div style={{ flex: "1", minWidth: "300px" }}>
          <h2 style={{ marginBottom: "20px" }}>Inspired By Excellence & Innovation</h2>
          <p style={{ fontSize: "1rem", color: "#555", lineHeight: "1.6" }}>
            We offer a wide range of high-quality courses, including top IT certification
            reviewers and practice tests. Learn at your own pace and improve your skills
            efficiently.
          </p>
        </div>

        {/* Image à droite */}
        <div style={{ flex: "1", minWidth: "300px" }}>
          <img
            src={HomeImage}
            alt="Home Illustration"
            style={{ width: "100%", height: "auto", borderRadius: "10px" }}
          />
        </div>
      </div>
    </>
  );
};

export default Home;

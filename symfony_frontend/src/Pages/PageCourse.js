import React, { useEffect, useState, useRef } from "react";

const API_BASE = "http://localhost:8001/api";

export default function PageCourse() {
  const [groupId, setGroupId] = useState(1);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("video");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");


  const videoRefs = useRef({});

  const fileTypes = [
    { value: "video", label: "Video", icon: "🎥", accept: "video/*", color: "#FF6B6B", bgColor: "#FFE5E5" },
    { value: "pdf", label: "PDF", icon: "📄", accept: ".pdf", color: "#4ECDC4", bgColor: "#E0F7F5" },
    { value: "word", label: "Word", icon: "📝", accept: ".doc,.docx", color: "#45B7D1", bgColor: "#E3F2FD" },
    { value: "powerpoint", label: "PowerPoint", icon: "📊", accept: ".ppt,.pptx", color: "#96CEB4", bgColor: "#F0F9F1" },
    { value: "image", label: "Image", icon: "🖼️", accept: "image/*", color: "#FFEAA7", bgColor: "#FFF9E6" },
    { value: "other", label: "Other", icon: "📁", accept: "*", color: "#DDA0DD", bgColor: "#F8E8F8" },
  ];

  // Filter courses based on active tab
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "videos") {
      return matchesSearch && course.type === "video";
    } else if (activeTab === "files") {
      return matchesSearch && course.type !== "video";
    }
    return matchesSearch; // "all" tab
  });

  // Separate videos and files for display
  const videos = filteredCourses.filter(c => c.type === "video");
  const files = filteredCourses.filter(c => c.type !== "video");

  // ------------------------
  // Load current user role
  // ------------------------
  const loadUserRole = async () => {
    try {
      const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load user info");
      const data = await res.json();
      setUserRole(data.role || null);
    } catch (err) {
      console.error(err);
      setUserRole(null);
    }
  };

  // ------------------------
  // Load courses
  // ------------------------
  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/groups/${groupId}/courses`);
      const data = await res.json();

      const localVideos = JSON.parse(localStorage.getItem("courseVideos") || "[]");
      const allCourses = [...data, ...localVideos.map(v => ({ ...v, isLocal: true }))];

      setCourses(allCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserRole();
    loadCourses();
  }, [groupId]);

  const saveVideoToLocalStorage = (videoFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const newVideo = {
          id: Date.now(),
          title,
          type: "video",
          videoData: e.target.result,
          createdAt: new Date().toISOString()
        };
        const videos = JSON.parse(localStorage.getItem("courseVideos") || "[]");
        videos.push(newVideo);
        localStorage.setItem("courseVideos", JSON.stringify(videos));
        resolve(newVideo);
      };
      reader.onerror = reject;
      reader.readAsDataURL(videoFile);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !type || !file) {
      alert("Please fill all fields");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (type === "video") {
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) { clearInterval(interval); return 90; }
            return prev + 10;
          });
        }, 200);

        await saveVideoToLocalStorage(file);
        clearInterval(interval);
        setUploadProgress(100);
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("type", type);
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/groups/${groupId}/courses`, {
          method: "POST",
          body: formData
        });
        if (!res.ok) throw new Error("Error uploading file");
        setUploadProgress(100);
      }

      // Reset form
      setTitle("");
      setType("video");
      setFile(null);
      setFileName("");

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      loadCourses();
    } catch (err) {
      console.error(err);
      alert(err.message);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  };

  const getFileUrl = (course) => {
    if (course.type === "video" && course.isLocal) return course.videoData;
    return `${API_BASE}/courses/${course.id}/file`;
  };

  const saveVideoProgress = (courseId) => {
    const videoEl = videoRefs.current[courseId];
    if (videoEl) {
      const progress = videoEl.currentTime;
      const storedProgress = JSON.parse(localStorage.getItem("videoProgress") || "{}");
      storedProgress[courseId] = progress;
      localStorage.setItem("videoProgress", JSON.stringify(storedProgress));
    }
  };

  const restoreVideoProgress = (courseId) => {
    const videoEl = videoRefs.current[courseId];
    if (videoEl) {
      const storedProgress = JSON.parse(localStorage.getItem("videoProgress") || "{}");
      if (storedProgress[courseId]) {
        videoEl.currentTime = storedProgress[courseId];
      }
    }
  };

  const deleteCourse = async (id, isLocal = false) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    if (isLocal) {
      const videos = JSON.parse(localStorage.getItem("courseVideos") || "[]");
      localStorage.setItem("courseVideos", JSON.stringify(videos.filter(v => v.id !== id)));
    } else {
      await fetch(`${API_BASE}/courses/${id}`, { method: "DELETE" });
    }
    loadCourses();
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      padding: "2rem",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: "1400px",
      margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "2.5rem",
            background: "linear-gradient(45deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "bold"
          }}>
            📚 Course Management
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              borderRadius: "50px",
              border: "1px solid #ddd",
              width: "300px",
              fontSize: "0.9rem",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }}
          />
          <span style={{
            position: "absolute",
            left: "15px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#999"
          }}>
            🔍
          </span>
        </div>
      </div>

      {/* Upload Form for Tutors */}
      {userRole === "ROLE_TUTOR" && (
        <div style={{
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          padding: "2rem",
          borderRadius: "15px",
          marginBottom: "2rem",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ marginTop: 0, color: "#333", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.5rem" }}>📤</span> Upload New Course Material
          </h2>
          <form onSubmit={handleSubmit} style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <input
                placeholder="Course Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isUploading}
                required
                style={{
                  flex: 1,
                  minWidth: "200px",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem"
                }}
              />

              <select
                value={type}
                onChange={e => {
                  setType(e.target.value);
                  setFile(null);
                  setFileName("");
                }}
                disabled={isUploading}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  minWidth: "150px"
                }}
              >
                {fileTypes.map(ft => (
                  <option key={ft.value} value={ft.value}>
                    {ft.icon} {ft.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="file"
                  id="file-upload"
                  accept={fileTypes.find(ft => ft.value === type).accept}
                  onChange={handleFileChange}
                  required
                  disabled={isUploading}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "2px dashed #667eea",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                />
                <label
                  htmlFor="file-upload"
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#667eea",
                    pointerEvents: "none"
                  }}
                >
                  {fileName || `Choose ${type} file`}
                </label>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                style={{
                  padding: "0.75rem 2rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  opacity: isUploading ? 0.7 : 1
                }}
                onMouseOver={(e) => !isUploading && (e.target.style.transform = "scale(1.05)")}
                onMouseOut={(e) => e.target.style.transform = "scale(1)"}
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : "Upload"}
              </button>
            </div>

            {isUploading && (
              <div style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}>
                <div style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #4CAF50, #8BC34A)",
                      transition: "width 0.3s"
                    }}
                  />
                </div>
                <p style={{ margin: "0.5rem 0 0", textAlign: "center", color: "#666" }}>
                  Uploading your file...
                </p>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
        borderBottom: "2px solid #f0f0f0",
        paddingBottom: "0.5rem"
      }}>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: activeTab === "all" ? "#667eea" : "transparent",
            color: activeTab === "all" ? "white" : "#666",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "0.95rem",
            transition: "all 0.3s"
          }}
        >
          📦 All ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: activeTab === "videos" ? "#FF6B6B" : "transparent",
            color: activeTab === "videos" ? "white" : "#666",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "0.95rem",
            transition: "all 0.3s"
          }}
        >
          🎥 Videos ({courses.filter(c => c.type === "video").length})
        </button>
        <button
          onClick={() => setActiveTab("files")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: activeTab === "files" ? "#4ECDC4" : "transparent",
            color: activeTab === "files" ? "white" : "#666",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "0.95rem",
            transition: "all 0.3s"
          }}
        >
          📁 Files ({courses.filter(c => c.type !== "video").length})
        </button>
      </div>

      {/* Courses Display */}
      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px"
        }}>
          <div style={{
            textAlign: "center",
            animation: "pulse 1.5s infinite"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
            <p style={{ color: "#666" }}>Loading courses...</p>
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem",
          background: "#f9f9f9",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📭</div>
          <h3 style={{ color: "#666", marginBottom: "0.5rem" }}>No courses found</h3>
          <p style={{ color: "#999" }}>
            {searchTerm
              ? `No results for "${searchTerm}" in ${activeTab === "videos" ? "videos" : activeTab === "files" ? "files" : "all courses"}`
              : `No ${activeTab === "videos" ? "videos" : activeTab === "files" ? "files" : "courses"} available`}
          </p>
        </div>
      ) : (
        <div>
          {/* Videos Section (only shown when activeTab is 'all' or 'videos') */}
          {(activeTab === "all" || activeTab === "videos") && videos.length > 0 && (
            <div style={{ marginBottom: "3rem" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem"
              }}>
                <h2 style={{
                  margin: 0,
                  color: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <span style={{ fontSize: "1.5rem" }}>🎥</span> Video Courses ({videos.length})
                </h2>
                {activeTab === "all" && (
                  <button
                    onClick={() => setActiveTab("videos")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#FFE5E5",
                      color: "#FF6B6B",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    View all videos →
                  </button>
                )}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.5rem"
              }}>
                {videos.map(c => (
                  <div
                    key={c.id}
                    style={{
                      background: "white",
                      border: "1px solid #eaeaea",
                      borderRadius: "12px",
                      padding: "1rem",
                      transition: "all 0.3s ease",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.08)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={{ position: "relative", marginBottom: "1rem" }}>
                      <video
                        ref={el => { if(el) videoRefs.current[c.id] = el; }}
                        controls
                        style={{
                          width: "100%",
                          height: "180px",
                          borderRadius: "8px",
                          backgroundColor: "#000",
                          objectFit: "cover"
                        }}
                        onTimeUpdate={() => saveVideoProgress(c.id)}
                        onLoadedMetadata={() => restoreVideoProgress(c.id)}
                        poster={c.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3EVideo%3C/text%3E%3C/svg%3E"}
                      >
                        <source src={getFileUrl(c)} type="video/mp4" />
                      </video>
                      <div style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.8rem"
                      }}>
                        🎥 Video
                      </div>
                    </div>

                    <div>
                      <h4 style={{
                        margin: "0 0 0.5rem 0",
                        fontSize: "1.1rem",
                        color: "#333",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {c.title}
                      </h4>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.85rem",
                        color: "#666"
                      }}>
                        <span>
                          📅 {c.createdAt ? formatDate(c.createdAt) : "Unknown date"}
                        </span>
                        {c.isLocal && (
                          <span style={{
                            background: "#FFE5E5",
                            color: "#FF6B6B",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem"
                          }}>
                            Local
                          </span>
                        )}
                      </div>
                    </div>

                    {userRole === "ROLE_TUTOR" && (
                      <div style={{ marginTop: "1rem", textAlign: "right" }}>
                        <button
                          onClick={() => deleteCourse(c.id, c.isLocal)}
                          style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            border: "none",
                            background: "#FF6B6B",
                            color: "white",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            transition: "opacity 0.2s"
                          }}
                          onMouseOver={(e) => e.target.style.opacity = "0.8"}
                          onMouseOut={(e) => e.target.style.opacity = "1"}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section (only shown when activeTab is 'all' or 'files') */}
          {(activeTab === "all" || activeTab === "files") && files.length > 0 && (
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem"
              }}>
                <h2 style={{
                  margin: 0,
                  color: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <span style={{ fontSize: "1.5rem" }}>📁</span> File Courses ({files.length})
                </h2>
                {activeTab === "all" && (
                  <button
                    onClick={() => setActiveTab("files")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#E0F7F5",
                      color: "#4ECDC4",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    View all files →
                  </button>
                )}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1.5rem"
              }}>
                {files.map(c => {
                  const ft = fileTypes.find(f => f.value === c.type);

                  return (
                    <div
                      key={c.id}
                      style={{
                        background: ft?.bgColor || "#f5f5f5",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.08)"
                      }}
                      onClick={() => {
                        setSelectedCourse(c);
                        setShowModal(true);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.08)";
                      }}
                    >
                      <div style={{
                        fontSize: "3rem",
                        marginBottom: "1rem",
                        color: ft?.color || "#000"
                      }}>
                        {ft?.icon || "📁"}
                      </div>

                      <h4 style={{
                        margin: "0 0 0.5rem 0",
                        fontSize: "1rem",
                        color: "#333",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {c.title}
                      </h4>

                      <div style={{
                        display: "inline-block",
                        background: ft?.color || "#000",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        marginBottom: "0.5rem"
                      }}>
                        {ft?.label || "File"}
                      </div>

                      <p style={{
                        margin: "0.5rem 0",
                        fontSize: "0.85rem",
                        color: "#666"
                      }}>
                        📅 {c.createdAt ? formatDate(c.createdAt) : "Unknown date"}
                      </p>

                      {userRole === "ROLE_TUTOR" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCourse(c.id);
                          }}
                          style={{
                            marginTop: "0.5rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "6px",
                            border: "none",
                            background: "rgba(255,255,255,0.7)",
                            color: "#FF6B6B",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => e.target.style.background = "white"}
                          onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.7)"}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      {showModal && selectedCourse && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem"
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "15px",
              maxWidth: "90%",
              maxHeight: "90%",
              overflow: "auto",
              position: "relative",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "#f1f1f1",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                fontSize: "1.2rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>

            <h2 style={{
              marginTop: 0,
              marginBottom: "1.5rem",
              color: "#333",
              borderBottom: "2px solid #f0f0f0",
              paddingBottom: "0.5rem"
            }}>
              {selectedCourse.title}
            </h2>

            {selectedCourse.type === "image" ? (
              <img
                src={getFileUrl(selectedCourse)}
                alt={selectedCourse.title}
                style={{
                  maxWidth: "600px",
                  maxHeight: "400px",
                  borderRadius: "8px",
                  display: "block",
                  margin: "0 auto"
                }}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                  {fileTypes.find(f => f.value === selectedCourse.type)?.icon || "📁"}
                </div>
                <p style={{ marginBottom: "2rem", color: "#666" }}>
                  This is a {selectedCourse.type.toUpperCase()} file
                </p>
                <a
                  href={getFileUrl(selectedCourse)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "1rem 2rem",
                    borderRadius: "8px",
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: "bold",
                    display: "inline-block",
                    transition: "transform 0.2s"
                  }}
                  onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
                  onMouseOut={(e) => e.target.style.transform = "scale(1)"}
                >
                  Open File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }

          ::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
          }

          input:focus, select:focus, button:focus {
            outline: 2px solid #667eea;
            outline-offset: 2px;
          }
        `}
      </style>
    </div>
  );
}
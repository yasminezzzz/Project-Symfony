import React, { useEffect, useState } from "react";

function PageCourse() {
  const [group, setGroup] = useState(null);
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    type: "video", // "video" ou "pdf"
    url: "",
    file: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Récupérer le groupe depuis localStorage
    const savedGroup = localStorage.getItem('selectedGroup');
    if (savedGroup) {
      try {
        const groupData = JSON.parse(savedGroup);
        setGroup(groupData);
        // Charger les cours existants pour ce groupe
        fetchCourses(groupData.id);
      } catch (err) {
        setError("Données de groupe invalides");
        setLoading(false);
      }
    } else {
      setError("Aucun groupe sélectionné. Retournez à la liste des groupes.");
      setLoading(false);
    }
  }, []);

  const fetchCourses = async (groupId) => {
    try {
      // À adapter selon votre API
      const res = await fetch(`http://localhost:8001/api/courses/group/${groupId}`);
      if (!res.ok) throw new Error("Échec du chargement des cours");
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCourse({
        ...newCourse,
        file: file,
        url: URL.createObjectURL(file) // Pour prévisualisation
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!group) {
      setError("Aucun groupe sélectionné");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('groupId', group.id);
      formData.append('title', newCourse.title);
      formData.append('description', newCourse.description);
      formData.append('type', newCourse.type);

      if (newCourse.type === "video") {
        formData.append('videoUrl', newCourse.url);
      } else if (newCourse.file) {
        formData.append('pdfFile', newCourse.file);
      }

      const res = await fetch("http://localhost:8001/api/courses", {
        method: "POST",
        body: formData,
        // Note: Ne pas mettre 'Content-Type' header pour FormData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Échec de l'ajout du cours");
      }

      const savedCourse = await res.json();

      // Ajouter le nouveau cours à la liste
      setCourses([...courses, savedCourse]);

      // Réinitialiser le formulaire
      setNewCourse({
        title: "",
        description: "",
        type: "video",
        url: "",
        file: null
      });

      alert("Cours ajouté avec succès !");

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) return;

    try {
      const res = await fetch(`http://localhost:8001/api/courses/${courseId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setCourses(courses.filter(course => course.id !== courseId));
        alert("Cours supprimé avec succès");
      }
    } catch (err) {
      setError("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.title}>🎓 Gestion des Cours</h1>
          <button
            style={styles.backButton}
            onClick={() => window.history.back()}
          >
            ← Retour aux Groupes
          </button>
        </div>

        {group && (
          <div style={styles.groupCard}>
            <h2 style={styles.groupTitle}>Groupe: {group.name}</h2>
            <p style={styles.groupId}>ID: {group.id}</p>
          </div>
        )}
      </div>

      {error && (
        <div style={styles.errorAlert}>
          ⚠️ {error}
        </div>
      )}

      {/* Formulaire d'ajout de cours */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>➕ Ajouter un Nouveau Cours</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Titre du cours *</label>
              <input
                type="text"
                style={styles.input}
                value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                placeholder="Ex: Introduction à React"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Type de contenu *</label>
              <select
                style={styles.select}
                value={newCourse.type}
                onChange={(e) => setNewCourse({...newCourse, type: e.target.value})}
              >
                <option value="video">🎥 Vidéo</option>
                <option value="pdf">📄 Document PDF</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              value={newCourse.description}
              onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
              placeholder="Description détaillée du cours..."
              rows={3}
            />
          </div>

          {newCourse.type === "video" ? (
            <div style={styles.formGroup}>
              <label style={styles.label}>URL de la vidéo *</label>
              <input
                type="url"
                style={styles.input}
                value={newCourse.url}
                onChange={(e) => setNewCourse({...newCourse, url: e.target.value})}
                placeholder="https://youtube.com/... ou URL de votre vidéo"
                required={newCourse.type === "video"}
              />
              <small style={styles.hint}>Supporte YouTube, Vimeo, ou URLs directes</small>
            </div>
          ) : (
            <div style={styles.formGroup}>
              <label style={styles.label}>Document PDF *</label>
              <input
                type="file"
                style={styles.fileInput}
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                required={newCourse.type === "pdf"}
              />
              {newCourse.file && (
                <div style={styles.filePreview}>
                  📄 {newCourse.file.name} ({(newCourse.file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            style={styles.submitButton}
            disabled={uploading}
          >
            {uploading ? "En cours d'ajout..." : "➕ Ajouter le Cours"}
          </button>
        </form>
      </div>

      {/* Liste des cours existants */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          📚 Cours Existants ({courses.length})
        </h2>

        {courses.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Aucun cours pour ce groupe.</p>
            <p style={styles.emptySubtext}>Commencez par ajouter votre premier cours ci-dessus.</p>
          </div>
        ) : (
          <div style={styles.coursesGrid}>
            {courses.map((course) => (
              <div key={course.id} style={styles.courseCard}>
                <div style={styles.courseHeader}>
                  <div style={styles.courseType}>
                    {course.type === "video" ? "🎥" : "📄"}
                    <span style={styles.typeBadge}>
                      {course.type === "video" ? "Vidéo" : "PDF"}
                    </span>
                  </div>
                  <button
                    style={styles.deleteButton}
                    onClick={() => deleteCourse(course.id)}
                    title="Supprimer ce cours"
                  >
                    🗑️
                  </button>
                </div>

                <h3 style={styles.courseTitle}>{course.title}</h3>
                <p style={styles.courseDesc}>{course.description}</p>

                <div style={styles.courseActions}>
                  {course.type === "video" ? (
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.watchButton}
                    >
                      ▶️ Regarder la vidéo
                    </a>
                  ) : (
                    <a
                      href={course.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.downloadButton}
                    >
                      📥 Télécharger le PDF
                    </a>
                  )}

                  <button
                    style={styles.editButton}
                    onClick={() => alert("Modifier - À implémenter")}
                  >
                    ✏️ Modifier
                  </button>
                </div>

                <div style={styles.courseMeta}>
                  <span style={styles.metaItem}>📅 {new Date(course.createdAt).toLocaleDateString()}</span>
                  <span style={styles.metaItem}>👁️ {course.views || 0} vues</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: "2rem",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  loading: {
    textAlign: "center",
    padding: "4rem",
    fontSize: "1.3rem",
    color: "#3498db",
  },
  header: {
    marginBottom: "2rem",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: {
    color: "#2c3e50",
    margin: 0,
    fontSize: "2.2rem",
    background: "linear-gradient(90deg, #3498db, #2ecc71)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  backButton: {
    background: "#fff",
    color: "#495057",
    padding: "10px 20px",
    border: "2px solid #e0e6ed",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "all 0.3s",
    textDecoration: "none",
    display: "inline-block",
  },
  groupCard: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    borderLeft: "5px solid #3498db",
  },
  groupTitle: {
    margin: "0 0 0.5rem 0",
    color: "#2c3e50",
  },
  groupId: {
    margin: 0,
    color: "#7f8c8d",
    fontSize: "0.9rem",
  },
  errorAlert: {
    background: "#f8d7da",
    color: "#721c24",
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "2rem",
    border: "1px solid #f5c6cb",
  },
  section: {
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    marginBottom: "2rem",
  },
  sectionTitle: {
    color: "#2c3e50",
    marginTop: 0,
    marginBottom: "1.5rem",
    fontSize: "1.5rem",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "0.5rem",
  },
  form: {
    maxWidth: "800px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "600",
    color: "#2c3e50",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    border: "2px solid #e0e6ed",
    borderRadius: "8px",
    fontSize: "1rem",
    transition: "border-color 0.3s",
  },
  select: {
    width: "100%",
    padding: "12px 15px",
    border: "2px solid #e0e6ed",
    borderRadius: "8px",
    fontSize: "1rem",
    background: "white",
  },
  textarea: {
    width: "100%",
    padding: "12px 15px",
    border: "2px solid #e0e6ed",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  fileInput: {
    width: "100%",
    padding: "12px 0",
  },
  filePreview: {
    marginTop: "0.5rem",
    padding: "10px",
    background: "#f8f9fa",
    borderRadius: "6px",
    fontSize: "0.9rem",
    color: "#495057",
  },
  hint: {
    display: "block",
    marginTop: "0.5rem",
    color: "#7f8c8d",
    fontSize: "0.85rem",
  },
  submitButton: {
    background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
    color: "white",
    border: "none",
    padding: "14px 30px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1rem",
    transition: "all 0.3s",
    marginTop: "1rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    background: "#f8f9fa",
    borderRadius: "10px",
  },
  emptyText: {
    fontSize: "1.2rem",
    color: "#6c757d",
    marginBottom: "0.5rem",
  },
  emptySubtext: {
    color: "#95a5a6",
  },
  coursesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "1.5rem",
  },
  courseCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.5rem",
    transition: "all 0.3s",
  },
  courseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
  },
  courseType: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  typeBadge: {
    background: "#e3f2fd",
    color: "#1976d2",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#e74c3c",
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "5px",
  },
  courseTitle: {
    color: "#2c3e50",
    margin: "0 0 0.8rem 0",
    fontSize: "1.2rem",
  },
  courseDesc: {
    color: "#5a6c7d",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    marginBottom: "1.5rem",
  },
  courseActions: {
    display: "flex",
    gap: "0.8rem",
    marginBottom: "1rem",
  },
  watchButton: {
    flex: 1,
    background: "#3498db",
    color: "white",
    textDecoration: "none",
    padding: "10px 15px",
    borderRadius: "6px",
    textAlign: "center",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  downloadButton: {
    flex: 1,
    background: "#2ecc71",
    color: "white",
    textDecoration: "none",
    padding: "10px 15px",
    borderRadius: "6px",
    textAlign: "center",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  editButton: {
    background: "#f8f9fa",
    color: "#495057",
    border: "1px solid #e0e6ed",
    padding: "10px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  courseMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    color: "#7f8c8d",
    borderTop: "1px solid #eee",
    paddingTop: "0.8rem",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
  },
};

export default PageCourse;
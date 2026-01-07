import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function TutorCreateTest() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], correctOption: 0, score: 1 },
  ]);
  const [msg, setMsg] = useState("");
  const [tests, setTests] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [editingTestId, setEditingTestId] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [selectedTest, setSelectedTest] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchTests();
    fetchGroups();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/subjects");
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch {
      setMsg("Cannot load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/tutor/tests");
      const data = await res.json();
      setTests(Array.isArray(data) ? data : []);
    } catch {
      setMsg("Cannot fetch tests");
    }
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await fetch("http://localhost:8001/api/tutor/groups");
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setMsg("Cannot load groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctOption: 0, score: 1 }]);
  };

  const updateQuestionText = (i, val) => {
    const copy = [...questions];
    copy[i].text = val;
    setQuestions(copy);
  };

  const updateOption = (qIndex, oIndex, val) => {
    const copy = [...questions];
    copy[qIndex].options[oIndex] = val;
    setQuestions(copy);
  };

  const updateScore = (i, val) => {
    const copy = [...questions];
    copy[i].score = Number(val);
    setQuestions(copy);
  };

  const updateCorrectOption = (qIndex, val) => {
    const copy = [...questions];
    copy[qIndex].correctOption = Number(val);
    setQuestions(copy);
  };

  const submit = async () => {
    if (!subjectId) return setMsg("Select a subject");
    for (let q of questions) if (!q.text || q.options.some(o => !o)) return setMsg("Complete all questions");

    const quizOptions = questions.map(q => ({
      question: q.text,
      options: q.options,
      correctOption: q.correctOption,
      score: q.score,
    }));
    localStorage.setItem("quiz_options", JSON.stringify(quizOptions));

    try {
      let url = "http://localhost:8001/api/tutor/tests";
      let method = "POST";
      if (editingTestId) {
        url += `/${editingTestId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subjectId,
          questions: questions.map(q => q.text),
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setMsg(editingTestId ? "Test updated ✅" : "Test created ✅");
      setSubjectId("");
      setQuestions([{ text: "", options: ["", "", "", ""], correctOption: 0, score: 1 }]);
      setEditingTestId(null);
      fetchTests();
      setActiveTab("my-tests");
    } catch {
      setMsg("Error saving test");
    }
  };

  const deleteTest = async id => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    try {
      const res = await fetch(`http://localhost:8001/api/tutor/tests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMsg("Test deleted ✅");
      fetchTests();
      if (selectedTest?.id === id) {
        setSelectedTest(null);
      }
    } catch {
      setMsg("Error deleting test");
    }
  };

  const editTest = test => {
    setEditingTestId(test.id);
    setSubjectId(test.subjectId);
    const storedOptions = JSON.parse(localStorage.getItem("quiz_options")) || [];
    setQuestions(
      test.questions.map(q => {
        const quiz = storedOptions.find(o => o.question === q) || { options: ["", "", "", ""], correctOption: 0, score: 1 };
        return { text: q, options: quiz.options, correctOption: quiz.correctOption, score: quiz.score };
      })
    );
    setActiveTab("create");
    window.scrollTo(0, 0);
  };

  const quizOptions = JSON.parse(localStorage.getItem("quiz_options")) || [];
  const getOptionsForQuestion = qText => quizOptions.find(q => q.question === qText);

  const clearForm = () => {
    setSubjectId("");
    setQuestions([{ text: "", options: ["", "", "", ""], correctOption: 0, score: 1 }]);
    setEditingTestId(null);
    setMsg("");
  };

  // Fonction pour rediriger vers la page des cours
  const handleAssignCourse = (groupId, groupName) => {
    // Stocker les informations du groupe pour les utiliser dans PageCourse
    localStorage.setItem('selectedGroup', JSON.stringify({
      id: groupId,
      name: groupName
    }));

    // Rediriger vers la page PageCourse
    navigate("/courses/${groupId");
  };

  const styles = {
    tutorContainer: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: '#f5f7fa'
    },
    sidebar: {
      width: '250px',
      background: 'linear-gradient(180deg, #2c3e50 0%, #1a2530 100%)',
      color: 'white',
      padding: '20px 0',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      position: 'fixed',
      height: '100vh',
      overflowY: 'auto'
    },
    sidebarHeader: {
      padding: '0 20px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      marginBottom: '20px'
    },
    sidebarMenu: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '0 20px'
    },
    sidebarBtn: {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      color: 'white',
      padding: '12px 15px',
      borderRadius: '8px',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: '0.95rem',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    sidebarBtnActive: {
      background: '#3498db',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    },
    sidebarInfo: {
      marginTop: '30px',
      padding: '15px',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '8px',
      fontSize: '0.9rem'
    },
    mainContent: {
      flex: '1',
      marginLeft: '250px',
      padding: '30px',
      maxWidth: 'calc(100% - 250px)'
    },
    contentHeader: {
      marginBottom: '30px'
    },
    message: {
      padding: '12px 20px',
      borderRadius: '8px',
      margin: '10px 0',
      fontWeight: '500'
    },
    messageSuccess: {
      background: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    messageError: {
      background: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    },
    formSection: {
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '25px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    },
    subjectSelect: {
      width: '100%',
      padding: '12px',
      border: '2px solid #e0e6ed',
      borderRadius: '8px',
      fontSize: '1rem',
      background: 'white',
      transition: 'border-color 0.3s'
    },
    questionsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      marginBottom: '30px'
    },
    questionCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      borderLeft: '4px solid #3498db',
      transition: 'transform 0.2s'
    },
    questionInput: {
      width: '100%',
      padding: '12px',
      border: '2px solid #e0e6ed',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'border-color 0.3s'
    },
    optionsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '15px',
      margin: '20px 0'
    },
    optionRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '10px',
      background: '#f8fafc',
      borderRadius: '8px'
    },
    optionInput: {
      flex: '1',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem'
    },
    correctLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      color: '#2c3e50',
      fontWeight: '500'
    },
    radioCustom: {
      width: '18px',
      height: '18px',
      border: '2px solid #3498db',
      borderRadius: '50%',
      position: 'relative'
    },
    radioCustomChecked: {
      width: '18px',
      height: '18px',
      border: '2px solid #3498db',
      borderRadius: '50%',
      position: 'relative'
    },
    questionFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      paddingTop: '15px',
      borderTop: '1px solid #eee'
    },
    scoreInput: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    actionButtons: {
      display: 'flex',
      gap: '15px',
      padding: '25px 0',
      borderTop: '1px solid #e0e6ed'
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.3s',
      fontSize: '0.95rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    btnSecondary: {
      background: '#f8f9fa',
      color: '#495057',
      padding: '12px 24px',
      border: '2px solid #e0e6ed',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.3s',
      fontSize: '0.95rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    btnCancel: {
      background: '#f8f9fa',
      color: '#dc3545',
      padding: '12px 24px',
      border: '2px solid #f5c6cb',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.3s',
      fontSize: '0.95rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    testsContainer: {
      animation: 'fadeIn 0.5s ease'
    },
    groupsContainer: {
      animation: 'fadeIn 0.5s ease'
    },
    testsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    groupsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
    },
    testsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '25px'
    },
    groupsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px'
    },
    testCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      transition: 'all 0.3s',
      borderTop: '4px solid #3498db'
    },
    groupCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      transition: 'all 0.3s',
      borderLeft: '4px solid #2ecc71'
    },
    testCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '15px'
    },
    groupHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '15px'
    },
    testId: {
      fontSize: '0.8rem',
      color: '#95a5a6',
      background: '#f8f9fa',
      padding: '3px 8px',
      borderRadius: '4px'
    },
    testStats: {
      display: 'flex',
      gap: '15px',
      marginBottom: '15px',
      paddingBottom: '15px',
      borderBottom: '1px solid #eee'
    },
    stat: {
      fontSize: '0.85rem',
      color: '#7f8c8d',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    questionsPreview: {
      marginBottom: '20px'
    },
    previewQuestion: {
      padding: '8px 0',
      borderBottom: '1px dashed #eee',
      fontSize: '0.9rem',
      color: '#2c3e50'
    },
    previewOptions: {
      display: 'flex',
      gap: '15px',
      marginTop: '5px'
    },
    correctIndicator: {
      color: '#27ae60',
      fontWeight: '600'
    },
    moreQuestions: {
      textAlign: 'center',
      padding: '10px',
      color: '#3498db',
      fontWeight: '500',
      fontSize: '0.9rem'
    },
    testActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center'
    },
    btnEdit: {
      background: '#f8f9fa',
      color: '#3498db',
      border: '2px solid #3498db',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    btnDelete: {
      background: '#f8f9fa',
      color: '#e74c3c',
      border: '2px solid #f5c6cb',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    groupName: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0
    },
    groupInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '15px'
    },
    groupDetail: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#7f8c8d',
      fontSize: '0.9rem'
    },
    groupStats: {
      display: 'flex',
      gap: '15px',
      paddingTop: '15px',
      borderTop: '1px solid #eee',
      marginBottom: '15px'
    },
    statBadge: {
      background: '#f8f9fa',
      padding: '5px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      color: '#3498db',
      fontWeight: '500'
    }
  };

  const mergeStyles = (base, extra) => ({ ...base, ...extra });

  return (
    <div style={styles.tutorContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#ecf0f1' }}>Test Manager</h2>
        </div>
        <div style={styles.sidebarMenu}>
          <button
            style={mergeStyles(styles.sidebarBtn, activeTab === "create" ? styles.sidebarBtnActive : {})}
            onMouseOver={(e) => e.target.style.transform = 'translateX(5px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateX(0)'}
            onClick={() => {
              setActiveTab("create");
              clearForm();
            }}
          >
            {editingTestId ? "✏️ Edit Test" : "➕ Create Test"}
          </button>
          <button
            style={mergeStyles(styles.sidebarBtn, activeTab === "my-tests" ? styles.sidebarBtnActive : {})}
            onMouseOver={(e) => e.target.style.transform = 'translateX(5px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateX(0)'}
            onClick={() => setActiveTab("my-tests")}
          >
            📋 My Tests ({tests.length})
          </button>
          <button
            style={mergeStyles(styles.sidebarBtn, activeTab === "my-groups" ? styles.sidebarBtnActive : {})}
            onMouseOver={(e) => e.target.style.transform = 'translateX(5px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateX(0)'}
            onClick={() => {
              setActiveTab("my-groups");
              fetchGroups();
            }}
          >
            👥 My Groups ({groups.length})
          </button>

          <div style={styles.sidebarInfo}>
            <p style={{ margin: '8px 0', color: '#bdc3c7' }}>📚 Subjects: {subjects.length}</p>
            <p style={{ margin: '8px 0', color: '#bdc3c7' }}>❓ Questions in draft: {questions.length}</p>
            <p style={{ margin: '8px 0', color: '#bdc3c7' }}>👥 Groups: {groups.length}</p>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.contentHeader}>
          <h1 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '2rem' }}>
            {editingTestId ? "Edit Test" :
             activeTab === "my-groups" ? "My Groups" :
             activeTab === "my-tests" ? "My Tests" :
             "Create New Test"}
          </h1>
          {msg && (
            <div style={mergeStyles(
              styles.message,
              msg.includes("✅") ? styles.messageSuccess : styles.messageError
            )}>
              {msg}
            </div>
          )}
        </div>

        {activeTab === "create" && (
          <div>
            <div style={styles.formSection}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#2c3e50' }}>
                Select Subject:
              </label>
              {loadingSubjects ? (
                <p>Loading subjects...</p>
              ) : (
                <select
                  style={styles.subjectSelect}
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
                >
                  <option value="">Choose a subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            <div style={styles.questionsContainer}>
              {questions.map((q, i) => (
                <div
                  key={i}
                  style={styles.questionCard}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Question {i + 1}</h3>
                    <input
                      type="text"
                      style={styles.questionInput}
                      placeholder="Enter your question here..."
                      value={q.text}
                      onChange={e => updateQuestionText(i, e.target.value)}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
                    />
                  </div>

                  <div style={styles.optionsContainer}>
                    {q.options.map((opt, j) => (
                      <div key={j} style={styles.optionRow}>
                        <input
                          type="text"
                          style={styles.optionInput}
                          placeholder={`Option ${j + 1}`}
                          value={opt}
                          onChange={e => updateOption(i, j, e.target.value)}
                        />
                        <label style={styles.correctLabel}>
                          <input
                            type="radio"
                            name={`correct-${i}`}
                            checked={q.correctOption === j}
                            onChange={() => updateCorrectOption(i, j)}
                            style={{ display: 'none' }}
                          />
                          <span style={q.correctOption === j ?
                            {...styles.radioCustomChecked, '::after': {content: '""', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', background: '#3498db', borderRadius: '50%'}} :
                            styles.radioCustom}
                          ></span>
                          Correct Answer
                        </label>
                      </div>
                    ))}
                  </div>

                  <div style={styles.questionFooter}>
                    <div style={styles.scoreInput}>
                      <label style={{ fontWeight: '600', color: '#2c3e50' }}>Score:</label>
                      <input
                        type="number"
                        min="1"
                        value={q.score}
                        onChange={e => updateScore(i, e.target.value)}
                        style={{
                          width: '80px',
                          padding: '8px 12px',
                          border: '2px solid #e0e6ed',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.actionButtons}>
              <button
                style={styles.btnSecondary}
                onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                onMouseOut={(e) => e.target.style.background = '#f8f9fa'}
                onClick={addQuestion}
              >
                ➕ Add Question
              </button>
              <button
                style={styles.btnPrimary}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #2980b9 0%, #3498db 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
                onClick={submit}
              >
                {editingTestId ? "🔄 Update Test" : "💾 Save Test"}
              </button>
              {editingTestId && (
                <button
                  style={styles.btnCancel}
                  onMouseOver={(e) => e.target.style.background = '#f8d7da'}
                  onMouseOut={(e) => e.target.style.background = '#f8f9fa'}
                  onClick={clearForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "my-tests" && (
          <div style={styles.testsContainer}>
            <div style={styles.testsHeader}>
              <h2 style={{ color: '#2c3e50' }}>My Tests ({tests.length})</h2>
              <button
                style={styles.btnPrimary}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #2980b9 0%, #3498db 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
                onClick={() => {
                  setActiveTab("create");
                  clearForm();
                }}
              >
                ➕ Create New Test
              </button>
            </div>

            {tests.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={{ fontSize: '1.2rem', color: '#6c757d', marginBottom: '20px' }}>📭 No tests created yet</p>
                <button
                  style={styles.btnPrimary}
                  onMouseOver={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #2980b9 0%, #3498db 100%)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                  onClick={() => setActiveTab("create")}
                >
                  Create your first test
                </button>
              </div>
            ) : (
              <div style={styles.testsGrid}>
                {tests.map(test => (
                  <div
                    key={test.id}
                    style={styles.testCard}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                    }}
                  >
                    <div style={styles.testCardHeader}>
                      <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.1rem' }}>📚 {test.subject}</h3>
                      <span style={styles.testId}>ID: {test.id}</span>
                    </div>

                    <div style={styles.testStats}>
                      <span style={styles.stat}>📝 {test.questions.length} questions</span>
                      <span style={styles.stat}>⏱️ Created recently</span>
                    </div>

                    <div style={styles.questionsPreview}>
                      {test.questions.slice(0, 3).map((qText, i) => {
                        const quiz = getOptionsForQuestion(qText);
                        return (
                          <div key={i} style={styles.previewQuestion}>
                            <strong>Q{i + 1}:</strong> {qText.substring(0, 50)}...
                            {quiz && (
                              <div style={styles.previewOptions}>
                                <small style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Options: {quiz.options.length}</small>
                                {quiz.correctOption !== undefined && (
                                  <small style={styles.correctIndicator}>✓ Correct: Option {quiz.correctOption + 1}</small>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {test.questions.length > 3 && (
                        <div style={styles.moreQuestions}>
                          + {test.questions.length - 3} more questions
                        </div>
                      )}
                    </div>

                    <div style={styles.testActions}>
                      <button
                        style={styles.btnEdit}
                        onMouseOver={(e) => {
                          e.target.style.background = '#3498db';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#f8f9fa';
                          e.target.style.color = '#3498db';
                        }}
                        onClick={() => editTest(test)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={styles.btnDelete}
                        onMouseOver={(e) => {
                          e.target.style.background = '#e74c3c';
                          e.target.style.color = 'white';
                          e.target.style.borderColor = '#e74c3c';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#f8f9fa';
                          e.target.style.color = '#e74c3c';
                          e.target.style.borderColor = '#f5c6cb';
                        }}
                        onClick={() => deleteTest(test.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my-groups" && (
          <div style={styles.groupsContainer}>
            <div style={styles.groupsHeader}>
              <h2 style={{ color: '#2c3e50' }}>My Groups ({groups.length})</h2>
              <button
                style={styles.btnSecondary}
                onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                onMouseOut={(e) => e.target.style.background = '#f8f9fa'}
                onClick={fetchGroups}
              >
                🔄 Refresh
              </button>
            </div>

            {loadingGroups ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={{ fontSize: '1.2rem', color: '#6c757d', marginBottom: '20px' }}>👥 No groups found</p>
                <p style={{ color: '#95a5a6', marginBottom: '20px' }}>
                  Groups will appear here when you create tests for subjects that have student groups.
                </p>
              </div>
            ) : (
              <div style={styles.groupsGrid}>
                {groups.map((group, index) => (
                  <div
                    key={group.id || index}
                    style={styles.groupCard}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                    }}
                  >
                    <div style={styles.groupHeader}>
                      <h3 style={styles.groupName}>👥 {group.name}</h3>
                      <span style={styles.testId}>ID: {group.id}</span>
                    </div>

                    <div style={styles.groupInfo}>
                      <div style={styles.groupDetail}>
                        <span>📚 Subject: {group.subject}</span>
                      </div>
                      <div style={styles.groupDetail}>
                        <span>🏆 Level: {group.level}</span>
                      </div>
                    </div>

                    <div style={styles.groupStats}>
                      <span style={styles.statBadge}>👨‍🎓 Students: --</span>
                      <span style={styles.statBadge}>📝 Tests: --</span>
                    </div>

                    <div style={styles.testActions}>
                      <button
                        style={mergeStyles(styles.btnEdit, { borderColor: '#2ecc71', color: '#27ae60', width: '100%' })}
                        onMouseOver={(e) => {
                          e.target.style.background = '#2ecc71';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#f8f9fa';
                          e.target.style.color = '#27ae60';
                        }}
                        onClick={() => handleAssignCourse(group.id, group.name)}
                      >
                        📚 Assign Course
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TutorCreateTest;
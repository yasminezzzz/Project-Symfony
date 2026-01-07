import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const studentId = location.state?.id;
  const [studentName, setStudentName] = useState("Student");
  const [studentGroups, setStudentGroups] = useState([]);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [tests, setTests] = useState([]);
  const [testQuestions, setTestQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState({
    subjects: false,
    tests: false,
    questions: {},
    submitting: {},
    groups: false
  });

  useEffect(() => {
    fetchSubjects();
    fetchStudentInfo();
    fetchStudentGroups();
  }, []);

  useEffect(() => {
    if (selectedSubject || selectedSubject === "") {
      fetchTests();
    }
  }, [selectedSubject]);

  const fetchStudentInfo = async () => {
    try {
      const res = await fetch(`http://localhost:8001/api/student/${studentId}/info`);
      if (res.ok) {
        const data = await res.json();
        setStudentName(data.name || "Student");
      }
    } catch (error) {
      console.error("Error fetching student info:", error);
    }
  };

  const fetchStudentGroups = async () => {
    setLoading(prev => ({ ...prev, groups: true }));
    try {
      const res = await fetch(`http://localhost:8001/api/student/${studentId}/groups`);
      if (res.ok) {
        const data = await res.json();
        setStudentGroups(data || []);
      }
    } catch (error) {
      console.error("Error fetching student groups:", error);
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const fetchSubjects = async () => {
    setLoading(prev => ({ ...prev, subjects: true }));
    try {
      const res = await fetch("http://localhost:8001/api/student/subjects");
      const data = await res.json();
      setSubjects(data || []);
    } catch (error) {
      setMsg({ text: "Cannot load subjects", type: "error" });
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, subjects: false }));
    }
  };

  const fetchTests = async () => {
    setLoading(prev => ({ ...prev, tests: true }));
    try {
      const res = await fetch("http://localhost:8001/api/student/tests");
      const data = await res.json();
      const filtered = selectedSubject ?
        data.filter(t => t.subject_id === parseInt(selectedSubject)) :
        data;

      try {
        const completedRes = await fetch(`http://localhost:8001/api/student/${studentId}/completed-tests`);
        const completedTests = await completedRes.json();

        const testsWithStatus = filtered.map(test => {
          const completedTest = completedTests.find(ct => ct.test_id === test.id);
          return {
            ...test,
            passed: !!completedTest,
            score: completedTest?.score || null
          };
        });

        setTests(testsWithStatus || []);
      } catch (error) {
        const testsWithStatus = filtered.map(test => ({
          ...test,
          passed: false,
          score: null
        }));
        setTests(testsWithStatus || []);
      }
    } catch (error) {
      setMsg({ text: "Cannot load tests", type: "error" });
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, tests: false }));
    }
  };

  const fetchTestQuestions = async (testId) => {
    setLoading(prev => ({
      ...prev,
      questions: { ...prev.questions, [testId]: true }
    }));
    try {
      const res = await fetch(`http://localhost:8001/api/student/tests/pass/${testId}`);
      const data = await res.json();
      setTestQuestions(prev => ({ ...prev, [testId]: data.questions }));
    } catch (error) {
      setMsg({ text: "Cannot load test questions", type: "error" });
      console.error(error);
    } finally {
      setLoading(prev => ({
        ...prev,
        questions: { ...prev.questions, [testId]: false }
      }));
    }
  };

  const handleAnswerChange = (testId, questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [testId]: { ...prev[testId], [questionId]: value }
    }));
  };

  const calculateProgress = (testId) => {
    const testAnswers = answers[testId] || {};
    const totalQuestions = testQuestions[testId]?.length || 0;
    const answeredCount = Object.keys(testAnswers).length;
    return totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  };

  // Fonction pour déterminer le niveau basé sur le score
  const determineLevelFromScore = (score) => {
    if (score >= 80) return "advanced";
    if (score >= 60) return "intermediate";
    if (score >= 40) return "beginner";
    return "remedial"; // Pour scores < 40%
  };

  // Fonction pour créer ou trouver un groupe
  const getOrCreateGroup = async (subjectName, level, studentId) => {
    try {
      // D'abord chercher un groupe existant
      const findRes = await fetch('http://localhost:8001/api/groups/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectName,
          level: level,
          studentId: studentId
        })
      });

      if (findRes.ok) {
        return await findRes.json();
      }
      return null;
    } catch (error) {
      console.error("Error finding/creating group:", error);
      return null;
    }
  };

  const submitTest = async (testId) => {
    setLoading(prev => ({
      ...prev,
      submitting: { ...prev.submitting, [testId]: true }
    }));
    try {
      const testAnswers = answers[testId] || {};
      const res = await fetch(`http://localhost:8001/api/student/tests/pass/${testId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: testAnswers, studentId }),
      });

      if (!res.ok) throw new Error("Submit failed");

      const data = await res.json();
      const score = data.score || 0;

      // Déterminer le niveau basé sur le score
      const level = determineLevelFromScore(score);

      // Récupérer le sujet du test
      const currentTest = tests.find(t => t.id === testId);
      const testSubject = subjects.find(s => s.id === currentTest?.subject_id);

      let group = null;
      let message = `✅ Test submitted successfully!\n`;
      message += `Your score: ${score}%\n`;
      message += `📊 Level assigned: ${level.toUpperCase()}\n`;

      if (testSubject) {
        // Trouver ou créer un groupe approprié
        group = await getOrCreateGroup(testSubject.name, level, studentId);

        if (group) {
          message += `🎉 You have been assigned to group: ${group.name}\n`;
          message += `📚 Subject: ${group.subject}\n`;
          message += `🏆 Level: ${group.level}\n`;

          // Ajouter le nouveau groupe à la liste
          setStudentGroups(prev => {
            const groupExists = prev.some(g => g.id === group.id);
            if (!groupExists) {
              return [...prev, {
                id: group.id,
                name: group.name,
                level: group.level,
                subject: group.subject
              }];
            }
            return prev;
          });
        } else {
          message += `⚠️ Could not assign you to a group. Please contact your instructor.\n`;
        }
      } else {
        message += `⚠️ Subject not found for this test.\n`;
      }

      setMsg({
        text: message,
        type: "success"
      });

      // Mettre à jour le test comme complété
      setTests(prev => prev.map(t =>
        t.id === testId ? { ...t, passed: true, score: score } : t
      ));

      // Réinitialiser les réponses
      setAnswers(prev => ({ ...prev, [testId]: {} }));

      // Recharger les groupes de l'étudiant
      fetchStudentGroups();

    } catch (error) {
      setMsg({ text: "Error submitting test", type: "error" });
      console.error(error);
    } finally {
      setLoading(prev => ({
        ...prev,
        submitting: { ...prev.submitting, [testId]: false }
      }));
    }
  };

  // API endpoint à créer sur votre backend
  // Voici un exemple de ce que devrait contenir le fichier backend (Node.js/Express):

  /*
  // Dans votre backend (par exemple: server.js ou routes/groups.js)

  // Route pour trouver ou créer un groupe
  app.post('/api/groups/find-or-create', async (req, res) => {
    try {
      const { subject, level, studentId } = req.body;

      // 1. Chercher un groupe existant avec ce sujet et niveau
      const existingGroup = await db.query(
        'SELECT * FROM groups WHERE subject = ? AND level = ? AND member_count < max_capacity LIMIT 1',
        [subject, level]
      );

      let group;

      if (existingGroup.length > 0) {
        group = existingGroup[0];

        // Ajouter l'étudiant au groupe existant
        await db.query(
          'INSERT INTO group_students (group_id, student_id) VALUES (?, ?)',
          [group.id, studentId]
        );

        // Mettre à jour le nombre de membres
        await db.query(
          'UPDATE groups SET member_count = member_count + 1 WHERE id = ?',
          [group.id]
        );
      } else {
        // 2. Créer un nouveau groupe
        const groupName = `${subject} - ${level} Group #${Date.now().toString().slice(-4)}`;

        const [result] = await db.query(
          'INSERT INTO groups (name, subject, level, member_count, max_capacity) VALUES (?, ?, ?, 1, 30)',
          [groupName, subject, level]
        );

        group = {
          id: result.insertId,
          name: groupName,
          subject: subject,
          level: level,
          member_count: 1
        };

        // Ajouter l'étudiant au nouveau groupe
        await db.query(
          'INSERT INTO group_students (group_id, student_id) VALUES (?, ?)',
          [group.id, studentId]
        );
      }

      res.json(group);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to find or create group' });
    }
  });
  */

  const handleGroupClick = (groupId) => {
    const selectedGroup = studentGroups.find(g => g.id === groupId);
    navigate(`/courses/${groupId}`, {
      state: {
        groupId,
        studentId,
        studentName,
        groupName: selectedGroup?.name,
        groupSubject: selectedGroup?.subject,
        groupLevel: selectedGroup?.level
      }
    });
  };

  // Calcul des statistiques
  const completedTests = tests.filter(t => t.passed).length;
  const averageScore = tests.filter(t => t.passed).length > 0
    ? tests.filter(t => t.passed).reduce((acc, t) => acc + (t.score || 0), 0) / tests.filter(t => t.passed).length
    : 0;

  // SVG Icons
  const Icons = {
    BookOpen: () => (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    ),
    CheckCircle: () => (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    Clock: () => (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    Award: () => (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="8" r="7"/>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
      </svg>
    ),
    BarChart3: () => (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 20V10"/>
        <path d="M12 20V4"/>
        <path d="M6 20v-6"/>
      </svg>
    ),
    Loader2: () => (
      <svg className="icon spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
    ),
    ChevronRight: () => (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    Users: () => (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    Target: () => (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    )
  };

  const getGroupLevelColor = (level) => {
    if (!level) return '#6b7280';
    switch(level.toLowerCase()) {
      case 'remedial': return '#dc2626'; // Rouge foncé
      case 'beginner': return '#10b981'; // Vert
      case 'intermediate': return '#f59e0b'; // Orange
      case 'advanced': return '#8b5cf6'; // Violet
      default: return '#6b7280';
    }
  };

  const getImagePath = (imageFileName) => {
    if (!imageFileName) return "https://via.placeholder.com/150?text=No+Image";
    const filename = imageFileName.split('/').pop();
    try {
      return require(`../assets/${filename}`);
    } catch (err) {
      console.error(`Image not found: ${filename}`, err);
      return "https://via.placeholder.com/150?text=No+Image";
    }
  };

  return (
    <div className="student-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-top">
          <h1>Welcome back, {studentName}!</h1>
          <span className="student-badge">Student ID: {studentId}</span>
        </div>
        <p className="header-subtitle">Continue your learning journey and track your progress</p>
      </header>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-content">
            <div>
              <p className="stat-label">Completed Tests</p>
              <p className="stat-value">{completedTests}</p>
            </div>
            <div className="stat-icon stat-icon-blue">
              <Icons.CheckCircle />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-content">
            <div>
              <p className="stat-label">Average Score</p>
              <p className="stat-value">{averageScore.toFixed(1)}%</p>
              <p className="stat-subtext">
                Based on {completedTests} test{completedTests !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="stat-icon stat-icon-green">
              <Icons.BarChart3 />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-content">
            <div>
              <p className="stat-label">My Groups</p>
              <p className="stat-value">{studentGroups.length}</p>
              <p className="stat-subtext">
                {studentGroups.length > 0
                  ? `${studentGroups.map(g => g.subject).join(', ')}`
                  : 'No groups yet'
                }
              </p>
            </div>
            <div className="stat-icon stat-icon-purple">
              <Icons.Users />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-content">
            <div>
              <p className="stat-label">Available Tests</p>
              <p className="stat-value">{tests.length}</p>
            </div>
            <div className="stat-icon stat-icon-orange">
              <Icons.BookOpen />
            </div>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`message-alert message-${msg.type}`} style={{ whiteSpace: 'pre-line' }}>
          {msg.text}
        </div>
      )}

      {/* Main Content */}
      <div className="main-layout">
        {/* Sidebar */}
        <div className="sidebar-card">
          <div className="card-header">
            <h2 className="card-title">
              <Icons.BookOpen />
              Subjects
            </h2>
            <p className="card-description">Filter tests by subject</p>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="select-wrapper">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={loading.subjects}
                  className="subject-select"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Cards */}
              <div className="subject-cards-container">
                <p className="quick-links-title">Browse Subjects</p>
                <div className="subject-cards-grid">
                  <button
                    className="subject-card-btn"
                    onClick={() => setSelectedSubject("")}
                  >
                    <div className="subject-card-image all-subjects">
                      <Icons.BookOpen />
                    </div>
                    <span className="subject-card-name">All Subjects</span>
                  </button>

                  {subjects.map(subject => (
                    <button
                      key={subject.id}
                      className="subject-card-btn"
                      onClick={() => setSelectedSubject(subject.id.toString())}
                    >
                      <div className="subject-card-image">
                        <img
                          src={getImagePath(subject.image_url)}
                          alt={subject.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      </div>
                      <span className="subject-card-name">{subject.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Groups Section */}
              <div className="groups-container">
                <div className="groups-header">
                  <h3 className="groups-title">
                    <Icons.Users />
                    My Learning Groups
                  </h3>
                  <span className="groups-count">{studentGroups.length} group{studentGroups.length !== 1 ? 's' : ''}</span>
                </div>

                {loading.groups ? (
                  <div className="groups-loading">
                    <Icons.Loader2 />
                    <span>Loading groups...</span>
                  </div>
                ) : studentGroups.length === 0 ? (
                  <div className="no-groups">
                    <Icons.Target />
                    <p>You haven't been assigned to any groups yet.</p>
                    <p className="no-groups-hint">Complete a test to get assigned to a group based on your score!</p>
                  </div>
                ) : (
                  <div className="groups-list">
                    {studentGroups.map((group, index) => (
                      <div
                        key={group.id || index}
                        className="group-item clickable-group"
                        onClick={() => handleGroupClick(group.id)}
                      >
                        <div className="group-item-header">
                          <div className="group-icon">
                            <Icons.Users />
                          </div>
                          <div className="group-info">
                            <h4 className="group-name">{group.name}</h4>
                            <div className="group-details">
                              <span className="group-subject">{group.subject}</span>
                              <span
                                className="group-level"
                                style={{
                                  backgroundColor: getGroupLevelColor(group.level) + '20',
                                  color: getGroupLevelColor(group.level)
                                }}
                              >
                                {group.level}
                              </span>
                            </div>
                          </div>
                        </div>
                        {group.members !== undefined && (
                          <div className="group-members">
                            <span className="members-count">
                              {group.members} member{group.members !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test List */}
        <div className="tests-container">
          <div className="tests-header">
            <h2>
              {selectedSubject
                ? (subjects.find(s => s.id === parseInt(selectedSubject))?.name || "Selected Subject") + " Tests"
                : "All Tests"
              }
            </h2>
            <span className="tests-badge">{tests.length} {tests.length === 1 ? 'Test' : 'Tests'}</span>
          </div>

          {loading.tests ? (
            <div className="loading-container">
              <Icons.Loader2 />
              <span>Loading tests...</span>
            </div>
          ) : tests.length === 0 ? (
            <div className="empty-state">
              <Icons.BookOpen />
              <p className="empty-title">No tests available</p>
              <p className="empty-subtitle">Select a different subject or check back later</p>
            </div>
          ) : (
            tests.map(test => {
              const testSubject = subjects.find(s => s.id === test.subject_id);

              return (
                <div key={test.id} className="test-card">
                  <div className="test-card-header">
                    <div className="test-header-left">
                      {testSubject && (
                        <div className="test-subject-image">
                          <img
                            src={getImagePath(testSubject.image_url)}
                            alt={testSubject.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="test-title">
                          {testSubject?.name || test.subject || "Unknown Subject"} Test
                          {test.passed && (
                            <span className="status-badge status-completed">
                              <Icons.CheckCircle />
                              Completed
                            </span>
                          )}
                        </h3>
                        <p className="test-description">
                          Test ID: #{test.id}
                        </p>
                      </div>
                    </div>
                    {test.passed ? (
                      <span className="score-badge">
                        <Icons.Award />
                        {test.score}%
                      </span>
                    ) : (
                      <span className="status-badge status-available">
                        <Icons.Clock />
                        Available
                      </span>
                    )}
                  </div>

                  {test.passed ? (
                    <div className="test-card-body">
                      <div className="score-container">
                        <div className="score-header">
                          <span className="score-label">Your Score</span>
                          <span className="score-value">{test.score}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${test.score}%`,
                              backgroundColor: test.score >= 80 ? "#8b5cf6" : test.score >= 60 ? "#f59e0b" : test.score >= 40 ? "#10b981" : "#dc2626"
                            }}
                          ></div>
                        </div>
                      </div>
                      <p className="score-message">
                        {test.score >= 80 ? "Excellent! Advanced level achieved. " :
                         test.score >= 60 ? "Good job! Intermediate level. " :
                         test.score >= 40 ? "Good start! Beginner level. " :
                         "Keep practicing! You've been placed in remedial group. "}
                        Check your groups section to see your assigned learning group!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="test-card-body">
                        {!testQuestions[test.id] ? (
                          <div className="start-test-container">
                            <button
                              onClick={() => fetchTestQuestions(test.id)}
                              disabled={loading.questions[test.id]}
                              className="start-test-btn"
                            >
                              {loading.questions[test.id] ? (
                                <>
                                  <Icons.Loader2 />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  Start Test
                                  <Icons.ChevronRight />
                                </>
                              )}
                            </button>
                            <p className="start-test-hint">
                              Complete this test to be assigned to a learning group based on your score!
                            </p>
                          </div>
                        ) : (
                          <div className="test-questions">
                            <div className="test-progress">
                              <div className="progress-header">
                                <span className="progress-label">Progress</span>
                                <span>{Math.round(calculateProgress(test.id))}%</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${calculateProgress(test.id)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="divider"></div>

                            <div className="questions-list">
                              {testQuestions[test.id]?.map((question, index) => (
                                <div key={question.id} className="question-item">
                                  <div className="question-header">
                                    <div className="question-number">
                                      {index + 1}
                                    </div>
                                    <div className="question-content">
                                      <p className="question-text">{question.content}</p>
                                      <div className="options-grid">
                                        {question.options?.map((option, idx) => (
                                          <label key={idx} className="option-label">
                                            <input
                                              type="radio"
                                              name={`q${test.id}_${question.id}`}
                                              value={option}
                                              checked={answers[test.id]?.[question.id] === option}
                                              onChange={(e) => handleAnswerChange(test.id, question.id, e.target.value)}
                                              className="option-input"
                                            />
                                            <span className="option-text">{option}</span>
                                          </label>
                                        )) || (
                                          <>
                                            {['Option A', 'Option B', 'Option C', 'Option D'].map((opt, idx) => (
                                              <label key={idx} className="option-label">
                                                <input
                                                  type="radio"
                                                  name={`q${test.id}_${question.id}`}
                                                  value={opt}
                                                  checked={answers[test.id]?.[question.id] === opt}
                                                  onChange={(e) => handleAnswerChange(test.id, question.id, e.target.value)}
                                                  className="option-input"
                                                />
                                                <span className="option-text">{opt}</span>
                                              </label>
                                            ))}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {index < testQuestions[test.id].length - 1 && <div className="divider"></div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {testQuestions[test.id] && (
                        <div className="test-card-footer">
                          <div className="answered-count">
                            Answered: {Object.keys(answers[test.id] || {}).length} / {testQuestions[test.id]?.length}
                          </div>
                          <button
                            onClick={() => submitTest(test.id)}
                            disabled={
                              loading.submitting[test.id] ||
                              Object.keys(answers[test.id] || {}).length < testQuestions[test.id]?.length
                            }
                            className="submit-btn"
                          >
                            {loading.submitting[test.id] ? (
                              <>
                                <Icons.Loader2 />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Icons.CheckCircle />
                                Submit Test & Get Group
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>Need help? Contact your instructor or visit the help center</p>
        <p>All tests are automatically saved as you progress</p>
      </footer>

      <style jsx>{`
        .student-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .dashboard-header {
          margin-bottom: 32px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 800;
          color: #1f2937;
          margin: 0;
        }

        .student-badge {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          font-size: 14px;
          color: #4b5563;
          font-weight: 500;
        }

        .header-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border: 1px solid;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-card-blue {
          border-color: #dbeafe;
        }

        .stat-card-green {
          border-color: #d1fae5;
        }

        .stat-card-purple {
          border-color: #f3e8ff;
        }

        .stat-card-orange {
          border-color: #fed7aa;
        }

        .stat-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 4px 0;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .stat-subtext {
          font-size: 12px;
          color: #6b7280;
          margin: 4px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-blue {
          background-color: #dbeafe;
          color: #2563eb;
        }

        .stat-icon-green {
          background-color: #d1fae5;
          color: #059669;
        }

        .stat-icon-purple {
          background-color: #f3e8ff;
          color: #7c3aed;
        }

        .stat-icon-orange {
          background-color: #fed7aa;
          color: #f97316;
        }

        .icon {
          width: 24px;
          height: 24px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .message-alert {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-weight: 500;
          white-space: pre-line;
          line-height: 1.5;
        }

        .message-success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .message-error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .groups-container {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }

        .groups-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .groups-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .groups-count {
          font-size: 12px;
          background-color: #f3f4f6;
          color: #4b5563;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .groups-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px;
          color: #6b7280;
        }

        .no-groups {
          text-align: center;
          padding: 24px;
          color: #9ca3af;
        }

        .no-groups .icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #d1d5db;
        }

        .no-groups p {
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .no-groups-hint {
          font-size: 13px;
          color: #9ca3af;
        }

        .groups-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .group-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          transition: all 0.2s;
        }

        .clickable-group {
          cursor: pointer;
        }

        .clickable-group:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .group-item-header {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .group-icon {
          width: 32px;
          height: 32px;
          background-color: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .group-icon .icon {
          width: 16px;
          height: 16px;
          color: #6b7280;
        }

        .group-info {
          flex: 1;
        }

        .group-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .group-details {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .group-subject {
          font-size: 12px;
          color: #6b7280;
          background-color: #f3f4f6;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .group-level {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .group-members {
          display: flex;
          justify-content: flex-end;
        }

        .members-count {
          font-size: 11px;
          color: #9ca3af;
        }

        .main-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .main-layout {
            grid-template-columns: 1fr 3fr;
          }
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .sidebar-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .card-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .card-body {
          padding: 24px;
        }

        .space-y-4 > * + * {
          margin-top: 16px;
        }

        .select-wrapper {
          position: relative;
        }

        .subject-select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          color: #1f2937;
          background: white;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .subject-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .subject-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .subject-cards-container {
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }

        .quick-links-title {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin: 0 0 16px 0;
        }

        .subject-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }

        .subject-card-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 8px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .subject-card-btn:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
          transform: translateY(-2px);
        }

        .subject-card-image {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        }

        .subject-card-image.all-subjects {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }

        .subject-card-image.all-subjects .icon {
          width: 32px;
          height: 32px;
        }

        .subject-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .subject-card-name {
          font-size: 12px;
          font-weight: 500;
          color: #4b5563;
          text-align: center;
          line-height: 1.2;
        }

        .tests-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tests-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tests-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .tests-badge {
          padding: 6px 12px;
          background-color: #f3f4f6;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 48px;
          color: #6b7280;
        }

        .empty-state {
          background: white;
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .empty-state .icon {
          width: 48px;
          height: 48px;
          color: #d1d5db;
          margin: 0 auto 16px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 8px 0;
        }

        .empty-subtitle {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
        }

        .test-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .test-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .test-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
        }

        .test-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .test-subject-image {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        }

        .test-subject-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .test-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .test-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-completed {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-available {
          background-color: #f3f4f6;
          color: #4b5563;
        }

        .score-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .test-card-body {
          padding: 24px;
        }

        .score-container {
          margin-bottom: 20px;
        }

        .score-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .score-label {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }

        .score-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .score-message {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .start-test-container {
          text-align: center;
          padding: 24px;
        }

        .start-test-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .start-test-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .start-test-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .start-test-hint {
          font-size: 13px;
          color: #9ca3af;
          margin: 12px 0 0 0;
        }

        .test-questions {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .test-progress {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #6b7280;
        }

        .progress-header span:last-child {
          font-weight: 600;
          color: #1f2937;
        }

        .divider {
          height: 1px;
          background-color: #f3f4f6;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .question-item {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .question-header {
          display: flex;
          gap: 16px;
        }

        .question-number {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          background-color: #dbeafe;
          color: #2563eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }

        .question-content {
          flex: 1;
        }

        .question-text {
          font-size: 16px;
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .option-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option-label:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }

        .option-input {
          width: 16px;
          height: 16px;
          accent-color: #3b82f6;
        }

        .option-text {
          font-size: 14px;
          color: #4b5563;
        }

        .test-card-footer {
          padding: 24px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .answered-count {
          font-size: 14px;
          color: #6b7280;
        }

        .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background-color: #059669;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #047857;
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dashboard-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }

        .dashboard-footer p {
          margin: 4px 0;
        }

        @media (max-width: 640px) {
          .student-dashboard {
            padding: 16px;
          }

          .header-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .dashboard-header h1 {
            font-size: 24px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .test-card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .test-header-left {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .options-grid {
            grid-template-columns: 1fr;
          }

          .test-card-footer {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .submit-btn {
            width: 100%;
            justify-content: center;
          }

          .group-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}

export default StudentDashboard;
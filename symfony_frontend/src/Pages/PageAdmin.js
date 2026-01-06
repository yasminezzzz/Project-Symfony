import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Box
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AdminPanelSettings as AdminIcon,
  PersonOutline as PersonOutlineIcon
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4a6fa5', // Matching the eLearning theme from image
    },
    secondary: {
      main: '#6d9eeb',
    },
    background: {
      default: '#f5f7fa',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    }
  }
});

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "ROLE_STUDENT"
  });
  const [newSubject, setNewSubject] = useState({
    name: "",
    image_url: ""
  });

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchSubjects();
  }, []);

  // ===== Fetch Functions =====
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/admin/users");
      const data = await res.json();
      setUsers(data);
      setError("");
    } catch {
      setError("Failed to fetch users");
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/admin/subjects");
      const data = await res.json();
      setSubjects(data);
      setError("");
    } catch {
      setError("Failed to fetch subjects");
    }
  };

  // ===== User Functions =====
  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) {
      setError("Email and password are required");
      return;
    }
    try {
      await fetch("http://localhost:8001/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      setNewUser({ email: "", password: "", role: "ROLE_STUDENT" });
      setUserDialogOpen(false);
      fetchUsers();
      setSuccess("User added successfully!");
    } catch {
      setError("Failed to add user");
    }
  };

  const handleUpdateUser = async (user) => {
    try {
      await fetch(`http://localhost:8001/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      fetchUsers();
      setEditingUser(null);
      setSuccess("User updated successfully!");
    } catch {
      setError("Failed to update user");
    }
  };

  const updateUserRole = async (id, role) => {
    try {
      await fetch(`http://localhost:8001/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      fetchUsers();
      setSuccess(`User role updated to ${role === "ROLE_TUTOR" ? "Tutor" : "Student"}!`);
    } catch {
      setError("Failed to update user role");
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await fetch(`http://localhost:8001/api/admin/users/${id}`, {
          method: "DELETE"
        });
        fetchUsers();
        setSuccess("User deleted successfully!");
      } catch {
        setError("Failed to delete user");
      }
    }
  };

  // ===== Subject Functions =====
  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.image_url) {
      setError("Name and image URL are required");
      return;
    }
    try {
      await fetch("http://localhost:8001/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubject),
      });
      setNewSubject({ name: "", image_url: "" });
      setSubjectDialogOpen(false);
      fetchSubjects();
      setSuccess("Subject added successfully!");
    } catch {
      setError("Failed to add subject");
    }
  };

  const handleUpdateSubject = async (subject) => {
    try {
      await fetch(`http://localhost:8001/api/admin/subjects/${subject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subject),
      });
      fetchSubjects();
      setEditingSubject(null);
      setSuccess("Subject updated successfully!");
    } catch {
      setError("Failed to update subject");
    }
  };

  const deleteSubject = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await fetch(`http://localhost:8001/api/admin/subjects/${id}`, {
          method: "DELETE"
        });
        fetchSubjects();
        setSuccess("Subject deleted successfully!");
      } catch {
        setError("Failed to delete subject");
      }
    }
  };

  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            background: 'linear-gradient(135deg, #4a6fa5 0%, #6d9eeb 100%)',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AdminIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                eLearning Admin Dashboard
              </Typography>
              <Typography variant="subtitle1">
                Manage users, subjects, and platform content
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PersonOutlineIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Total Users
                </Typography>
                <Typography variant="h5">
                  {users.length}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <SchoolIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Total Subjects
                </Typography>
                <Typography variant="h5">
                  {subjects.length}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Users Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h5" component="h2">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  User Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setUserDialogOpen(true)}
                >
                  Add User
                </Button>
              </Box>

              <List>
                {users.map((user, index) => (
                  <React.Fragment key={user.id}>
                    <ListItem>
                      <Avatar sx={{ mr: 2, bgcolor: user.role === 'ROLE_TUTOR' ? 'secondary.main' : 'primary.main' }}>
                        {user.email.charAt(0).toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={user.email}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                bgcolor: user.role === 'ROLE_TUTOR' ? 'secondary.light' : 'primary.light',
                                color: user.role === 'ROLE_TUTOR' ? 'secondary.dark' : 'primary.dark',
                                px: 1,
                                borderRadius: 1
                              }}
                            >
                              {user.role === 'ROLE_TUTOR' ? 'Tutor' : 'Student'}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => updateUserRole(user.id,
                            user.role === 'ROLE_TUTOR' ? 'ROLE_STUDENT' : 'ROLE_TUTOR'
                          )}
                          title={user.role === 'ROLE_TUTOR' ? 'Make Student' : 'Make Tutor'}
                        >
                          {user.role === 'ROLE_TUTOR' ? <PersonOutlineIcon /> : <SchoolIcon />}
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => setEditingUser(user)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => deleteUser(user.id)}
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < users.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Subjects Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h5" component="h2">
                  <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Subject Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setSubjectDialogOpen(true)}
                >
                  Add Subject
                </Button>
              </Box>

              <Grid container spacing={2}>
                {subjects.map((subject) => (
                  <Grid item xs={12} sm={6} key={subject.id}>
                    <Card>
                      {subject.image_url && (
                        <Box
                          sx={{
                            height: 140,
                            backgroundImage: `url(${subject.image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {subject.name}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => setEditingSubject(subject)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={() => deleteSubject(subject.id)}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Add User Dialog */}
        <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)}>
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                label="Role"
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <MenuItem value="ROLE_STUDENT">Student</MenuItem>
                <MenuItem value="ROLE_TUTOR">Tutor</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} variant="contained">
              Add User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={Boolean(editingUser)} onClose={() => setEditingUser(null)}>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={editingUser?.email || ''}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              variant="outlined"
              placeholder="Leave blank to keep current"
              onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={editingUser?.role || 'ROLE_STUDENT'}
                label="Role"
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              >
                <MenuItem value="ROLE_STUDENT">Student</MenuItem>
                <MenuItem value="ROLE_TUTOR">Tutor</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={() => handleUpdateUser(editingUser)} variant="contained">
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Subject Dialog */}
        <Dialog open={subjectDialogOpen || Boolean(editingSubject)}
                onClose={() => {
                  setSubjectDialogOpen(false);
                  setEditingSubject(null);
                }}>
          <DialogTitle>
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Subject Name"
              fullWidth
              variant="outlined"
              value={editingSubject?.name || newSubject.name}
              onChange={(e) => editingSubject
                ? setEditingSubject({ ...editingSubject, name: e.target.value })
                : setNewSubject({ ...newSubject, name: e.target.value })
              }
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              label="Image URL"
              fullWidth
              variant="outlined"
              value={editingSubject?.image_url || newSubject.image_url}
              onChange={(e) => editingSubject
                ? setEditingSubject({ ...editingSubject, image_url: e.target.value })
                : setNewSubject({ ...newSubject, image_url: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setSubjectDialogOpen(false);
              setEditingSubject(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={editingSubject
                ? () => handleUpdateSubject(editingSubject)
                : handleAddSubject
              }
              variant="contained"
            >
              {editingSubject ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={Boolean(success)}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default AdminDashboard;
import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import './App.css';
import Register from './Register';
import Login from './Login';
import { useAuth } from './AuthContext';
import Dashboard from './Dashboard';

const Chat = () => <div><h2>Chat Page</h2></div>;
const Group = () => <div><h2>Group Page</h2></div>;

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dark mode toggle
  React.useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
  }, []);

  const toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <button className="dark-toggle-btn" onClick={toggleDarkMode}>
        Toggle Dark Mode
      </button>
      <nav style={{ width: '100%', padding: '10px 0', background: '#f7f7f7', marginBottom: 20, display: 'flex', justifyContent: 'center', gap: 20 }}>
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
          </>
        )}
      </nav>
      <div className="App">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat/:chatId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/group/:groupId" element={<ProtectedRoute><Group /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </>
  );
}

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import HomePage from './Home';  
import SignUp from './authentication/SignUp'; 
import Login from './authentication/Login'; // Assuming you have a Login component
import { Logout } from './Logout';
import logo from './logo.svg';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <AppContent />
          <AppRoutes />
        </header>
      </div>
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show the title and buttons on the main page
  if (location.pathname !== '/') {
    return null;
  }

  return (
    <div className="app-content">
      <h1>Secure File Storage</h1>
      <div className="button-container">
        <button onClick={() => navigate('/signup')}>Sign Up</button>
        <button onClick={() => navigate('/login')}>Login</button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    // if (token && isTokenValid(token)) {
    //   navigate('./directories')
    // }
  }, [navigate]);

  const isTokenValid = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiry;
    } catch (e) {
      return false;
    }
  };

  return (
    <>
          {!['/', '/login', '/signup'].includes(window.location.pathname) && <Logout />}
      <Routes>
        <Route path="/directories" element={<HomePage />} /> 
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
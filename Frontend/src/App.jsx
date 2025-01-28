import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import HomePage from './Home';  
import SignUp from './authentication/SignUp'; 
import Login from './authentication/Login';
import { useDispatch } from 'react-redux';
import { setUserData } from './store';
import { Logout } from './Logout';
import CryptoJS from 'crypto-js';
import { secretKey } from './store';
import ActivityTracking from './ActivityTracking';

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
let location;
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname !== '/') {
    return null;
  }

  return (
    <div className="app-content">
      <h1 className="login-header">Welcome to Sharkhive! </h1> 
      <h3 className="login-header"> A secure file storage and monitoring solution!</h3>
      <div className="button-container">
        <button onClick={() => navigate('/signup')}>Sign Up</button>
        <button onClick={() => navigate('/login')}>Login</button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  location = useLocation();

  const hasActiveSession = useCallback(() => {
    const encryptedPayload = localStorage.getItem('sessionMetaData');
    if (!encryptedPayload) {
      return false;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedPayload, secretKey);
    const sessionMetaData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    if (new Date() > new Date (sessionMetaData.sessionEndTime)) {
      return false;
    } else {
      dispatch((setUserData(sessionMetaData.userDetails)));
      return true;
    }
  }, [dispatch]); 

  useEffect(() => {
    if (hasActiveSession() && !['/directories', '/activities'].includes(location.pathname)) {
      if (location.pathname === '/directories') {
        navigate('./directories')
      } else if (location.pathname === '/activities') {
        navigate('./activities');
      }
    }
  }, [hasActiveSession, navigate]);

  return (
    <>
      {!['/', '/login', '/signup'].includes(window.location.pathname) && <Logout />}
      <Routes>
        <Route path="/directories" element={<HomePage />} /> 
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/activities" element={<ActivityTracking />} />
      </Routes>
    </>
  );
}

export default App;
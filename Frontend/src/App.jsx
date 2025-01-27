import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './App.css';
import HomePage from './Home';  
import SignUp from './authentication/SignUp'; 
import { Logout } from './Logout';
import logo from './logo.svg';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <Logout />
          <AppRoutes />
        </header>
      </div>
    </Router>
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get('jwtToken');
    if (token && isTokenValid(token)) {
      // Token is valid, proceed with the session
    } else {
      // Token is invalid or expired, redirect to signup
      navigate('/signup');
    }
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
    <Routes>
      <Route path="/directories" element={<HomePage />} /> 
      <Route path="/signup" element={<SignUp />} />
    </Routes>
  );
}

export default App;
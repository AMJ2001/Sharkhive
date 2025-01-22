import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './Home';  
import SignUp from './authentication/SignUp'; 
import logo from './logo.svg';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <Routes>
            <Route path="/directories" element={<HomePage />} /> 
            <Route path="/signup" element={<SignUp />} />  
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
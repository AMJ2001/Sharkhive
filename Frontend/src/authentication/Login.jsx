import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';
import { setUserEmail, setUserData } from '../store';
import { secretKey } from '../store';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showMfaField, setShowMfaField] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleMfaCodeChange = (e) => {
    setMfaCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      action: 'login',
      email,
      password,
      ...(showMfaField && { code: mfaCode }), // Include MFA code if it's required
    };

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.status === 200) {
        if (showMfaField) {
          const user = data.user_info;
          const payloadString = JSON.stringify({
            sessionEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            userDetails: user
          });
          localStorage.setItem('sessionMetaData', CryptoJS.AES.encrypt(payloadString, secretKey).toString());
          dispatch(setUserData(user));
          navigate('/directories');
        } else {
          // MFA required
          setShowMfaField(true);
          setErrorMessage('');
        }
      } else {
        setErrorMessage(data.message || 'Failed to log in. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter your password"
            required
          />
        </div>
        {showMfaField && (
          <div>
            <input
              type="text"
              value={mfaCode}
              onChange={handleMfaCodeChange}
              placeholder="Enter MFA code"
              required
            />
          </div>
        )}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <button type="submit" disabled={loading}>
          {showMfaField ? 'Verify MFA' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
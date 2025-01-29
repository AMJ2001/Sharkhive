import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import CryptoJS from 'crypto-js';
import { secretKey } from '../store';
import { setUserEmail, setUserData } from '../store';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const verifyEmail = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(`https://localhost:8000/api/verify-email/?email=${email}`);
      const data = await response.json();

      if (response.status === 400) {
        setErrorMessage(data.error);
        setShowPasswordFields(false);
      } else if (response.status === 200) {
        setErrorMessage('');
        setShowPasswordFields(true);
        dispatch(setUserEmail(email));
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedVerifyEmail = debounce(verifyEmail, 500);

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (newEmail.includes('@') && newEmail.endsWith('.com')) {
      debouncedVerifyEmail(newEmail);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    validatePassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    validateConfirmPassword(e.target.value);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d).+$/;
    if (password.length < 6) {
      setPasswordError('Password must be at least six characters long');
    } else if (!regex.test(password)) {
      setPasswordError('Password must have at least one capital letter and one number');
    } else {
      setPasswordError('');
    }
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (confirmPassword !== password && password !== '') {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      action: 'reg',
      email,
      username: name,
      role,
      password: password,
      mfa_type: 'email',
    };

    try {
      setLoading(true);
      const response = await fetch('https://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log(response.status);
      if (response.status === 200) {
        const user = data.user_info;
        const payloadString = JSON.stringify({
            sessionEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            userDetails: user
        });
        localStorage.setItem('sessionMetaData', CryptoJS.AES.encrypt(payloadString, secretKey).toString());
        dispatch(setUserData(user));
        setErrorMessage('');
        navigate('/directories');
      } else {
        setErrorMessage(data.message || 'Failed to sign up. Please try again.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setErrorMessage('Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
          />
          {loading && <span className="loading-icon">...</span>}

          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>

        {showPasswordFields && (
        <div>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter password"
            required
          />
          {passwordError && <div className="error-message">{passwordError}</div>}

          <input
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirm password"
            required
          />
          {confirmPasswordError && <div className="error-message">{confirmPasswordError}</div>}

          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter your name"
            required
          />
          <input
            type="text"
            value={role}
            onChange={handleRoleChange}
            placeholder="Enter your role"
            required
          />
        </div>
        )}

        <button type="submit" disabled={loading || passwordError || confirmPasswordError}>Submit</button>
      </form>
    </div>
  );
};

export default SignUp;
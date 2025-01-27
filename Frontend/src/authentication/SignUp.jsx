import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import bcrypt from 'bcryptjs';
import Cookies from 'js-cookie';
import { setUserEmail, setUserData } from '../store';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  // Debounce function to prevent API call on every keystroke
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
      const response = await fetch(`http://127.0.0.1:8000/api/verify-email/?email=${email}`);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hashedPassword = await bcrypt.hash(password, 10);
    const payload = {
      action: 'reg',
      email,
      username: name,
      role,
      password: hashedPassword,
      mfa_type: 'email',
    };
  
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
  
      if (response.status === 200) {
        Cookies.set('jwtToken', data.access_token, { httpOnly: true }); // Setting JWT token in HTTP-only cookie
        dispatch(setUserData(data.user));
        setErrorMessage('');
        navigator('./directories')
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
          <input
            type="password"
            placeholder="Confirm password"
            required
          />
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

        <button type="submit" disabled={loading}>Submit</button>
      </form>
    </div>
  );
};

export default SignUp;
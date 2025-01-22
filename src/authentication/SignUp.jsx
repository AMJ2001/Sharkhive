import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import bcrypt from 'bcryptjs';
import { setUserEmail } from '../store';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state for email verification
  const dispatch = useDispatch();

  // Debounce function to prevent API call on every keystroke
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Email verification API call
  const verifyEmail = async (email) => {
    try {
      setLoading(true); // Start loading indicator
      const response = { data: { exists: false } };//await fetch('https://api.example.com/verify-email', { email });

      if (response.data.exists) {
        setErrorMessage('Email already exists. Please log in.');
        setShowPasswordFields(false);
      } else {
        setErrorMessage('');
        setShowPasswordFields(true);
        dispatch(setUserEmail(email)); // Save email to Redux store
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  // Create debounced version of the verifyEmail function
  const debouncedVerifyEmail = debounce(verifyEmail, 500); // 500ms debounce delay

  // Handle email input change and trigger verification when conditions are met
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Trigger verification only after user finishes typing the email
    if (newEmail.includes('@') && newEmail.endsWith('.com')) {
      debouncedVerifyEmail(newEmail); // Call the debounced function
    }
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async () => {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Send the hashed password in the payload (not the raw password)
    const payload = {
      email,
      password: hashedPassword, // Use hashed password instead of plain password
    };

    try {
      setLoading(true);
      // const response = await fetch('https://api.example.com/verify-email', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ email })
      // });
      console.log(payload);
    } catch (error) {
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
          {loading && <span className="loading-icon">...</span>} {/* Loading icon next to the email input */}

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
          </div>
        )}

        <button type="submit" disabled={loading} onClick={handleSubmit}>Submit</button>
      </form>
    </div>
  );
};

export default SignUp;
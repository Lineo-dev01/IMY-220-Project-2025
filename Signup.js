import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        username,
        email,
        password,
        projectCreationCount: 0,
        checkoutCount: 0,
        checkinCount: 0,
        downloadCount: 0,
        badges: [],
        friends: [],
        socialMedias: [],
        proficiencies: [],
        projects: [],
        activity: [],
        joinedDate: new Date(),
        aboutMe: '',
        job: '',
        birthday: null,
        profileImage: ''
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      setUser({ _id: data.insertedId, username, email });
      navigate('/home');
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="auth-container">
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <label>Username</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />

        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />

        <label>Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

        <button type="submit">Sign Up</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default Signup;
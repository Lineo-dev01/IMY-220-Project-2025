import React from 'react';
import { useState } from 'react';
import { api } from '../api';

export default function Splash({ setUser, setPage }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      const path = isLogin ? '/login' : '/register';
      const body = isLogin ? { email, password: pass } : { email, password: pass };
      const u = await api(path, { method: 'POST', body: JSON.stringify(body) });
      setUser(u); setPage('home');
    } catch (err) { setMsg(err.message); }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '.5rem' }}>CodeVault</h1>
      <p style={{ marginBottom: '2rem', color: '#64748b' }}>
        Share, collaborate, and version-control your code.
      </p>

      <form onSubmit={submit} style={{ maxWidth: 360, margin: 'auto' }}>
        <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} required />
        <button className="btn" type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <a href="#" onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--primary)' }}>
          {isLogin ? 'Register' : 'Login'}
        </a>
      </p>
      {msg && <p style={{ color: 'red' }}>{msg}</p>}
    </div>
  );
}
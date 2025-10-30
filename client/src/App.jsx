import React from 'react';
import { useEffect, useState } from 'react';
import Splash from './components/Splash';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Profile from './components/Profile';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import Search from './components/Search';
import { api } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('splash');

  useEffect(() => {
    (async () => {
      try { 
        setUser(await api('/user')); 
        setPage('home'); 
      } catch { 
        setPage('splash'); 
      }
    })();
  }, []);

  const logout = async () => {
    await api('/logout', { method: 'POST' });
    setUser(null); 
    setPage('splash');
  };

  return (
  <>
    {user && <Navbar setPage={setPage} logout={logout} />}

    <div className="container">
      {user === null && page !== 'splash' && (
        <div style={{ textAlign: 'center', marginTop: '10vh' }}>
          <h2>Loading...</h2>
          <p>Please wait while we check your login...</p>
        </div>
      )}

      {page === 'splash' && <Splash setUser={setUser} setPage={setPage} />}

      {user && (
        <>
          {page === 'home' && <Home user={user} />}
          {page === 'profile' && <Profile user={user} setUser={setUser} setPage={setPage} />}
          {page === 'projects' && <Projects user={user} setPage={setPage} />}
          {page.startsWith('project-') && (
            <ProjectDetail id={page.split('-')[1]} user={user} />
          )}
          {page === 'search' && <Search setPage={setPage} />}
        </>
      )}

      {!user && page !== 'splash' && (
        <div style={{ textAlign: 'center', marginTop: '10vh' }}>
          <h2>Please log in</h2>
          <p>You need to be logged in to view this page.</p>
          <button className="btn" onClick={() => setPage('splash')}>
            Go to Login
          </button>
        </div>
      )}
    </div>
  </>
);
}

export default App;
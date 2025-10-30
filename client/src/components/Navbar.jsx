import React from 'react';

export default function Navbar({ setPage, logout }) {
  return (
    <nav style={{ 
      background: 'var(--primary)', 
      color: 'white', 
      padding: '.8rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        {}
        <h2 
          style={{ 
            cursor: 'pointer', 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }} 
          onClick={() => setPage('home')}
        >
          CodeVault
        </h2>

        {}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="btn" 
            style={{ 
              background: 'transparent', 
              border: '1px solid white', 
              color: 'white',
              padding: '0.5rem 1rem'
            }}
            onClick={() => setPage('home')}
          >
            Home
          </button>

          <button 
            className="btn" 
            style={{ 
              background: 'transparent', 
              border: '1px solid white', 
              color: 'white',
              padding: '0.5rem 1rem'
            }}
            onClick={() => setPage('profile')}
          >
            Profile
          </button>

          <button 
            className="btn" 
            style={{ 
              background: 'transparent', 
              border: '1px solid white', 
              color: 'white',
              padding: '0.5rem 1rem'
            }}
            onClick={() => setPage('projects')}
          >
            Projects
          </button>

          {}
          <button 
            className="btn" 
            style={{ 
              background: 'transparent', 
              border: '1px solid white', 
              color: 'white',
              padding: '0.5rem 1rem',
              fontWeight: 'bold'
            }}
            onClick={() => setPage('search')}
          >
            Search
          </button>

          {}
          <button 
            className="btn" 
            style={{ 
              background: '#dc2626', 
              color: 'white',
              padding: '0.5rem 1rem'
            }} 
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
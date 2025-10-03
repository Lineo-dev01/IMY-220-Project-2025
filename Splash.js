import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import '../styles/Splash.css'; 

function Splash() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/home');
  }, [user, navigate]);

  return (
    <div className="splash-page">
      <header className="header">
        <button className="sign-in" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </header>

      <main className="main">
        <div className="hero">
          <svg className="beetle-icon" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50 C120 30 150 30 170 50 L180 60 L170 70 C150 50 120 50 100 70 C80 50 50 50 30 70 L20 60 L30 50 C50 30 80 30 100 50Z" stroke="white" strokeWidth="5"/>
            <path d="M100 70 L100 150" stroke="white" strokeWidth="5"/>
            <path d="M100 150 L80 170" stroke="white" strokeWidth="5"/>
            <path d="M100 150 L120 170" stroke="white" strokeWidth="5"/>
            <path d="M100 120 L60 140" stroke="white" strokeWidth="5"/>
            <path d="M100 120 L140 140" stroke="white" strokeWidth="5"/>
            <path d="M100 90 L50 110" stroke="white" strokeWidth="5"/>
            <path d="M100 90 L150 110" stroke="white" strokeWidth="5"/>
          </svg>

          <h1>Beetle Control</h1>
          <p>Version control for student projects. Add friends, share code, and track every change.</p>
          <button className="get-started" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </div>

        <div className="features">
          <div className="feature-card">
            <svg className="icon" viewBox="0 0 100 100" fill="none">
              <path d="M10 20 H40 L50 30 H90 V80 H10 V20Z" stroke="white" strokeWidth="5"/>
              <path d="M10 40 H90" stroke="white" strokeWidth="5"/>
            </svg>
            <h2>Version Control</h2>
            <p>Easily check in/out projects, upload files, and view version history.</p>
          </div>

          <div className="feature-card">
            <svg className="icon" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="10" stroke="white" strokeWidth="5"/>
              <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="5"/>
              <circle cx="80" cy="20" r="10" stroke="white" strokeWidth="5"/>
              <circle cx="20" cy="80" r="10" stroke="white" strokeWidth="5"/>
              <circle cx="80" cy="80" r="10" stroke="white" strokeWidth="5"/>
              <line x1="50" y1="50" x2="20" y2="20" stroke="white" strokeWidth="5"/>
              <line x1="50" y1="50" x2="80" y2="20" stroke="white" strokeWidth="5"/>
              <line x1="50" y1="50" x2="20" y2="80" stroke="white" strokeWidth="5"/>
              <line x1="50" y1="50" x2="80" y2="80" stroke="white" strokeWidth="5"/>
            </svg>
            <h2>Work with Friends</h2>
            <p>Invite classmates or collaborators and track each member's contributions.</p>
          </div>

          <div className="feature-card">
            <svg className="icon" viewBox="0 0 100 100" fill="none">
              <path d="M50 10 C20 10 10 40 30 60 C10 80 20 90 50 90 C80 90 90 80 70 60 C90 40 80 10 50 10Z" stroke="white" strokeWidth="5"/>
              <path d="M40 30 C35 40 45 50 40 60" stroke="white" strokeWidth="5"/>
              <path d="M60 30 C65 40 55 50 60 60" stroke="white" strokeWidth="5"/>
            </svg>
            <h2>Smart Tags & Search</h2>
            <p>Use hashtags and filters to find the projects, files, or users you need.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Splash;
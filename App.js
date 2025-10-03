import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ProjectPage from './pages/ProjectPage1';
import CreateProject from './pages/CreateProject';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Splash from './pages/Splash';

function App() {
  return (
    <UserProvider>
      <Router>
        {/* Navbar will only render links if user is logged in */}
        <Navbar />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/projects" element={<ProjectPage />} /> {/* all projects page */}
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Splash />} />  {/* Splash page as root */}
          <Route path="*" element={<Splash />} />  {/* Fallback */}
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
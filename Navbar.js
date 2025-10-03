import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

const Navbar = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null); 
    navigate('/'); 
  };

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <Link to="/home" style={styles.link}>MyApp</Link>
      </div>
      <ul style={styles.menu}>
        <li><Link to="/home" style={styles.link}>Home</Link></li>
        <li><Link to={`/profile/${user._id}`} style={styles.link}>Profile</Link></li>
        <li><Link to="/projects" style={styles.link}>Projects</Link></li>
        <li><Link to="/search" style={styles.link}>Search</Link></li>
        <li><button onClick={handleLogout} style={styles.logout}>Logout</button></li>
      </ul>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    padding: '10px 20px',
    color: 'white',
  },
  logo: { fontWeight: 'bold', fontSize: '1.2em' },
  menu: { listStyle: 'none', display: 'flex', gap: '15px', margin: 0, padding: 0 },
  link: { color: 'white', textDecoration: 'none' },
  logout: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1em' }
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Profile({ user, setUser, setPage }) {
  const [name, setName] = useState(user.name || '');
  const [myProjects, setMyProjects] = useState([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const projs = await api('/projects');
        const myProjs = projs.filter(p =>
          user.projects?.some(id => id.toString() === p._id.toString())
        );
        setMyProjects(myProjs);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    })();
  }, [user]);

  const save = async () => {
    await api('/profile', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    setUser({ ...user, name });
  };

  return (
    <div>
      <h2>Profile</h2>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <button className="btn" onClick={save}>Save</button>

      <div style={{ marginTop: '2rem' }}>
        <h3>Friends</h3>
        {user.friends?.length ? (
          user.friends.map(f => <div key={f}>{f}</div>)
        ) : (
          <p>None</p>
        )}
      </div>

      {}
      <div style={{ marginTop: '2rem' }}>
        <h3>My Projects ({myProjects.length})</h3>
        {myProjects.length === 0 ? (
          <p>No projects yet.</p>
        ) : (
          myProjects.map(p => (
            <div
              key={p._id}
              onClick={() => setPage(`project-${p._id}`)}
              style={{
                cursor: 'pointer',
                padding: '0.75rem',
                background: 'var(--card)',
                marginBottom: '0.5rem',
                borderRadius: 'var(--radius)'
              }}
            >
              <strong>{p.name}</strong> - v{p.version}
              <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                {p.description}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
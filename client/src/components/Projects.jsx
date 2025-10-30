import React, { useEffect, useState } from 'react';
import { api } from '../api';
import ProjectCreate from './ProjectCreate';

export default function Projects({ user, setPage }) {
  const [projs, setProjs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => setProjs(await api('/projects'));
  useEffect(() => { load(); }, []);

  const afterCreate = p => {
    setProjs([...projs, p]);
    setShowCreate(false);
  };

  return (
    <div>
      <h2>Projects</h2>

      <button className="btn" onClick={() => setShowCreate(true)} style={{ marginBottom: '1rem' }}>
        + New Project
      </button>

      {showCreate && (
        <ProjectCreate 
          user={user} 
          onCreated={afterCreate} 
          onCancel={() => setShowCreate(false)} 
        />
      )}

      {projs.map(p => (
        <div key={p._id}
             style={{ background:'var(--card)', padding:'1rem', marginBottom:'.5rem',
                      borderRadius:'var(--radius)', cursor:'pointer' }}
             onClick={() => setPage(`project-${p._id}`)}>
          <strong>{p.name}</strong> – {p.description}
          {p.image && <img src={`/api/file/${p.image}`} alt="" style={{ width:40, height:40, marginLeft:8, borderRadius:4 }} />}
        </div>
      ))}
    </div>
  );
}
import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { useParams } from 'react-router-dom';

function ProjectPage() {
  const { user } = useContext(UserContext);
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/projects/${id}`)
      .then(res => res.json())
      .then(data => setProject(data))
      .catch(err => console.error(err));
  }, [id]);

  const handleCheckout = async () => {
    await fetch(`http://localhost:5000/api/projects/${id}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id })
    });
    setProject({...project, status: 'checked_out'});
  };

  const handleCheckin = async () => {
    await fetch(`http://localhost:5000/api/projects/${id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id, message: 'Updated project', updatedFiles: project.files })
    });
    setProject({...project, status: 'checked_in'});
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Languages: {project.programmingLanguages.join(', ')}</p>
      <p>Type: {project.type}</p>
      <p>Version: {project.version}</p>
      <p>Status: {project.status}</p>
      <p>Owner: {project.owner}</p>
      <h3>Members</h3>
      <ul>
        {project.members.map(m => <li key={m}>{m}</li>)}
      </ul>
      <h3>Files</h3>
      <ul>
        {project.files.map(f => (
          <li key={f.name}>
            {f.name} <button onClick={() => window.open(`http://localhost:5000/api/projects/${id}/files/${f.name}?userId=${user._id}`)}>Download</button>
          </li>
        ))}
      </ul>
      <h3>Activity</h3>
      <ul>
        {project.activity.map((a, idx) => (
          <li key={idx}>
            {a.userId} {a.action}: {a.message} ({new Date(a.timestamp).toLocaleString()})
          </li>
        ))}
      </ul>
      {project.status === 'checked_in' ? (
        <button onClick={handleCheckout}>Check Out</button>
      ) : (
        <button onClick={handleCheckin}>Check In</button>
      )}
    </div>
  );
}

export default ProjectPage;
import React, { useEffect, useState } from 'react';
import { api, apiForm } from '../api';

export default function ProjectDetail({ id, user }) {
  const [proj, setProj] = useState(null);
  const [msg, setMsg] = useState('');
  const [version, setVersion] = useState('');
  const [files, setFiles] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');

  const load = async () => setProj(await api(`/project/${id}`));
  useEffect(() => { load(); }, [id]);

  const checkout = async () => {
    await api(`/project/checkout/${id}`, { method: 'POST' });
    setProj({ ...proj, status: 'checkedOut', checkedOutBy: user._id });
  };

  const checkin = async e => {
    e.preventDefault();
    const form = new FormData();
    form.append('message', msg);
    form.append('version', version);
    [...files].forEach(f => form.append('files', f));
    await apiForm(`/project/checkin/${id}`, form);
    load();
    setMsg(''); setVersion(''); setFiles([]);
  };

  const deleteProj = async () => {
    if (!window.confirm('Delete project?')) return;
    await api(`/project/${id}`, { method: 'DELETE' });
    window.location.href = '/#/projects';
  };

  const transferOwner = async () => {
    await api(`/project/owner/${id}`, { method: 'POST', body: JSON.stringify({ newOwnerId }) });
    load();
  };

  const removeMember = async uid => {
    await api(`/project/member/${id}/${uid}`, { method: 'DELETE' });
    load();
  };

  const addMember = async e => {
    e.preventDefault();
    const friend = user.friends.find(f => f.email === memberEmail);
    if (!friend) return alert('Not your friend');
    await api(`/project/member/${id}`, { method: 'POST', body: JSON.stringify({ userId: friend._id }) });
    setMemberEmail(''); setShowAddMember(false); load();
  };

  const download = () => {
    window.location.href = `/api/project/download/${id}`;
  };

  if (!proj) return <p>Loading…</p>;

  const isOwner = proj.owner === user._id;
  const isMember = proj.members.includes(user._id) || isOwner;
  const canCheckout = proj.status === 'checkedIn' && isMember;
  const canCheckin = proj.status === 'checkedOut' && proj.checkedOutBy === user._id;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem' }}>
        {proj.image && (
          <img src={`/api/file/${proj.image}`} alt={proj.name}
               style={{ width:80, height:80, borderRadius:8, cursor:'pointer' }}
               onClick={() => window.open(`/api/file/${proj.image}`, '_blank')} />
        )}
        <div>
          <h2>{proj.name}</h2>
          <p><strong>Type:</strong> {proj.type?.name || '—'}</p>
          <p><strong>Version:</strong> {proj.version}</p>
          <p><strong>Created:</strong> {new Date(proj.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <p>{proj.description}</p>

      <div style={{ marginBottom:'1rem' }}>
        {proj.hashtags?.map((h,i) => (
          <span
            key={i}
            style={{ marginRight:'.5rem', color:'var(--primary)', cursor:'pointer', textDecoration:'underline' }}
            onClick={() => setPage(`search?tag=${encodeURIComponent(h.slice(1))}`)}
          >
            {h}
          </span>
        ))}
      </div>

     
      <p>Status: <strong>{proj.status}</strong></p>

      {canCheckout && <button className="btn" onClick={checkout}>Checkout</button>}
      {canCheckin && (
        <form onSubmit={checkin} style={{ marginTop:'1rem' }}>
          <textarea placeholder="Check-in message" required value={msg} onChange={e=>setMsg(e.target.value)} />
          <input placeholder="New version (e.g. 1.1.0)" required value={version} onChange={e=>setVersion(e.target.value)} />
          <input type="file" multiple onChange={e=>setFiles(e.target.files)} />
          <button className="btn" type="submit">Check-in</button>
        </form>
      )}

      
      <button className="btn" onClick={download} style={{ marginLeft:'.5rem', background:'#10b981' }}>
        Download ZIP
      </button>

      {isOwner && (
        <div style={{ marginTop:'2rem', padding:'1rem', background:'var(--card)', borderRadius:'var(--radius)' }}>
          <h4>Owner tools</h4>
          <button className="btn" onClick={() => setShowEdit(true)}>Edit project</button>
          <button className="btn" onClick={deleteProj} style={{ background:'#dc2626', marginLeft:'.5rem' }}>Delete</button>

          <div style={{ marginTop:'.5rem' }}>
            <select value={newOwnerId} onChange={e=>setNewOwnerId(e.target.value)}>
              <option value="">-- select new owner --</option>
              {proj.members.filter(m=>m!==proj.owner).map(m=>
                <option key={m} value={m}>{m}</option>)}
            </select>
            <button className="btn" onClick={transferOwner} disabled={!newOwnerId}>Transfer</button>
          </div>
        </div>
      )}

     
      <div style={{ marginTop:'2rem' }}>
        <h4>Members ({proj.members.length})</h4>
        {proj.members.map(m => (
          <div key={m} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>{m}</span>
            {isOwner && m!==proj.owner && <button className="btn" style={{ background:'#ef4444', fontSize:'.8rem' }} onClick={()=>removeMember(m)}>Remove</button>}
          </div>
        ))}

        {isMember && (
          <button className="btn" onClick={() => setShowAddMember(true)} style={{ marginTop:'.5rem' }}>
            + Add friend
          </button>
        )}
        {showAddMember && (
          <form onSubmit={addMember} style={{ marginTop:'.5rem' }}>
            <input placeholder="Friend email" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} />
            <button className="btn" type="submit">Add</button>
          </form>
        )}
      </div>

      <h3 style={{ marginTop:'2rem' }}>Activity</h3>
      {proj.activity?.length ? proj.activity.map((a,i) => (
        <div key={i} style={{
          display:'flex', gap:'1rem', background:'var(--card)', padding:'1rem',
          marginBottom:'.5rem', borderRadius:'var(--radius)', alignItems:'center'
        }}>
          {a.user?.image && <img src={`/api/file/${a.user.image}`} alt="" style={{ width:40, height:40, borderRadius:'50%' }} />}
          <div>
            <strong>{a.user?.name || a.userId}</strong> {a.type === 'checkout' ? 'checked out' : 'checked in'} <em>{proj.name}</em>
            <div style={{ fontSize:'.9rem', color:'var(--gray)' }}>{new Date(a.date).toLocaleString()}</div>
            {a.message && <p style={{ margin:'0.2rem 0 0' }}>{a.message}</p>}
          </div>
        </div>
      )) : <p>No activity yet.</p>}

      {showEdit && isOwner && <EditProject proj={proj} onSave={load} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

function EditProject({ proj, onSave, onClose }) {
  const [name, setName] = useState(proj.name);
  const [desc, setDesc] = useState(proj.description);
  const [type, setType] = useState(proj.type?._id || '');
  const [image, setImage] = useState(null);
  const [types, setTypes] = useState([]);

  useEffect(() => { (async()=>setTypes(await api('/project/types')))(); }, []);

  const submit = async e => {
    e.preventDefault();
    if (image && image.size > 5 * 1024 * 1024) return alert('Image ≤5 MB');
    const form = new FormData();
    form.append('name', name);
    form.append('description', desc);
    form.append('type', type);
    if (image) form.append('image', image);
    await apiForm(`/project/${proj._id}`, form, 'PUT');
    onSave(); onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <form onSubmit={submit} style={{ background:'white', padding:'2rem', borderRadius:'var(--radius)', maxWidth:500 }}>
        <h4>Edit Project</h4>
        <label>Name <input required value={name} onChange={e=>setName(e.target.value)} /></label>
        <label>Description <textarea required value={desc} onChange={e=>setDesc(e.target.value)} /></label>
        <label>Type
          <select required value={type} onChange={e=>setType(e.target.value)}>
            <option value="">-- select --</option>
            {types.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </label>
        <label>New image (≤5 MB) <input type="file" accept="image/*" onChange={e=>setImage(e.target.files[0])} /></label>
        <div style={{ marginTop:'1rem' }}>
          <button className="btn" type="submit">Save</button>
          <button className="btn" type="button" onClick={onClose} style={{ marginLeft:'.5rem', background:'#94a3b8' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
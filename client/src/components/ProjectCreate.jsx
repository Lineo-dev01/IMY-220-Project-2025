import React, { useState } from 'react';
import { apiForm } from '../api';

export default function ProjectCreate({ user, onCreated, onCancel }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [hashtags, setHashtags] = useState('');
  const [image, setImage] = useState(null);
  const [files, setFiles] = useState([]);

  const submit = async e => {
    e.preventDefault();
    if (image && image.size > 5 * 1024 * 1024) {
      alert('Image must be ≤5 MB');
      return;
    }

    const form = new FormData();
    form.append('name', name);
    form.append('description', desc);
    form.append('type', 'General');
    form.append('version', version);
    hashtags.split(',').map(t => t.trim()).filter(t => t).forEach(t => 
      form.append('hashtags', t.startsWith('#') ? t : `#${t}`)
    );
    if (image) form.append('image', image);
    [...files].forEach(f => form.append('files', f));

    const p = await apiForm('/project', form);
    onCreated(p);
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 600, margin: 'auto' }}>
      <h3>Create Project</h3>

      <label>Name <input required value={name} onChange={e=>setName(e.target.value)} /></label>
      <label>Description <textarea required value={desc} onChange={e=>setDesc(e.target.value)} /></label>


      <label>Version <input required value={version} onChange={e=>setVersion(e.target.value)} /></label>

      <label>Hashtags (comma separated) <input placeholder="#js, #react" value={hashtags} onChange={e=>setHashtags(e.target.value)} /></label>

      <label>Project image (≤5 MB)
        <input type="file" accept="image/*" onChange={e=>setImage(e.target.files[0])} />
      </label>

      <label>Initial files
        <input type="file" multiple onChange={e=>setFiles(e.target.files)} />
      </label>

      <div style={{ marginTop: '1rem' }}>
        <button className="btn" type="submit">Create</button>
        <button className="btn" type="button" onClick={onCancel} style={{ marginLeft:'.5rem', background:'#94a3b8' }}>Cancel</button>
      </div>
    </form>
  );
}
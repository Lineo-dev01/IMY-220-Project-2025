import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Search({ setPage }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], projects: [] });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      search(q);
    }
  }, []);

  const search = async (q) => {
    if (!q.trim()) {
      setResults({ users: [], projects: [] });
      return;
    }
    const res = await api(`/search?q=${encodeURIComponent(q)}`);
    setResults(res);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      search(query);
      window.history.pushState(null, '', `#/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto' }}>
      <h2>Search Projects & Users</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search by name, hashtag, or type..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
        />
        <button type="submit" className="btn" style={{ marginTop: '0.5rem' }}>
          Search
        </button>
      </form>

      {results.users.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Users</h3>
          {results.users.map(u => (
            <div
              key={u._id}
              style={{
                padding: '0.75rem',
                background: 'var(--card)',
                marginBottom: '0.5rem',
                borderRadius: 'var(--radius)',
                cursor: 'pointer'
              }}
              onClick={() => setPage('profile')}
            >
              <strong>{u.name}</strong> ({u.email})
            </div>
          ))}
        </div>
      )}

      {results.projects.length > 0 && (
        <div>
          <h3>Projects</h3>
          {results.projects.map(p => (
            <div
              key={p._id}
              style={{
                padding: '1rem',
                background: 'var(--card)',
                marginBottom: '0.75rem',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
              onClick={() => setPage(`project-${p._id}`)}
            >
              {p.image && (
                <img src={`/api/file/${p.image}`} alt={p.name} style={{ width: 50, height: 50, borderRadius: 8 }} />
              )}
              <div>
                <strong>{p.name}</strong>
                <p style={{ margin: '0.25rem 0', color: 'var(--gray)' }}>{p.description}</p>
                <div>
                  {p.hashtags.map((h, i) => (
                    <span key={i} style={{ color: 'var(--primary)', marginRight: '0.5rem' }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {query && results.users.length === 0 && results.projects.length === 0 && (
        <p>No results found for "<strong>{query}</strong>"</p>
      )}
    </div>
  );
}
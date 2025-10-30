
import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Home({ user }) {
  const [feed, setFeed] = useState([]);
  const [type, setType] = useState('global');
  const [sort, setSort] = useState('activity._id'); 

  useEffect(() => {
    (async () => {
      try {
        const acts = await api(`/activity?type=${type}&sort=${sort}`);
        setFeed(acts);
      } catch (err) {
        console.error('Failed to load activity:', err);
      }
    })();
  }, [type, sort]);

  return (
    <div>
      <h2>Activity Feed</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn" onClick={() => setType('global')} disabled={type === 'global'}>
          Global
        </button>
        <button
          className="btn"
          style={{ marginLeft: '.5rem' }}
          onClick={() => setType('local')}
          disabled={type === 'local'}
        >
          Local
        </button>
        <select
          style={{ marginLeft: '1rem' }}
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="activity._id">Newest</option>
          <option value="message">Message</option>
        </select>
      </div>

      {feed.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        feed.map((a, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '1rem',
              background: 'var(--card)',
              padding: '1rem',
              marginBottom: '.5rem',
              borderRadius: 'var(--radius)',
              alignItems: 'center'
            }}
          >
            {a.project?.image && (
              <img
                src={`/api/file/${a.project.image}`}
                alt=""
                style={{ width: 48, height: 48, borderRadius: 8 }}
              />
            )}
            <div>
              <strong>{a.user?.name || a.userId}</strong>{' '}
              {a.type === 'checkout' ? 'checked out' : 'checked in'}{' '}
              <em>{a.project?.name}</em>
              <div style={{ fontSize: '.85rem', color: 'var(--gray)' }}>
                {new Date(a._id).toLocaleString()}
              </div>
              {a.message && <p style={{ margin: '0.2rem 0 0' }}>{a.message}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
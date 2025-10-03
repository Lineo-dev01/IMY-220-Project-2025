import React, { useState } from 'react';

function Search() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/search?query=${encodeURIComponent(query)}&type=${type}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search failed', err);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Search</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          style={{ flex: 1, padding: '8px' }}
        />
        <select value={type} onChange={e => setType(e.target.value)} style={{ padding: '8px' }}>
          <option value="users">Users</option>
          <option value="projects">Projects</option>
          <option value="checkins">Check-ins</option>
          <option value="all">All</option>
        </select>
        <button onClick={handleSearch} style={{ padding: '8px 12px' }}>Search</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {results.length === 0 ? (
            <li>No results found</li>
          ) : (
            results.map((r, idx) => (
              <li key={idx} style={{ marginBottom: '8px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}>
                {r._resultType === 'user' && (
                  <div>
                    <strong>User:</strong> {r.username} ({r.email})<br/>
                    {r.job && <small>Job: {r.job}</small>}
                  </div>
                )}
                {r._resultType === 'project' && (
                  <div>
                    <strong>Project:</strong> {r.name} ({r.type})<br/>
                    <small>Languages: {r.programmingLanguages.join(', ')}</small>
                  </div>
                )}
                {r._resultType === 'checkin' && (
                  <div>
                    <strong>Check-in:</strong> {r.message}<br/>
                    <small>Project: {r.projectName}</small>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default Search;
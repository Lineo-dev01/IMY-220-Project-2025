import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

function Profile({ userId }) {
  const { user, setUser } = useContext(UserContext);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));
  }, [userId]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      console.log(data);
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile.username}</h1>
      <img src={profile.profileImage || '/default-avatar.png'} alt="profile" width={100} />
      <p>About Me: {profile.aboutMe || 'N/A'}</p>
      <p>Job: {profile.job || 'N/A'}</p>
      <p>Joined: {profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'N/A'}</p>
      <p>Birthday: {profile.birthday ? new Date(profile.birthday).toLocaleDateString() : 'N/A'}</p>
      <p>Proficiencies: {(profile.proficiencies || []).join(', ')}</p>
      <p>Badges: {(profile.badges || []).join(', ')}</p>

      <h3>Social Media</h3>
      <ul>
        {(profile.socialMedias || []).map((sm, idx) => (
          <li key={idx}><a href={sm.url}>{sm.type}</a></li>
        ))}
      </ul>

      <h3>Friends</h3>
      <ul>
        {(profile.friends || []).map(f => <li key={f}>{f}</li>)}
      </ul>

      <button onClick={handleDelete}>Delete Profile</button>
    </div>
  );
}

export default Profile;
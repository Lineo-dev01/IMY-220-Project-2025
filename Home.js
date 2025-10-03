import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import "../styles/Home.css";
import CreateProject from "./CreateProject";

function Home() {
  const { user } = useContext(UserContext);
  const [localActivity, setLocalActivity] = useState([]);
  const [globalActivity, setGlobalActivity] = useState([]);
  const [activeTab, setActiveTab] = useState("local");

  useEffect(() => {
    if (!user?._id) return;

    fetch(`http://localhost:5000/api/activity/local?userId=${user._id}`)
      .then((res) => res.json())
      .then((data) => setLocalActivity(Array.isArray(data) ? data : []));

    fetch(`http://localhost:5000/api/activity/global`)
      .then((res) => res.json())
      .then((data) => setGlobalActivity(Array.isArray(data) ? data : []));
  }, [user]);

  const handleNewProject = (project) => {
    const newActivity = {
      username: user.username,
      action: "created a new project",
      message: project.name,
      projectImage: project.image,
      tags: project.hashtags,
      timestamp: new Date().toISOString(),
    };

    setLocalActivity((prev) => [newActivity, ...prev]);
    setGlobalActivity((prev) => [newActivity, ...prev]);
  };

  const renderPosts = (activities) =>
    activities.map((a, idx) => (
      <article className="post-card" key={idx}>
        {a.projectImage && (
          <div className="post-image">
            <img
              src={a.projectImage}
              alt="project"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "16px",
              }}
            />
          </div>
        )}
        <div className="post-footer">
          <p className="post-description">
            <strong>{a.username || "Unknown User"}</strong> {a.action}: {a.message}
          </p>
          <span className="post-time">{new Date(a.timestamp).toLocaleString()}</span>
          {a.tags && (
            <div className="post-tags">
              {a.tags.map((t, i) => (
                <span className="tag" key={i}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    ));

  return (
    <div className="main-content">
      <header className="header">
        <h1>Activity Feed</h1>
      </header>

      {/* Create Project */}
      <CreateProject onProjectCreated={handleNewProject} />

      <div className="controls">
        <div className="tab-group">
          <button
            className={`tab ${activeTab === "local" ? "active" : ""}`}
            onClick={() => setActiveTab("local")}
          >
            Local
          </button>
          <button
            className={`tab ${activeTab === "global" ? "active" : ""}`}
            onClick={() => setActiveTab("global")}
          >
            Global
          </button>
        </div>
      </div>

      <div className="posts-grid">
        {activeTab === "local" && renderPosts(localActivity)}
        {activeTab === "global" && renderPosts(globalActivity)}
      </div>
    </div>
  );
}

export default Home;
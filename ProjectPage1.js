import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import "../styles/ProjectPage.css";

const ProjectPage = () => {
  const { user } = useContext(UserContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const fetchProjects = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/projects/user/${user._id}`);
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  if (loading) return <p>Loading projects...</p>;
  if (projects.length === 0) return <p>No projects found for your account.</p>;

  return (
    <div className="projects-page">
      <h1>Your Projects</h1>
      <div className="projects-grid">
        {projects.map((project) => (
          <div className="project-card" key={project._id}>
            {project.image && (
              <div className="project-image">
                <img
                  src={project.image}
                  alt={project.name}
                  style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px" }}
                />
              </div>
            )}
            <div className="project-details">
              <h2>{project.name}</h2>
              <p>{project.description}</p>
              {project.hashtags && (
                <div className="project-tags">
                  {project.hashtags.map((tag, i) => (
                    <span className="tag" key={i}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p>
                <strong>Owner:</strong> {project.ownerUsername || "Unknown"}
              </p>
              <p>
                <strong>Status:</strong> {project.status}
              </p>
              <p>
                <strong>Version:</strong> {project.version}
              </p>
              <p>
                <strong>Created on:</strong> {new Date(project.creationDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectPage;
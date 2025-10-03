import React, { useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";

const CreateProject = ({ onProjectCreated }) => {
  const { user } = useContext(UserContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setMessage("You must be logged in to create a project.");

    const projectData = {
      name,
      description,
      hashtags: hashtags.split(",").map((tag) => tag.trim()),
      image,
      owner: user._id,
      members: [user._id],
      files: [],
      activity: [],
      type: "web",
      version: "1.0",
      status: "checked_in",
      creationDate: new Date(),
    };

    try {
      const res = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const result = await res.json();
      setMessage("Project created successfully!");
      setName("");
      setDescription("");
      setHashtags("");
      setImage("");

      if (onProjectCreated) onProjectCreated(result);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Error creating project");
    }
  };

  return (
    <div className="create-project-page">
      <h2>Create New Project</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Project Name:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div>
          <label>Hashtags (comma-separated):</label>
          <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
        </div>
        <div>
          <label>Image URL:</label>
          <input value={image} onChange={(e) => setImage(e.target.value)} />
        </div>
        <button type="submit">Create Project</button>
      </form>
    </div>
  );
};

export default CreateProject;
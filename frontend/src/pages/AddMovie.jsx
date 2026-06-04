import { useState } from "react";

export default function AddMovie() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration_minutes: "",
    language: "",
  });

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/movies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    alert("Movie added");
  };

  return (
    <div>
      <h2>Add Movie</h2>

      <input placeholder="Title" onChange={(e) => setForm({...form, title: e.target.value})} />
      <input placeholder="Description" onChange={(e) => setForm({...form, description: e.target.value})} />
      <input placeholder="Duration" onChange={(e) => setForm({...form, duration_minutes: e.target.value})} />
      <input placeholder="Language" onChange={(e) => setForm({...form, language: e.target.value})} />

      <button onClick={handleSubmit}>Add Movie</button>
    </div>
  );
}
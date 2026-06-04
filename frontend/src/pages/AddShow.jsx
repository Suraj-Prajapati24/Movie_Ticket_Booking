import { useState } from "react";

export default function AddShow() {
  const [form, setForm] = useState({
    movie_id: "",
    screen_number: "",
    start_time: "",
    end_time: "",
  });

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/shows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    alert("Show added");
  };

  return (
    <div>
      <h2>Add Show</h2>

      <input placeholder="Movie ID" onChange={(e) => setForm({...form, movie_id: e.target.value})} />
      <input placeholder="Screen" onChange={(e) => setForm({...form, screen_number: e.target.value})} />
      <input placeholder="Start Time" onChange={(e) => setForm({...form, start_time: e.target.value})} />
      <input placeholder="End Time" onChange={(e) => setForm({...form, end_time: e.target.value})} />

      <button onClick={handleSubmit}>Add Show</button>
    </div>
  );
}
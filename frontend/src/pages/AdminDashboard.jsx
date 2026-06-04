import { useState } from "react";
import AddMovie from "./AddMovie";
import AddShow from "./AddShow";

export default function AdminDashboard() {
  const [view, setView] = useState("movies");
  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      <button onClick={() => setView("movies")}>Add Movie</button>
      <button onClick={() => setView("shows")}>Add Show</button>

      {view === "movies" && <AddMovie />}
      {view === "shows" && <AddShow />}
    </div>
  );
}
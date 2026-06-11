import { useState } from "react";
import AddMovie from "./AddMovie";
import AddShow from "./AddShow";
import ManageShows from "./ManageShows";

export default function AdminDashboard() {
  const [view, setView] = useState("manage");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.reload();
  };

  return (
    <>
      <header className="app-header">
        <div className="logo">🎬 <span>Movie</span>Junction</div>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Admin Panel</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </header>

      <div className="page">
        <h2 className="page-title">Admin Dashboard</h2>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${view === "manage" ? "active" : ""}`}
            onClick={() => setView("manage")}
          >
            All Shows
          </button>
          <button
            className={`admin-tab ${view === "movies" ? "active" : ""}`}
            onClick={() => setView("movies")}
          >
            Add Movie
          </button>
          <button
            className={`admin-tab ${view === "shows" ? "active" : ""}`}
            onClick={() => setView("shows")}
          >
            Add Show
          </button>
        </div>

        {view === "manage" && <ManageShows />}
        {view === "movies" && <AddMovie />}
        {view === "shows" && <AddShow />}
      </div>
    </>
  );
}

import { useState } from "react";
import MoviesPage from "./pages/MoviesPage";
import ShowsPage from "./pages/ShowsPage";
import SeatsPage from "./pages/SeatsPage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  const role = localStorage.getItem("role");
  if (!isLoggedIn) {
    return <AuthPage onLogin={() => setIsLoggedIn(true)} />;
  }

  if (role === "manager") {
    return <AdminDashboard />;
  }

  return (
    <div className="container">
      <div style={{ padding: "20px" }}>
        <h1>MovieJunction</h1>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            setIsLoggedIn(false);
          }}
        >
          Logout
        </button>
        {!selectedMovie && <MoviesPage onSelectMovie={setSelectedMovie} />}

        {selectedMovie && !selectedShow && (
          <div>
            <button onClick={() => setSelectedMovie(null)}>⬅ Back</button>

            <ShowsPage movieId={selectedMovie} onSelectShow={setSelectedShow} />
          </div>
        )}

        {selectedShow && (
          <div>
            <button onClick={() => setSelectedShow(null)}>⬅ Back</button>

            <SeatsPage showId={selectedShow} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

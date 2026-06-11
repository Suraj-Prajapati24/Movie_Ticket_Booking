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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
  };

  const handleSelectMovie = (movieId, movieTitle) => {
    setSelectedMovie({ id: movieId, title: movieTitle });
    setSelectedShow(null);
  };

  const handleSelectShow = (showId) => {
    setSelectedShow(showId);
  };

  const handleBackToMovies = () => {
    setSelectedMovie(null);
    setSelectedShow(null);
  };

  const handleBackToShows = () => {
    setSelectedShow(null);
  };

  return (
    <>
      <header className="app-header">
        <div className="logo">🎬 <span>Movie</span>Junction</div>

        <nav className="breadcrumb">
          <span
            style={{ cursor: selectedMovie ? "pointer" : "default", color: selectedMovie ? "var(--text-muted)" : "var(--gold)" }}
            onClick={selectedMovie ? handleBackToMovies : undefined}
          >
            Movies
          </span>
          {selectedMovie && (
            <>
              <span className="sep">›</span>
              <span
                style={{ cursor: selectedShow ? "pointer" : "default", color: selectedShow ? "var(--text-muted)" : "var(--gold)" }}
                onClick={selectedShow ? handleBackToShows : undefined}
              >
                {selectedMovie.title}
              </span>
            </>
          )}
          {selectedShow && (
            <>
              <span className="sep">›</span>
              <span className="current">Select Seats</span>
            </>
          )}
        </nav>

        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="page">
        {!selectedMovie && (
          <MoviesPage onSelectMovie={handleSelectMovie} />
        )}

        {selectedMovie && !selectedShow && (
          <ShowsPage
            movieId={selectedMovie.id}
            movieTitle={selectedMovie.title}
            onSelectShow={handleSelectShow}
            onBack={handleBackToMovies}
          />
        )}

        {selectedShow && (
          <SeatsPage
            showId={selectedShow}
            onBack={handleBackToShows}
          />
        )}
      </div>
    </>
  );
}

export default App;

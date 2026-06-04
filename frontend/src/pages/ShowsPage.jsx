import { useEffect, useState } from "react";

export default function ShowsPage({ movieId, onSelectShow }) {
  const [shows, setShows] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/shows/movie/${movieId}`)
      .then((res) => res.json())
      .then((data) => setShows(data));
  }, [movieId]);

  return (
    <div>
      <h2>Available Shows</h2>

      {shows.map((show) => (
        <div
          className="card"
          key={show.show_id}
          onClick={() => onSelectShow(show.show_id)}
        >
          <h3>Screen {show.screen_number}</h3>
          <p>
            {new Date(show.start_time).toLocaleTimeString()} -{" "}
            {new Date(show.end_time).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config";

const EMPTY = { movie_id: "", screen_number: "", start_time: "" };

// Add `minutes` to a "YYYY-MM-DDTHH:MM" datetime-local string and return the
// same local format (no timezone shift). Returns "" if input is incomplete.
function addMinutesLocal(dtLocal, minutes) {
  if (!dtLocal || !minutes) return "";
  const d = new Date(dtLocal);
  if (isNaN(d)) return "";
  d.setMinutes(d.getMinutes() + Number(minutes));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function prettify(dtLocal) {
  if (!dtLocal) return "";
  const d = new Date(dtLocal);
  if (isNaN(d)) return "";
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AddShow() {
  const [form, setForm] = useState(EMPTY);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/movies`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMovies(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const selectedMovie = useMemo(
    () => movies.find((m) => m.movie_id === form.movie_id),
    [movies, form.movie_id]
  );

  // End time is derived, never entered by hand.
  const endTime = useMemo(
    () => addMinutesLocal(form.start_time, selectedMovie?.duration_minutes),
    [form.start_time, selectedMovie]
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMovie?.duration_minutes) {
      setMessage({ type: "error", text: "Selected movie has no duration set, so the end time can't be calculated." });
      return;
    }
    if (!endTime) {
      setMessage({ type: "error", text: "Please pick a valid start time." });
      return;
    }
    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/shows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movie_id: form.movie_id,
          screen_number: Number(form.screen_number),
          start_time: form.start_time,
          end_time: endTime,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Show #${data.show_id} created with 18 seats.` });
        setForm(EMPTY);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to create show" });
      }
    } catch {
      setMessage({ type: "error", text: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Add Show</h3>

      {message && (
        <div className={`msg ${message.type === "success" ? "msg-success" : "msg-error"}`} style={{ marginBottom: 16 }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Movie</label>
          <select name="movie_id" value={form.movie_id} onChange={handleChange}
            className="form-input" required>
            <option value="">— Select a movie —</option>
            {movies.map((m) => (
              <option key={m.movie_id} value={m.movie_id}>
                {m.title} ({m.language}{m.duration_minutes ? `, ${m.duration_minutes} min` : ""})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Screen Number</label>
          <input name="screen_number" type="number" min="1" value={form.screen_number}
            onChange={handleChange} className="form-input" placeholder="e.g. 1" required />
        </div>

        <div className="form-group">
          <label>Start Time</label>
          <input name="start_time" type="datetime-local" value={form.start_time}
            onChange={handleChange} className="form-input" required />
        </div>

        {/* End time is computed from the movie's runtime — shown read-only. */}
        <div className="end-time-preview">
          {endTime ? (
            <>
              <span className="end-time-label">Show ends at</span>
              <span className="end-time-value">{prettify(endTime)}</span>
              <span className="end-time-hint">(runtime {selectedMovie.duration_minutes} min)</span>
            </>
          ) : (
            <span className="end-time-hint">End time is calculated automatically once you pick a movie and start time.</span>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Creating…" : "Create Show"}
        </button>
      </form>
    </div>
  );
}

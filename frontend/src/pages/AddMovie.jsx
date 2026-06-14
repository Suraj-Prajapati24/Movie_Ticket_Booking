import { useState } from "react";
import { API_BASE } from "../config";
import Poster from "../components/Poster";

const EMPTY = {
  title: "",
  description: "",
  duration_minutes: "",
  language: "",
  poster_url: "",
};

export default function AddMovie() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/movies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          language: form.language,
          duration_minutes: Number(form.duration_minutes),
          poster_url: form.poster_url.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `"${data.title}" added successfully.`,
        });
        setForm(EMPTY);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to add movie",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Add Movie</h3>

      {message && (
        <div
          className={`msg ${message.type === "success" ? "msg-success" : "msg-error"}`}
          style={{ marginBottom: 16 }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. The Dark Knight"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            className="form-input"
            placeholder="Short plot summary"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              name="duration_minutes"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={form.duration_minutes}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. 120"
              required
            />
            <span className="field-hint">
              Whole minutes only (e.g. enter 150 for 2h 30m)
            </span>
          </div>
          <div className="form-group">
            <label>Language</label>
            <input
              name="language"
              value={form.language}
              onChange={handleChange}
              className="form-input"
              placeholder="English"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            Poster URL{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <input
            name="poster_url"
            value={form.poster_url}
            onChange={handleChange}
            className="form-input"
            placeholder="https://…  (leave blank for an auto-generated poster)"
          />
        </div>

        {form.title && (
          <div className="poster-preview-row">
            <Poster
              url={form.poster_url.trim()}
              title={form.title}
              className="poster-preview"
            />
            <span className="field-hint">
              Live preview — if no URL is given, a coloured placeholder is used
              until a real poster is uploaded.
            </span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading ? "Adding…" : "Add Movie"}
        </button>
      </form>
    </div>
  );
}

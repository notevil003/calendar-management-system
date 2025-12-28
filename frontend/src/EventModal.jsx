import { useState, useEffect } from "react";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function EventModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [recurrence, setRecurrence] = useState(null);
  const [reminderMinutes, setReminderMinutes] = useState(null);

  useEffect(() => {
    if (initial.id) {
      // Editing existing event
      setTitle(initial.title || "");
      setDate(
        typeof initial.date === "string"
          ? initial.date.split("T")[0]
          : initial.date || ""
      );
      
      // Format time from HH:MM:SS to HH:MM for input
      const formatTimeForInput = (timeStr) => {
        if (!timeStr) return "";
        return timeStr.substring(0, 5);
      };
      
      setStartTime(formatTimeForInput(initial.start_time || ""));
      setEndTime(formatTimeForInput(initial.end_time || ""));
      setTimezone(initial.timezone || "UTC");
      setRecurrence(initial.recurrence || null);
      setReminderMinutes(initial.reminder_minutes || null);
    } else {
      // New event - set defaults
      const today = new Date().toISOString().split("T")[0];
      setTitle("");
      setDate(today);
      setStartTime("09:00");
      setEndTime("10:00");
      setTimezone("UTC");
      setRecurrence(null);
      setReminderMinutes(null);
    }
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!date) {
      alert("Please select a date");
      return;
    }

    if (!startTime || !endTime) {
      alert("Please enter start and end times");
      return;
    }

    if (startTime >= endTime && startTime !== "00:00") {
      // Allow midnight-spanning events (00:00 end time)
      alert("End time must be after start time");
      return;
    }

    onSave({
      title: title.trim(),
      date,
      start_time: startTime,
      end_time: endTime,
      timezone,
      recurrence: recurrence || null,
      reminder_minutes: reminderMinutes || null,
    });
  };

  return (
    <div
      className="modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target.className === "modal") {
          onClose();
        }
      }}
    >
      <div
        className="modal-box"
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>
          {initial.id ? "Edit Event" : "Create Event"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                fontSize: "14px",
              }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={recurrence === "weekly"}
                onChange={(e) => setRecurrence(e.target.checked ? "weekly" : null)}
              />
              <span>Repeat weekly</span>
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Reminder (minutes before event)
            </label>
            <select
              value={reminderMinutes || ""}
              onChange={(e) => setReminderMinutes(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                fontSize: "14px",
              }}
            >
              <option value="">No reminder</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="1440">1 day</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ccc",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

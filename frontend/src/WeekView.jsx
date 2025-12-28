import { startOfWeek, addDays, isoDate } from "./utils/date";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeekView({ events, week, timezone, onPrev, onNext, onEdit, onDelete }) {
  const weekStart = startOfWeek(week);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    // Handle HH:MM:SS or HH:MM format
    return timeStr.substring(0, 5);
  };

  return (
    <>
      <div className="week-header" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        padding: "15px",
        marginBottom: "20px"
      }}>
        <button onClick={onPrev}>◀ Previous</button>
        <strong>
          {formatDateDisplay(days[0])} - {formatDateDisplay(days[6])}
        </strong>
        <button onClick={onNext}>Next ▶</button>
      </div>

      <div className="week-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "10px",
        padding: "0 10px"
      }}>
        {days.map((day, idx) => {
          // Use local date components to avoid timezone issues
          const year = day.getFullYear();
          const month = String(day.getMonth() + 1).padStart(2, '0');
          const dayNum = String(day.getDate()).padStart(2, '0');
          const dayStr = `${year}-${month}-${dayNum}`;
          
          // Filter events for this day
          const dayEvents = events.filter((event) => {
            if (!event || !event.date) {
              return false;
            }
            
            // Normalize event date to YYYY-MM-DD string
            let eventDateStr = "";
            if (typeof event.date === "string") {
              // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SS" formats
              eventDateStr = event.date.split("T")[0].trim();
            } else if (event.date instanceof Date) {
              // If it's a Date object, use local date components
              const eventYear = event.date.getFullYear();
              const eventMonth = String(event.date.getMonth() + 1).padStart(2, '0');
              const eventDay = String(event.date.getDate()).padStart(2, '0');
              eventDateStr = `${eventYear}-${eventMonth}-${eventDay}`;
            } else {
              // Try to convert to string
              eventDateStr = String(event.date).split("T")[0].trim();
            }
            
            // Compare dates (both should be YYYY-MM-DD format)
            const matches = eventDateStr === dayStr;
            return matches;
          });

          return (
            <div
              key={day.toISOString()}
              className="day-column"
              style={{
                border: "1px solid #ddd",
                borderRadius: "5px",
                padding: "10px",
                minHeight: "200px",
                backgroundColor: "#f9f9f9"
              }}
            >
              <div className="day-title" style={{
                fontWeight: "bold",
                marginBottom: "10px",
                paddingBottom: "5px",
                borderBottom: "1px solid #ddd"
              }}>
                <div>{DAY_NAMES[idx]}</div>
                <div style={{ fontSize: "0.9em", fontWeight: "normal", opacity: 0.7 }}>
                  {formatDateDisplay(day)}
                </div>
              </div>

              {dayEvents.length === 0 ? (
                <div style={{ padding: "10px", color: "#999", fontSize: "0.9em" }}>
                  No events
                </div>
              ) : (
                dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="event-card"
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      padding: "8px",
                      marginBottom: "8px",
                      cursor: "pointer"
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", marginBottom: "4px" }}>
                        {event.title}
                      </strong>
                      <div style={{ fontSize: "0.85em", color: "#666", marginBottom: "4px" }}>
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                      {event.recurrence === "weekly" && (
                        <span style={{ fontSize: "0.75em", fontStyle: "italic", color: "#666" }}>
                          🔁 Weekly
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      display: "flex", 
                      gap: "5px", 
                      marginTop: "8px",
                      justifyContent: "flex-end"
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(event);
                        }}
                        style={{ padding: "2px 6px", fontSize: "0.8em" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(event.id);
                        }}
                        style={{ padding: "2px 6px", fontSize: "0.8em" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function EventCard({ event, onEdit, onDelete }) {
  return (
    <div className="event">
      <strong>{event.title}</strong>
      <div>{event.start_time} – {event.end_time}</div>

      <div className="actions">
        <button onClick={() => onEdit(event)}>Edit</button>
        <button onClick={() => onDelete(event.id)}>Delete</button>
      </div>
    </div>
  );
}

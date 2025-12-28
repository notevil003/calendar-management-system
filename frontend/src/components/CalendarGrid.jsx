import EventCard from "./EventCard";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarGrid({ events, onCreate, onEdit, onDelete }) {
  return (
    <div className="calendar">
      <button onClick={onCreate}>＋ Create</button>

      <div className="grid">
        {DAYS.map((day, index) => (
          <div key={day} className="day">
            <h4>{day}</h4>

            {events
              .filter(e => (new Date(e.date).getDay() + 6) % 7 === index)
              .map(e => (
                <EventCard
                  key={e.id}
                  event={e}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

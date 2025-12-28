import { useEffect, useState } from "react";
import WeekView from "./WeekView";
import EventModal from "./EventModal";
import { getEvents, createEvent, updateEvent, deleteEvent } from "./api";
import { startOfWeek, isoDate, getWeekForDate } from "./utils/date";
import { scheduleAllReminders, cancelReminder } from "./utils/reminders";

export default function App() {
  const [events, setEvents] = useState([]);
  const [week, setWeek] = useState(0);
  const [modal, setModal] = useState(null);
  const [timezone, setTimezone] = useState("UTC");

  const loadEvents = async () => {
    try {
      const weekStart = startOfWeek(week);
      const weekStartStr = isoDate(weekStart);
      const loadedEvents = await getEvents(weekStartStr, timezone);
      
      // Ensure all events have properly formatted dates (YYYY-MM-DD)
      const normalizedEvents = (loadedEvents || []).map(event => {
        let normalizedDate = event.date;
        if (typeof normalizedDate === "string") {
          normalizedDate = normalizedDate.split("T")[0].trim();
        }
        return {
          ...event,
          date: normalizedDate
        };
      });
      
      console.log("Loaded events:", normalizedEvents);
      console.log("Week start:", weekStartStr);
      console.log("Number of events:", normalizedEvents.length);
      
      setEvents(normalizedEvents);
      
      // Schedule reminders for all events
      scheduleAllReminders(normalizedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      alert(error.message);
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [week, timezone]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleSaveEvent = async (data) => {
    try {
      // Format time to HH:MM:SS
      const formatTime = (timeStr) => {
        if (!timeStr) return "00:00:00";
        if (timeStr.length === 5) return timeStr + ":00"; // HH:MM -> HH:MM:SS
        return timeStr;
      };

      const eventData = {
        title: data.title || "",
        date: data.date,
        start_time: formatTime(data.start_time),
        end_time: formatTime(data.end_time),
        timezone: data.timezone || "UTC",
        recurrence: data.recurrence || null,
        reminder_minutes: data.reminder_minutes || null,
      };

      let savedEvent;
      if (modal.id) {
        savedEvent = await updateEvent(modal.id, eventData);
      } else {
        savedEvent = await createEvent(eventData);
        console.log("Created event:", savedEvent);
      }

      setModal(null);
      
      // If creating a new event, navigate to the week containing it
      if (!modal.id && savedEvent && savedEvent.date) {
        console.log("Event date:", savedEvent.date, "Type:", typeof savedEvent.date);
        const eventWeekOffset = getWeekForDate(savedEvent.date);
        console.log("Calculated week offset:", eventWeekOffset, "Current week:", week);
        
        // Navigate to that week if it's different from current week
        if (eventWeekOffset !== week) {
          console.log("Navigating to week:", eventWeekOffset);
          setWeek(eventWeekOffset);
          // useEffect will trigger loadEvents when week changes
          // But we also manually call it to ensure it loads with the new week
          const newWeekStart = startOfWeek(eventWeekOffset);
          const newWeekStartStr = isoDate(newWeekStart);
          console.log("Loading events for new week:", newWeekStartStr);
          const newEvents = await getEvents(newWeekStartStr, timezone);
          console.log("Loaded events for new week:", newEvents);
          setEvents(newEvents || []);
          return;
        }
      }
      
      // Reload events for current week
      await loadEvents();
    } catch (error) {
      alert(error.message || "Failed to save event");
    }
  };

  const handleDeleteEvent = async (id) => {
    const event = events.find(e => e.id === id);
    const isRecurringInstance = id.includes("-") && event?.recurrence === "weekly";
    const message = isRecurringInstance 
      ? "Are you sure you want to delete this occurrence of the recurring event?"
      : "Are you sure you want to delete this event?";
    
    if (!confirm(message)) {
      return;
    }
    try {
      // Cancel reminder if exists
      cancelReminder(id);
      
      await deleteEvent(id);
      await loadEvents();
    } catch (error) {
      alert(error.message || "Failed to delete event");
    }
  };

  return (
    <div className="app">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "10px" }}>
        <button className="primary" onClick={() => setModal({})}>
          + Create Event
        </button>
        <select 
          value={timezone} 
          onChange={(e) => setTimezone(e.target.value)}
          style={{ padding: "5px 10px" }}
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>

      <WeekView
        events={events}
        week={week}
        timezone={timezone}
        onPrev={() => setWeek((w) => w - 1)}
        onNext={() => setWeek((w) => w + 1)}
        onEdit={(event) => setModal(event)}
        onDelete={handleDeleteEvent}
      />

      {modal !== null && (
        <EventModal
          initial={modal}
          onSave={handleSaveEvent}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

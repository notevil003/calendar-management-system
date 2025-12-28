// Reminder/Notification system for calendar events

let reminderTimeouts = new Map();

export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function scheduleReminder(event) {
  if (!event.reminder_minutes || event.reminder_minutes <= 0) {
    return;
  }

  // Clear existing reminder if any
  if (reminderTimeouts.has(event.id)) {
    clearTimeout(reminderTimeouts.get(event.id));
  }

  // Parse event date and time
  const eventDate = new Date(event.date + "T" + event.start_time);
  
  // Calculate reminder time (event time - reminder_minutes)
  const reminderTime = new Date(eventDate.getTime() - event.reminder_minutes * 60 * 1000);
  const now = new Date();
  
  // Only schedule if reminder is in the future
  if (reminderTime <= now) {
    return;
  }

  const delay = reminderTime.getTime() - now.getTime();

  const timeoutId = setTimeout(() => {
    showNotification(event);
    reminderTimeouts.delete(event.id);
  }, delay);

  reminderTimeouts.set(event.id, timeoutId);
}

export function cancelReminder(eventId) {
  if (reminderTimeouts.has(eventId)) {
    clearTimeout(reminderTimeouts.get(eventId));
    reminderTimeouts.delete(eventId);
  }
}

export function scheduleAllReminders(events) {
  // Clear all existing reminders
  reminderTimeouts.forEach((timeout) => clearTimeout(timeout));
  reminderTimeouts.clear();

  // Request permission if needed
  requestNotificationPermission();

  // Schedule reminders for all events
  events.forEach((event) => {
    scheduleReminder(event);
  });
}

function showNotification(event) {
  if ("Notification" in window && Notification.permission === "granted") {
    const reminderText = `in ${event.reminder_minutes} minutes`;
    
    new Notification(event.title, {
      body: `Event starts ${reminderText}`,
      icon: "/favicon.ico",
      tag: event.id,
      requireInteraction: false,
    });
  }
}

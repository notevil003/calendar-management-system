## Core Example Workflows

### 1. Create an Event

```bash
curl -X POST http://localhost:8000/events \
-H "Content-Type: application/json" \
-d '{
  "title": "Team Meeting",
  "date": "2025-01-15",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "timezone": "UTC"
}'
````

**Result:** Event is created successfully.

---

### 2. Conflict Detection

```bash
curl -X POST http://localhost:8000/events \
-H "Content-Type: application/json" \
-d '{
  "title": "Conflicting Event",
  "date": "2025-01-15",
  "start_time": "10:30:00",
  "end_time": "11:30:00",
  "timezone": "UTC"
}'
```

**Result:**
`409 Conflict` – overlapping events are rejected.

---

### 3. Weekly View

```bash
curl "http://localhost:8000/events?week_start=2025-01-13&timezone=UTC"
```

**Result:**
Returns all events (including recurring instances) for the selected week.

---

### 4. Weekly Recurring Event

```bash
curl -X POST http://localhost:8000/events \
-H "Content-Type: application/json" \
-d '{
  "title": "Weekly Standup",
  "date": "2025-01-15",
  "start_time": "09:00:00",
  "end_time": "09:30:00",
  "timezone": "UTC",
  "recurrence": "weekly"
}'
```

**Result:**
Recurring event automatically appears in future weeks.

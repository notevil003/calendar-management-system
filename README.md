# Calendar Management System

This project is a minimal, production-ready calendar management system built to demonstrate **correctness, clean system design, and proper timezone handling**. The focus is on backend logic, conflict detection, and time correctness rather than UI polish.

## Demo Video 
https://drive.google.com/file/d/1ghKkgt1xWVLb7eJjVjeTQPMoqMymTl6y/view?usp=drive_link


## What I Built

I built a single-user calendar system that supports:

* Creating, updating, and deleting calendar events
* Preventing overlapping or conflicting events
* Viewing events in a weekly calendar view
* Full timezone-aware event handling (stored in UTC)
* Weekly recurring events (future instances only)
* Deleting individual instances of recurring events
* Browser-based reminder notifications
* Persistent storage using SQLite

## Tech Stack

* **Backend**: FastAPI (Python 3.9+)
* **Frontend**: React (Vite)
* **Database**: SQLite
* **Timezone Handling**: Python `zoneinfo`
* **Notifications**: Browser Notification API

## Key Design Decisions

### 1. UTC-Based Time Handling

All events are stored internally in **UTC**.
When creating or viewing events, times are converted to/from the user’s timezone.

This avoids:

* Timezone conflicts
* DST-related bugs
* Server-location dependency

### 2. Conflict Detection

Before creating or updating an event, I check for overlap using UTC timestamps:

```
start1 < end2 AND end1 > start2
```

This correctly handles:

* Partial overlaps
* Full overlaps
* Midnight-spanning events
* Cross-timezone conflicts

### 3. Weekly View

The weekly view:

* Shows events from Monday to Sunday
* Expands recurring events only within the selected week
* Does not generate past recurring instances
* Supports week-by-week navigation

### 4. Recurring Events

Recurring events are stored as a **single base event** with a `weekly` recurrence flag.
Instances are generated dynamically per request.

* No database bloat
* Easy to update or delete the whole series
* Individual occurrences can be deleted using exceptions

## Data Model (Simplified)

**Event**

* id (UUID)
* title
* date
* start_time
* end_time
* timezone
* recurrence (weekly or null)
* reminder_minutes
* created_at (UTC)
* updated_at (UTC)

**Recurring Exception**

* base_event_id
* exception_date

## API Overview

* `POST /events` – Create event
* `GET /events` – List events (optional weekly filter)
* `GET /events/{id}` – Get single event
* `PUT /events/{id}` – Update event
* `DELETE /events/{id}` – Delete event or recurring instance
* `GET /health` – Health check

Conflicting events return **409 Conflict**.

## Setup (Quick)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

## Assumptions

* Single-user calendar
* Weekly recurrence only
* No overlapping events allowed
* Events must have positive duration
* Reminders work only while browser is open

## Limitations

* No multi-day UI rendering
* No authentication
* No background reminders
* Recurring events expanded only per requested week
* Performance not optimized for very large datasets

## What I Would Improve Next

* Database indexing for scalability
* Better error messages for conflicts
* Support for more recurrence types
* Persistent reminders using service workers
* Multi-user and shared calendars

## Summary

This project demonstrates my ability to:

* Design a clean backend system
* Handle timezones and DST correctly
* Implement conflict-free scheduling logic
* Structure a production-ready API
* Balance correctness over unnecessary features


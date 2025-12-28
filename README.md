# Calendar Management System

A minimal, production-ready calendar management system focusing on correctness, clean system design, and proper timezone handling. This system demonstrates event creation, conflict detection, weekly views, recurring events, and reminder notifications.

## Features

- ✅ **Event Management**: Create, update, and delete calendar events
- ✅ **Conflict Detection**: Automatically prevents overlapping events across timezones
- ✅ **Weekly View**: Navigate and view events by week with forward/backward navigation
- ✅ **Timezone Support**: Full timezone-aware event handling with UTC storage
- ✅ **Recurring Events**: Support for weekly recurring events (only future instances)
- ✅ **Deletable Recurring Instances**: Delete individual occurrences of recurring events
- ✅ **Event Reminders**: Browser notifications for event reminders
- ✅ **Persistence**: SQLite database for data persistence

## Architecture Overview

### Technology Stack

- **Backend**: FastAPI (Python 3.9+) with SQLite database
- **Frontend**: React with Vite
- **Timezone Handling**: Python's `zoneinfo` library
- **Database**: SQLite for lightweight persistence
- **Notifications**: Browser Notification API

### Design Decisions

#### 1. UTC Storage Strategy

All events are stored in UTC internally, but can be created and viewed in any timezone. This ensures:
- Correct conflict detection across timezones
- Proper handling of daylight saving time (DST) transitions
- Consistent behavior regardless of server location

**Implementation**: When creating or updating events, times are converted to UTC using the provided timezone. When querying, events can be returned in any requested timezone.

#### 2. Conflict Detection Algorithm

Conflicts are detected by:
1. Converting both events to UTC timestamps
2. Checking if time ranges overlap: `start1 < end2 AND end1 > start2`
3. Handling edge cases like midnight-spanning events

**Key Insight**: Events on different dates can still conflict if they overlap in UTC time (e.g., an event from 23:00-01:00 on Day 1 overlaps with 00:00-02:00 on Day 2).

#### 3. Weekly View Implementation

The weekly view:
- Filters events for the requested week (Monday to Sunday)
- Dynamically expands recurring events within the week window
- Only shows recurring instances from the original event date onwards (no past instances)
- Supports timezone-aware date calculations
- Allows navigation forward/backward by week

#### 4. Recurring Events

Weekly recurring events are stored as single records with a `recurrence` field. Instances are generated dynamically:
- Only expanded within the requested time window
- Only created from the original event date onwards (no past instances)
- Individual instances can be deleted (stored as exceptions)
- No database bloat from pre-generating instances
- Easier to update or delete the entire series

#### 5. Data Model

**Event Schema**:
```python
{
  "id": str (UUID),
  "title": str,
  "date": date (YYYY-MM-DD),
  "start_time": time (HH:MM:SS),
  "end_time": time (HH:MM:SS),
  "timezone": str (IANA timezone name),
  "recurrence": str | null ("weekly" or null),
  "reminder_minutes": int | null,
  "created_at": datetime (UTC),
  "updated_at": datetime (UTC)
}
```

**Recurring Exceptions Schema**:
```python
{
  "id": str (base_event_id-date),
  "base_event_id": str,
  "exception_date": date (YYYY-MM-DD),
  "created_at": datetime (UTC)
}
```

## Setup Instructions

### Prerequisites

- **Python 3.9 or higher** (for `zoneinfo` support)
- **Node.js 16+** and npm
- **Git** (optional, for cloning)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- **API documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Health check**: `http://localhost:8000/health`

**Note**: The database file (`calendar.db`) will be created automatically on first run.

### Frontend Setup

1. Open a **new terminal** and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in the terminal)

### Quick Start (All in One)

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

## API Documentation

### Endpoints

#### `GET /events`
List all events or filter by week.

**Query Parameters**:
- `week_start` (optional): Start date of week in `YYYY-MM-DD` format
- `timezone` (optional): Timezone for weekly view (default: UTC)

**Example**:
```bash
GET /events?week_start=2025-01-15&timezone=America/New_York
```

**Response**: Array of event objects

#### `POST /events`
Create a new event.

**Request Body**:
```json
{
  "title": "Team Standup",
  "date": "2025-01-15",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "timezone": "America/New_York",
  "recurrence": "weekly",
  "reminder_minutes": 15
}
```

**Response**: Created event with `id`, `created_at`, `updated_at`

**Status Codes**:
- `201 Created`: Event created successfully
- `409 Conflict`: Event conflicts with existing event
- `422 Unprocessable Entity`: Validation error

#### `GET /events/{event_id}`
Get a specific event by ID.

**Response**: Event object

#### `PUT /events/{event_id}`
Update an existing event (same body format as POST).

**Status Codes**:
- `200 OK`: Event updated successfully
- `404 Not Found`: Event ID not found
- `409 Conflict`: Update causes conflict

#### `DELETE /events/{event_id}`
Delete an event or a recurring event instance.

**Status Codes**:
- `204 No Content`: Event deleted successfully
- `404 Not Found`: Event ID not found

**Note**: For recurring event instances (IDs like `{base_id}-{date}`), deleting them stores an exception so they won't appear in future views.

#### `GET /health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "total_events": 5,
  "timestamp": "2025-01-15T10:00:00"
}
```

### Error Responses

- `409 Conflict`: Event conflicts with existing event
- `404 Not Found`: Event ID not found
- `422 Unprocessable Entity`: Validation error (invalid times, missing fields, etc.)
- `400 Bad Request`: Invalid query parameters

## Example Workflows

### Creating a Non-Conflicting Event

```bash
curl -X POST "http://localhost:8000/events" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "date": "2025-01-15",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "timezone": "America/New_York"
  }'
```

### Creating a Recurring Weekly Event

```bash
curl -X POST "http://localhost:8000/events" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly Standup",
    "date": "2025-01-15",
    "start_time": "09:00:00",
    "end_time": "09:30:00",
    "timezone": "UTC",
    "recurrence": "weekly",
    "reminder_minutes": 15
  }'
```

### Viewing Week's Events

```bash
curl "http://localhost:8000/events?week_start=2025-01-15&timezone=America/New_York"
```

### Testing Conflict Detection

```bash
# Create first event
curl -X POST "http://localhost:8000/events" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting 1",
    "date": "2025-01-15",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "timezone": "UTC"
  }'

# Try to create conflicting event (should return 409)
curl -X POST "http://localhost:8000/events" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting 2",
    "date": "2025-01-15",
    "start_time": "10:30:00",
    "end_time": "11:30:00",
    "timezone": "UTC"
  }'
```

### Deleting a Recurring Event Instance

```bash
# Delete a specific occurrence (ID format: base_id-YYYY-MM-DD)
curl -X DELETE "http://localhost:8000/events/{base_id}-2025-01-22"
```

## Key Assumptions

1. **Single User System**: The current implementation assumes a single user calendar. Multi-user support would require calendar/user associations.

2. **Conflict Policy**: Overlapping events are strictly prohibited. No "busy" vs "free" status or partial conflicts allowed.

3. **Recurrence**: Only weekly recurrence is supported. Monthly, yearly, or custom patterns are not implemented.

4. **Time Granularity**: Events are stored with second precision, but UI typically works with minute precision.

5. **Event Duration**: Events must have a positive duration (end time after start time). Midnight-spanning events are handled by adding a day to the end time.

6. **Recurring Events**: Only create instances from the original event date onwards (no past instances).

## Known Limitations

1. **Multi-Day Events**: While conflict detection handles events spanning midnight, the UI doesn't fully support displaying multi-day events in the weekly view.

2. **Recurrence Expansion**: Recurring events are only expanded for the requested week. Viewing a different week requires a new API call.

3. **Timezone Validation**: The system doesn't validate timezone strings beyond Python's `ZoneInfo` library. Invalid timezones result in errors rather than graceful handling.

4. **Event Updates**: Updating a recurring event doesn't affect past instances, only the base event and future expansions.

5. **Performance**: The current implementation loads all events for conflict checking. For large calendars, this could be optimized with database queries and indexing.

6. **Reminders**: Reminders only work while the browser tab is open. They don't persist across browser sessions.

7. **DST Edge Cases**: While timezone conversions handle DST correctly, the UI doesn't explicitly warn about ambiguous or invalid times during DST transitions.

## What Would I Improve With More Time?

### Short-term Improvements

1. **Database Indexing**: Add indexes on `date`, `start_time`, and timezone-related fields for faster queries.

2. **API Pagination**: For calendars with many events, add pagination to list endpoints.

3. **Better Error Messages**: More descriptive conflict messages including which event conflicts and the overlap duration.

4. **Input Validation**: Enhanced validation with better error messages for invalid time formats, timezone names, etc.

5. **Event Search**: Add search functionality by title, date range, or keyword.

6. **Persistent Reminders**: Use service workers or background tasks for reminders that work even when the browser is closed.

### Medium-term Enhancements

1. **Multi-Calendar Support**: Allow users to have multiple calendars (work, personal, etc.) with optional calendar-based conflict isolation.

2. **Event Metadata**: Add description, location, attendees, and tags to events.

3. **Advanced Recurrence**: Support monthly, yearly, and custom recurrence patterns (e.g., "every 2nd Tuesday").

4. **Export/Import**: Support iCal, Google Calendar, or Outlook export/import formats.

5. **Event Templates**: Pre-defined event templates for common meeting types.

### Long-term Considerations

1. **Multi-User System**: Add authentication, user management, and shared calendars.

2. **Real-time Updates**: WebSocket support for live calendar updates across clients.

3. **Conflict Resolution UI**: Allow users to see conflicts and choose resolution strategies (reschedule, override, etc.).

4. **Calendar Analytics**: Statistics on event frequency, busy times, etc.

5. **Mobile App**: Native mobile app using the same backend API.

6. **Email Reminders**: Send email notifications in addition to browser notifications.

## Testing

Run the backend tests:
```bash
cd backend
pytest test_main.py -v
```

The test suite covers:
- Event CRUD operations
- Conflict detection (exact, partial, containing overlaps)
- Validation (time formats, timezones, required fields)
- Weekly view functionality
- Edge cases (midnight-spanning events, DST transitions)

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI application and routes
│   ├── schemas.py        # Pydantic models for events
│   ├── test_main.py      # Test suite
│   ├── requirements.txt  # Python dependencies
│   ├── calendar.db       # SQLite database (created on first run)
│   └── example_requests.sh  # Example API requests
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   ├── WeekView.jsx  # Weekly calendar view
│   │   ├── EventModal.jsx # Event create/edit form
│   │   ├── api.js        # API client functions
│   │   └── utils/
│   │       ├── date.js   # Date utility functions
│   │       └── reminders.js # Reminder/notification system
│   ├── package.json
│   └── vite.config.js
├── README.md             # This file
├── EXPERIENCE.md         # Development experience write-up
├── QUICK_START.md        # Quick setup guide
└── VIDEO_SCRIPT.md       # 10-minute demo video script
```

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Change port
uvicorn main:app --reload --port 8001
```

**Database errors:**
- Delete `calendar.db` and restart the server to recreate the database
- Make sure you have write permissions in the backend directory

**Import errors:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

### Frontend Issues

**Port 5173 already in use:**
- Vite will automatically use the next available port
- Check the terminal for the actual port number

**CORS errors:**
- Make sure backend is running on port 8000
- Check that CORS middleware is enabled in `backend/main.py`

**Module not found:**
- Delete `node_modules` and run `npm install` again
- Make sure you're in the `frontend` directory

### Notification Issues

**Notifications not working:**
- Check browser notification permissions (Settings > Site Settings > Notifications)
- Some browsers require HTTPS for notifications (localhost is usually allowed)
- Make sure you've granted permission when prompted

## License

This project is provided as-is for evaluation purposes.

## Contact

For questions or issues, please refer to the code comments or create an issue in the repository.

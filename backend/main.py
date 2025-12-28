from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from schemas import Event, EventCreate
from datetime import datetime, timedelta, date, time
from zoneinfo import ZoneInfo
from typing import Optional
import uuid
import sqlite3
import re
from pathlib import Path

app = FastAPI(title="Calendar Management System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = Path("calendar.db")

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            timezone TEXT NOT NULL DEFAULT 'UTC',
            recurrence TEXT,
            reminder_minutes INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    # Table to store deleted recurring instances
    conn.execute("""
        CREATE TABLE IF NOT EXISTS recurring_exceptions (
            id TEXT PRIMARY KEY,
            base_event_id TEXT NOT NULL,
            exception_date TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

def to_utc_datetime(event_date: str, event_time: str, tz: str) -> datetime:
    """Convert event date/time in given timezone to UTC datetime"""
    dt = datetime.strptime(f"{event_date} {event_time}", "%Y-%m-%d %H:%M:%S")
    tz_info = ZoneInfo(tz)
    dt_tz = dt.replace(tzinfo=tz_info)
    return dt_tz.astimezone(ZoneInfo("UTC"))

def events_overlap(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
    """Check if two time ranges overlap"""
    return start1 < end2 and end1 > start2

def get_all_events_from_db() -> list[dict]:
    """Get all events from database as dictionaries"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM events ORDER BY date, start_time").fetchall()
    conn.close()
    return [dict(row) for row in rows]

def db_row_to_event(row: dict) -> Event:
    """Convert database row to Event object"""
    return Event(
        id=row["id"],
        title=row["title"],
        date=date.fromisoformat(row["date"]),
        start_time=time.fromisoformat(row["start_time"]),
        end_time=time.fromisoformat(row["end_time"]),
        timezone=row["timezone"],
        recurrence=row.get("recurrence"),
        reminder_minutes=row.get("reminder_minutes"),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )

def check_conflicts(new_event: EventCreate, exclude_id: Optional[str] = None) -> Optional[str]:
    """Check if new event conflicts with existing events. Returns conflicting event title or None"""
    new_start_utc = to_utc_datetime(
        new_event.date.isoformat(),
        new_event.start_time.strftime("%H:%M:%S"),
        new_event.timezone
    )
    new_end_utc = to_utc_datetime(
        new_event.date.isoformat(),
        new_event.end_time.strftime("%H:%M:%S"),
        new_event.timezone
    )
    
    # Handle midnight-spanning events
    if new_end_utc <= new_start_utc:
        new_end_utc += timedelta(days=1)
    
    existing_events = get_all_events_from_db()
    for existing in existing_events:
        if exclude_id and existing["id"] == exclude_id:
            continue
            
        existing_start_utc = to_utc_datetime(
            existing["date"],
            existing["start_time"],
            existing["timezone"]
        )
        existing_end_utc = to_utc_datetime(
            existing["date"],
            existing["end_time"],
            existing["timezone"]
        )
        
        if existing_end_utc <= existing_start_utc:
            existing_end_utc += timedelta(days=1)
        
        if events_overlap(new_start_utc, new_end_utc, existing_start_utc, existing_end_utc):
            return existing["title"]
    
    return None

@app.get("/events")
def list_events(
    week_start: Optional[str] = Query(None, description="Start of week (YYYY-MM-DD)"),
    timezone: str = Query("UTC", description="Timezone for weekly view")
):
    """List all events, optionally filtered by week"""
    all_events = [db_row_to_event(row) for row in get_all_events_from_db()]
    
    def serialize_event(event):
        """Convert Event object to dict with string dates"""
        return {
            "id": event.id,
            "title": event.title,
            "date": event.date.isoformat(),
            "start_time": event.start_time.strftime("%H:%M:%S"),
            "end_time": event.end_time.strftime("%H:%M:%S"),
            "timezone": event.timezone,
            "recurrence": event.recurrence,
            "reminder_minutes": event.reminder_minutes,
            "created_at": event.created_at.isoformat(),
            "updated_at": event.updated_at.isoformat(),
        }
    
    if week_start:
        try:
            week_date = date.fromisoformat(week_start)
            # Find Monday of that week
            days_since_monday = week_date.weekday()
            monday = week_date - timedelta(days=days_since_monday)
            sunday = monday + timedelta(days=6)
            
            print(f"Filtering events for week: {monday} to {sunday}")
            print(f"Total events in DB: {len(all_events)}")
            
            # Filter events in this week
            week_events = []
            for event in all_events:
                # Check if event date is within the week range
                if monday <= event.date <= sunday:
                    week_events.append(serialize_event(event))
                # Expand recurring weekly events (only from original date onwards)
                elif event.recurrence == "weekly":
                    # Only expand if the week contains dates >= original event date
                    if sunday >= event.date:
                        # Check for deleted instances
                        conn = sqlite3.connect(DB_PATH)
                        conn.row_factory = sqlite3.Row
                        try:
                            exceptions = conn.execute(
                                "SELECT exception_date FROM recurring_exceptions WHERE base_event_id = ?",
                                (event.id,)
                            ).fetchall()
                            exception_dates = {row["exception_date"] for row in exceptions}
                        except sqlite3.OperationalError:
                            # Table doesn't exist yet, create it and retry
                            conn.execute("""
                                CREATE TABLE IF NOT EXISTS recurring_exceptions (
                                    id TEXT PRIMARY KEY,
                                    base_event_id TEXT NOT NULL,
                                    exception_date TEXT NOT NULL,
                                    created_at TEXT NOT NULL
                                )
                            """)
                            conn.commit()
                            exception_dates = set()
                        finally:
                            conn.close()
                        
                        # Start from the later of: monday of this week, or original event date
                        start_date = max(monday, event.date)
                        current_date = start_date
                        while current_date <= sunday:
                            # Only create instances on the same weekday as original event
                            # and skip deleted instances
                            if (current_date.weekday() == event.date.weekday() and 
                                current_date >= event.date and
                                current_date.isoformat() not in exception_dates):
                                recurring = Event(
                                    id=f"{event.id}-{current_date.isoformat()}",
                                    title=event.title,
                                    date=current_date,
                                    start_time=event.start_time,
                                    end_time=event.end_time,
                                    timezone=event.timezone,
                                    recurrence=event.recurrence,
                                    reminder_minutes=event.reminder_minutes,
                                    created_at=event.created_at,
                                    updated_at=event.updated_at,
                                )
                                week_events.append(serialize_event(recurring))
                            current_date += timedelta(days=1)
            
            # Sort by date and time
            week_events.sort(key=lambda e: (e["date"], e["start_time"]))
            return week_events
        except ValueError:
            raise HTTPException(400, "Invalid week_start format. Use YYYY-MM-DD")
    
    # Return all events with serialized dates
    return [serialize_event(event) for event in all_events]

@app.post("/events", status_code=201, response_model=Event)
def create_event(event_data: EventCreate):
    """Create a new event"""
    # Validate times
    if event_data.end_time <= event_data.start_time:
        # Allow midnight-spanning events
        if event_data.end_time < event_data.start_time:
            pass  # OK - event spans midnight
        else:
            raise HTTPException(422, "End time must be after start time")
    
    # Check conflicts
    conflict_title = check_conflicts(event_data)
    if conflict_title:
        raise HTTPException(409, f"Event conflicts with '{conflict_title}'")
    
    # Create event
    now = datetime.utcnow()
    event = Event(
        id=str(uuid.uuid4()),
        created_at=now,
        updated_at=now,
        **event_data.dict()
    )
    
    # Save to database
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """INSERT INTO events (id, title, date, start_time, end_time, timezone, recurrence, reminder_minutes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            event.id,
            event.title,
            event.date.isoformat(),
            event.start_time.strftime("%H:%M:%S"),
            event.end_time.strftime("%H:%M:%S"),
            event.timezone,
            event.recurrence,
            event.reminder_minutes,
            event.created_at.isoformat(),
            event.updated_at.isoformat(),
        )
    )
    conn.commit()
    conn.close()
    
    # Return event with properly serialized dates
    return {
        "id": event.id,
        "title": event.title,
        "date": event.date.isoformat(),
        "start_time": event.start_time.strftime("%H:%M:%S"),
        "end_time": event.end_time.strftime("%H:%M:%S"),
        "timezone": event.timezone,
        "recurrence": event.recurrence,
        "reminder_minutes": event.reminder_minutes,
        "created_at": event.created_at.isoformat(),
        "updated_at": event.updated_at.isoformat(),
    }

@app.get("/events/{event_id}")
def get_event(event_id: str):
    """Get a specific event"""
    events = get_all_events_from_db()
    for row in events:
        if row["id"] == event_id:
            event = db_row_to_event(row)
            return {
                "id": event.id,
                "title": event.title,
                "date": event.date.isoformat(),
                "start_time": event.start_time.strftime("%H:%M:%S"),
                "end_time": event.end_time.strftime("%H:%M:%S"),
                "timezone": event.timezone,
                "recurrence": event.recurrence,
                "reminder_minutes": event.reminder_minutes,
                "created_at": event.created_at.isoformat(),
                "updated_at": event.updated_at.isoformat(),
            }
    raise HTTPException(404, "Event not found")

@app.put("/events/{event_id}")
def update_event(event_id: str, event_data: EventCreate):
    """Update an event"""
    # Check event exists
    events = get_all_events_from_db()
    found = False
    for row in events:
        if row["id"] == event_id:
            found = True
            break
    
    if not found:
        raise HTTPException(404, "Event not found")
    
    # Validate times
    if event_data.end_time <= event_data.start_time:
        if event_data.end_time < event_data.start_time:
            pass  # OK - event spans midnight
        else:
            raise HTTPException(422, "End time must be after start time")
    
    # Check conflicts (excluding this event)
    conflict_title = check_conflicts(event_data, exclude_id=event_id)
    if conflict_title:
        raise HTTPException(409, f"Update conflicts with '{conflict_title}'")
    
    # Update event
    now = datetime.utcnow()
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """UPDATE events 
           SET title = ?, date = ?, start_time = ?, end_time = ?, timezone = ?, recurrence = ?, reminder_minutes = ?, updated_at = ?
           WHERE id = ?""",
        (
            event_data.title,
            event_data.date.isoformat(),
            event_data.start_time.strftime("%H:%M:%S"),
            event_data.end_time.strftime("%H:%M:%S"),
            event_data.timezone,
            event_data.recurrence,
            event_data.reminder_minutes,
            now.isoformat(),
            event_id,
        )
    )
    conn.commit()
    conn.close()
    
    # Return updated event with serialized dates
    events = get_all_events_from_db()
    for row in events:
        if row["id"] == event_id:
            event = db_row_to_event(row)
            return {
                "id": event.id,
                "title": event.title,
                "date": event.date.isoformat(),
                "start_time": event.start_time.strftime("%H:%M:%S"),
                "end_time": event.end_time.strftime("%H:%M:%S"),
                "timezone": event.timezone,
                "recurrence": event.recurrence,
                "reminder_minutes": event.reminder_minutes,
                "created_at": event.created_at.isoformat(),
                "updated_at": event.updated_at.isoformat(),
            }

@app.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: str):
    """Delete an event or a recurring event instance"""
    # Check if this is a recurring instance (format: {base_id}-{date})
    # Recurring instances have IDs like: "uuid-2024-12-29"
    if "-" in event_id:
        # Try to parse as recurring instance
        # Find the last occurrence of date pattern (YYYY-MM-DD)
        date_pattern = r'-\d{4}-\d{2}-\d{2}$'
        if re.search(date_pattern, event_id):
            # Extract base_id and exception_date
            match = re.search(date_pattern, event_id)
            base_id = event_id[:match.start()]
            exception_date = event_id[match.start() + 1:]  # Remove leading dash
            
            # Store as exception to prevent this instance from showing
            conn = sqlite3.connect(DB_PATH)
            try:
                conn.execute(
                    """INSERT OR IGNORE INTO recurring_exceptions (id, base_event_id, exception_date, created_at)
                       VALUES (?, ?, ?, ?)""",
                    (event_id, base_id, exception_date, datetime.utcnow().isoformat())
                )
                conn.commit()
            finally:
                conn.close()
            return None
    
    # Regular event deletion
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    
    if deleted == 0:
        raise HTTPException(404, "Event not found")
    
    return None

@app.get("/health")
def health_check():
    """Health check endpoint"""
    conn = sqlite3.connect(DB_PATH)
    count = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
    conn.close()
    return {
        "status": "healthy",
        "total_events": count,
        "timestamp": datetime.utcnow().isoformat()
    }

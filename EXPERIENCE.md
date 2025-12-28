# Development Experience: Calendar Management System

## Overview

This document reflects on my experience building the Calendar Management System, including the challenges faced, decisions made, and how I approached the problem.

## Problem Analysis

The assignment required building a calendar system with focus on correctness and thoughtful design rather than feature completeness. The key challenges identified upfront were:

1. **Timezone Handling**: Ensuring correct behavior across timezones and DST transitions
2. **Conflict Detection**: Accurately detecting overlapping events, including edge cases
3. **API Design**: Creating a clean, intuitive API that supports the required features
4. **Data Modeling**: Choosing the right storage and representation for events

## Development Approach

### Phase 1: Understanding the Domain

Before writing code, I spent time understanding the problem space:
- How do calendar systems typically handle timezones? (Answer: UTC storage, timezone-aware display)
- What constitutes a conflict? (Answer: Any time overlap, even if on different dates)
- How should recurring events be stored? (Answer: Store the pattern, expand on demand)

### Phase 2: Technology Selection

I chose:
- **FastAPI** for the backend: Clean API, automatic validation, excellent documentation
- **React + Vite** for the frontend: Modern, fast development experience
- **SQLite** for persistence: Simple setup, no external dependencies, sufficient for a prototype
- **Python's zoneinfo**: Built-in timezone support (Python 3.9+), handles DST automatically

### Phase 3: Core Implementation

I started with the backend API, implementing:
1. Event data model with Pydantic schemas
2. Database schema and initialization
3. CRUD endpoints
4. Conflict detection algorithm
5. Weekly view query logic

Then moved to the frontend:
1. Weekly calendar grid component
2. Event creation/editing modal
3. API integration
4. Timezone selection

## Key Challenges and Solutions

### Challenge 1: Multi-Day Event Conflict Detection

**Problem**: Events spanning midnight (e.g., 23:00-01:00) need special handling. The initial implementation only checked same-date conflicts.

**Solution**: Convert all events to UTC timestamps first, then check for overlap. This automatically handles:
- Events on different dates that overlap in time
- Events spanning midnight
- Timezone differences

**Code**:
```python
def has_conflict(new: EventCreate, old: Event) -> bool:
    # Convert to UTC
    ns = to_utc(new.date, new.start_time, new.timezone)
    ne = to_utc(new.date, new.end_time, new.timezone)
    
    # Handle midnight-spanning
    if ne < ns:
        ne += timedelta(days=1)
    
    # Check overlap: start1 < end2 AND end1 > start2
    return ns < oe and ne > os
```

### Challenge 2: Recurring Event Expansion

**Problem**: Should recurring events be stored as instances or expanded dynamically?

**Decision**: Store the base event with a recurrence pattern, expand dynamically for queries. This:
- Prevents database bloat
- Makes updates/deletes easier (modify the base, all instances change)
- Only generates instances for the requested time window

**Trade-off**: Slightly more complex query logic, but cleaner data model.

### Challenge 3: Timezone Selection in UI

**Problem**: Users should be able to create events in their local timezone and view in different timezones.

**Solution**: 
- Store timezone with each event
- Convert to UTC for storage
- Support timezone parameter in queries
- Allow timezone selection in the UI

### Challenge 4: API Design for Weekly View

**Problem**: Should the weekly view be a separate endpoint or a query parameter?

**Decision**: Use query parameters on the main `/events` endpoint:
- More RESTful (same resource, different filter)
- Simpler API surface
- Easy to extend with other filters later

## What Went Well

1. **UTC Storage Strategy**: Choosing UTC from the start made everything else easier. No timezone bugs once this was established.

2. **Pydantic Validation**: Automatic validation caught many errors early, especially with time formats and required fields.

3. **Incremental Development**: Building the backend first, then frontend, allowed testing the API independently.

4. **Conflict Detection Algorithm**: The overlap check (`start1 < end2 AND end1 > start2`) is standard and handles all cases correctly.

## What Was Difficult

1. **Time Format Handling**: Converting between Python `time` objects, ISO strings, and database storage was more complex than expected. The database stores times as strings, requiring careful parsing.

2. **Frontend-Backend Integration**: Ensuring time formats match between React date inputs and the API required careful formatting/parsing.

3. **Recurring Event Expansion**: Getting the logic right for expanding weekly events within a date range required careful date arithmetic.

4. **Testing Edge Cases**: Testing DST transitions, midnight-spanning events, and cross-timezone conflicts required creating test events at specific times.

## Decisions I'm Confident About

1. **UTC Storage**: This is industry standard and the only way to handle timezones correctly.

2. **Conflict Detection Algorithm**: Using interval overlap math is the correct approach.

3. **SQLite Choice**: Perfect for a prototype - no setup, file-based, SQL support.

4. **Dynamic Recurrence Expansion**: Better than pre-generating instances.

## Decisions I'm Less Certain About

1. **Recurrence Storage**: Storing only "weekly" as a string is simple but not extensible. A JSON recurrence rule would be more flexible.

2. **Error Messages**: Current conflict messages are basic. In production, I'd want to show which event conflicts, the overlap duration, and suggest resolutions.

3. **Date/Time Separation**: Storing date and time separately vs. a single datetime. Current approach works but makes some queries harder.

4. **Frontend State Management**: Using React useState is fine for this scale, but with more features, Context API or Redux might be better.

## What I Learned

1. **Timezone Complexity**: Timezone handling is deceptively complex. DST transitions, ambiguous times, and different timezone rules require careful handling.

2. **API Design**: Good API design involves thinking about use cases, not just CRUD. The weekly view query parameter vs. separate endpoint decision mattered.

3. **Data Modeling Trade-offs**: Storing recurring events as patterns vs. instances is a classic trade-off between storage efficiency and query complexity.

4. **Frontend Date Handling**: Browser date inputs and JavaScript Date objects have quirks. Using ISO date strings and careful parsing is essential.

## Time Breakdown

- **Planning and Design**: ~30 minutes
- **Backend Implementation**: ~2 hours
  - Database setup and models: 30 min
  - CRUD endpoints: 45 min
  - Conflict detection: 30 min
  - Weekly view: 15 min
- **Frontend Implementation**: ~1.5 hours
  - Components: 45 min
  - API integration: 30 min
  - Styling and polish: 15 min
- **Testing and Debugging**: ~1 hour
- **Documentation**: ~1 hour

**Total**: ~5-6 hours

## If I Had More Time

1. **Comprehensive Testing**: Add more edge case tests, especially around DST transitions and multi-day events.

2. **Better UI**: Improve the weekly view layout, add drag-and-drop, better mobile responsiveness.

3. **Performance Optimization**: Add database indexes, optimize conflict detection queries.

4. **Advanced Features**: Event reminders, better recurrence patterns, event search.

5. **Documentation**: Add more API examples, deployment instructions, architecture diagrams.

## Reflection

This project reinforced that building "simple" systems requires careful thought. The calendar domain has many subtle edge cases that can cause bugs if not handled correctly. The focus on correctness over features was valuable - it forced me to think deeply about the core problems (timezones, conflicts) rather than rushing to add features.

The most satisfying part was getting the conflict detection working correctly across timezones. The most frustrating part was the time format conversions between frontend, backend, and database - a common but necessary complexity.

Overall, this was an excellent exercise in system design, focusing on correctness and clarity over feature breadth.


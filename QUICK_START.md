# Quick Start Guide

Get the Calendar Management System up and running in 5 minutes!

## Prerequisites

- Python 3.9+ installed
- Node.js 16+ and npm installed
- Two terminal windows

## Step-by-Step Setup

### Step 1: Backend Setup (Terminal 1)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

✅ Backend is now running at `http://localhost:8000`

### Step 2: Frontend Setup (Terminal 2)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

✅ Frontend is now running at `http://localhost:5173`

### Step 3: Open in Browser

Open your browser and go to: **http://localhost:5173**

You should see the calendar interface!

## First Steps

1. **Create an Event**
   - Click "+ Create Event"
   - Fill in title, date, start/end times
   - Click "Save"
   - Event should appear in the calendar

2. **Test Conflict Detection**
   - Create an event from 10:00-11:00
   - Try to create another from 10:30-11:30
   - You should see a conflict error

3. **Test Recurring Events**
   - Create an event
   - Check "Repeat weekly"
   - Navigate to next week - event should appear

4. **Test Reminders**
   - Create an event with a reminder (e.g., 1 minute)
   - Grant browser notification permission
   - Wait for the notification

## Verify Everything Works

### Check Backend
- Visit: http://localhost:8000/docs
- You should see the Swagger API documentation
- Try the `/health` endpoint

### Check Frontend
- Calendar should load
- You can create events
- Navigation buttons work

## Common Issues

### Backend won't start
- **Port 8000 in use**: Change port with `--port 8001`
- **Python not found**: Use `python3` instead of `python`
- **Module not found**: Make sure virtual environment is activated and dependencies are installed

### Frontend won't start
- **Port 5173 in use**: Vite will auto-use next port
- **npm errors**: Delete `node_modules` and run `npm install` again
- **CORS errors**: Make sure backend is running on port 8000

### Events not showing
- Check browser console (F12) for errors
- Make sure backend is running
- Verify event date is in the currently viewed week

### Notifications not working
- Check browser notification permissions
- Some browsers require HTTPS (localhost usually works)
- Make sure you granted permission when prompted

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md) for a demo walkthrough
- Explore the API at http://localhost:8000/docs
- Review [EXPERIENCE.md](EXPERIENCE.md) for development insights

## Stopping the Servers

- **Backend**: Press `Ctrl+C` in Terminal 1
- **Frontend**: Press `Ctrl+C` in Terminal 2

## Database Reset

To start fresh (deletes all events):
```bash
cd backend
# Stop the server first (Ctrl+C)
del calendar.db  # Windows
# or
rm calendar.db  # macOS/Linux
# Restart the server
uvicorn main:app --reload --port 8000
```

The database will be recreated automatically.

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review error messages in browser console (F12) and terminal
- Ensure both servers are running
- Verify all dependencies are installed

Happy calendaring! 📅

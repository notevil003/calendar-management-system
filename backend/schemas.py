from pydantic import BaseModel, Field
from datetime import date, time, datetime
from typing import Optional

class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    date: date
    start_time: time
    end_time: time
    timezone: str = "UTC"
    recurrence: Optional[str] = None
    reminder_minutes: Optional[int] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None,
            time: lambda v: v.strftime("%H:%M:%S") if v else None,
            datetime: lambda v: v.isoformat() if v else None,
        }
        
    def dict(self, **kwargs):
        """Override dict to ensure dates are serialized as strings"""
        data = super().dict(**kwargs)
        if isinstance(data.get('date'), date):
            data['date'] = data['date'].isoformat()
        if isinstance(data.get('start_time'), time):
            data['start_time'] = data['start_time'].strftime("%H:%M:%S")
        if isinstance(data.get('end_time'), time):
            data['end_time'] = data['end_time'].strftime("%H:%M:%S")
        return data

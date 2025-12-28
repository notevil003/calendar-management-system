const BASE = "http://localhost:8000";

async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const getEvents = async (weekStart = null, timezone = "UTC") => {
  try {
    const params = new URLSearchParams();
    if (weekStart) {
      params.append("week_start", weekStart);
      params.append("timezone", timezone);
    }
    const url = `${BASE}/events${params.toString() ? "?" + params.toString() : ""}`;
    const response = await fetch(url);
    return handleResponse(response);
  } catch (error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to backend. Make sure it's running on http://localhost:8000");
    }
    throw error;
  }
};

export const createEvent = async (data) => {
  try {
    const response = await fetch(`${BASE}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to backend. Make sure it's running on http://localhost:8000");
    }
    throw error;
  }
};

export const updateEvent = async (id, data) => {
  try {
    const response = await fetch(`${BASE}/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to backend. Make sure it's running on http://localhost:8000");
    }
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await fetch(`${BASE}/events/${id}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  } catch (error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to backend. Make sure it's running on http://localhost:8000");
    }
    throw error;
  }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const createMeeting = async (meetingData) => {
  const response = await fetch(`${API_BASE_URL}/meetings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(meetingData),
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create meeting");
  }
  return response.json();
};

export const getMeetings = async () => {
  const response = await fetch(`${API_BASE_URL}/meetings`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch meetings");
  }
  return response.json();
};

export const getMeetingById = async (meetingId) => {
  const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch meeting");
  }
  return response.json();
};

export const updateMeeting = async (meetingId, meetingData) => {
  const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(meetingData),
  });
  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }
  if (!response.ok) {
    throw new Error("Failed to update meeting");
  }
  return response.json();
};

export const updateMeetingStatus = async (meetingId, status) => {
  const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to update meeting status");
  }
  return response.json();
};

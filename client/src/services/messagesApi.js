const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken"); // Assuming token is stored in localStorage
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getConversations = async () => {
  const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
    headers: getAuthHeaders(),
  });
  console.log(response);


  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }
  return response.json();
};

export const getMessages = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/messages/${userId}`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return response.json();
};

export const sendMessage = async (receiverId, content) => {
  const response = await fetch(`${API_BASE_URL}/messages/send`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ receiverId, content }),
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
};

export const markAsRead = async (conversationId) => {
  const response = await fetch(`${API_BASE_URL}/messages/read/${conversationId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to mark as read");
  }
  return response.json();
};

export const getUnreadCount = async () => {
  const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch unread count");
  }
  return response.json();
};

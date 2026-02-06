import io from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ConnectionApi {
  constructor() {
    this.socket = null;
    this.initSocket();
  }

  initSocket() {
    this.socket = io("https://buisness-nexus.up.railway.app", {
      auth: {
        token: localStorage.getItem("authToken"),
      },
    });

    this.socket.on("connect", () => {
      console.log("Connected to socket server for connections");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });
  }

  // Listen for connection request notifications
  onConnectionRequest(callback) {
    this.socket?.on("connection_request", callback);
  }

  // Listen for connection accepted notifications
  onConnectionAccepted(callback) {
    this.socket?.on("connection_accepted", callback);
  }

  // Listen for connection rejected notifications
  onConnectionRejected(callback) {
    this.socket?.on("connection_rejected", callback);
  }

  // Remove all connection listeners
  removeConnectionListeners() {
    this.socket?.off("connection_request");
    this.socket?.off("connection_accepted");
    this.socket?.off("connection_rejected");
  }

  // Join user room for notifications
  joinUserRoom(userId) {
    this.socket?.emit("join_user_room", userId);
  }

  // Leave user room
  leaveUserRoom(userId) {
    this.socket?.emit("leave_user_room", userId);
  }
  // Send connection request from entrepreneur to investor
  async sendConnectionRequest(receiverId) {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/connections/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiverId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send connection request");
    }

    return await response.json();
  }

  // Accept connection request
  async acceptConnectionRequest(connectionId) {
    const token = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE_URL}/connections/${connectionId}/accept`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to accept connection request");
    }

    return await response.json();
  }

  // Reject connection request
  async rejectConnectionRequest(connectionId) {
    const token = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE_URL}/connections/${connectionId}/reject`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log(response);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to reject connection request");
    }

    return await response.json();
  }

  // Get connection requests for current user (investor)
  async getConnectionRequests() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/connections/requests`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("business_nexus_user");
      window.location.href = "/login";
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch connection requests");
    }

    return await response.json();
  }

  // Get connections for current user
  async getConnections() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/connections`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("business_nexus_user");
      window.location.href = "/login";
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch connections");
    }

    return await response.json();
  }

  // Get connection status between current user and another user
  async getConnectionStatus(userId) {
    const token = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE_URL}/connections/status/${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("business_nexus_user");
      window.location.href = "/login";
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch connection status");
    }

    const data = await response.json();
    return data.status;
  }

  // Get sent requests for current user (entrepreneur)
  async getSentRequests() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/connections/sent`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("business_nexus_user");
      window.location.href = "/login";
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch sent requests");
    }

    return await response.json();
  }
}

export const connectionApi = new ConnectionApi();

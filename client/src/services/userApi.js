const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const fetchEntrepreneurs = async () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}/users/entrepreneurs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch entrepreneurs");
  }

  const data = await response.json();
  return data.entrepreneurs;
};

export const fetchInvestors = async () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}/users/investors`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch investors");
  }

  const data = await response.json();
  return data.investors;
};

export const fetchUserById = async (userId, userRole) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("No authentication token found");
  }
  const response = await fetch(
   `${API_BASE_URL}/users/fetch-user?userId=${userId}&role=${userRole}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  const data = await response.json();
  return data.user;
};

export const fetchPartnerById = async (userId) => {
  const token = localStorage.getItem("authToken");

  const userRole = JSON.parse(localStorage.getItem("business_nexus_user"))

  if (!token) {
    throw new Error("No authentication token found");
  }
  const response = await fetch(
   `${API_BASE_URL}/users/fetch-partner?userId=${userId}&role=${userRole.role}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("business_nexus_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  const data = await response.json();
  return data.user;
};
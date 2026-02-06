import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const documentApi = {
  uploadDocument: async (formData) => {
    try {
      const token = localStorage.getItem("authToken");
      console.log("Uploading document with formData:", formData);
      const response = await axios.post(
        `${API_BASE_URL}/documents/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Upload failed");
    }
  },

  getDocuments: async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("business_nexus_user");
        window.location.href = "/login";
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch documents",
      );
    }
  },

  updateDocumentStatus: async (documentId, status) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `${API_BASE_URL}/documents/${documentId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("business_nexus_user");
        window.location.href = "/login";
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update status",
      );
    }
  },

  addSignature: async (documentId, signatureFile) => {
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("signature", signatureFile);

      const response = await axios.post(
        `${API_BASE_URL}/documents/${documentId}/signature`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("business_nexus_user");
        window.location.href = "/login";
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to add signature",
      );
    }
  },

  deleteDocument: async (documentId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `${API_BASE_URL}/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("business_nexus_user");
        window.location.href = "/login";
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete document",
      );
    }
  },
};

export default documentApi;
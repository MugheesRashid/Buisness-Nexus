import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class DealApi {
  // Create a new deal
  async createDeal(dealData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/deals`, dealData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (response.status === 401) {
        console.log("Unauthorized, redirecting to login...");
        localStorage.removeItem("authToken");
        localStorage.removeItem("business_nexus_user");
        window.location.href = "/login";
      }
      return response.data;
    } catch (error) {
      if(error.response?.status === 401){
        localStorage.removeItem('authToken')
        localStorage.removeItem('business_nexus_user')
        window.location.href = '/login'
      }
      throw error.response?.data || error.message;
    }
  }

  // Get all deals for current investor
  async getDeals() {
    try {
      const response = await axios.get(`${API_BASE_URL}/deals`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      return response.data;
    } catch (error) {
      if(error.response?.status === 401){
        localStorage.removeItem('authToken')
        localStorage.removeItem('business_nexus_user')
        window.location.href = '/login'
      }
      throw error.response?.data || error.message;
    }
  }

  // Get deals created by current entrepreneur
  async getMyDeals() {
    try {
      const response = await axios.get(`${API_BASE_URL}/deals/my-deals`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      return response.data;
    } catch (error) {
      if(error.response?.status === 401){
        localStorage.removeItem('authToken')
        localStorage.removeItem('business_nexus_user')
        window.location.href = '/login'
      }
      throw error.response?.data || error.message;
    }
  }

  // Invest in a deal
  async investInDeal(dealId, amount) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/deals/${dealId}/invest`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      if(error.response?.status === 401){
        localStorage.removeItem('authToken')
        localStorage.removeItem('business_nexus_user')
        window.location.href = '/login'
      }
      throw error.response?.data || error.message;
    }
  }

  // Get deal by ID
  async getDealById(dealId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/deals/${dealId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("business_nexus_user");
        window.location.href = "/login";
      }
      throw error.response?.data || error.message;
    }
  }
}

export default new DealApi();

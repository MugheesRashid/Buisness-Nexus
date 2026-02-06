import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const API_BASE_URL = "http://localhost:5000/api";

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  console.log(url)

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if(response.status === 401) {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Create Auth Context
const AuthContext = createContext(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const token = localStorage.getItem('authToken');
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);

      // Connect to socket
      socketRef.current = io('http://localhost:5000', {
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to socket server');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email, password, role) => {
    setIsLoading(true);

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      const { user: userData, token } = response;

      // Transform backend user data to match frontend User interface
      const transformedUser = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
        bio: userData.bio || '',
        isOnline: userData.isOnline,
        createdAt: userData.createdAt,
      };

      setUser(transformedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(transformedUser));
      localStorage.setItem('authToken', token);

      // Connect to socket
      socketRef.current = io('http://localhost:5000', {
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to socket server');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password, role) => {
    setIsLoading(true);

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      console.log(response);

      const { user: userData, token } = response.user;

      // Transform backend user data to match frontend User interface
      const transformedUser = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
        bio: userData.bio || '',
        isOnline: userData.isOnline,
        createdAt: userData.createdAt,
      };

      setUser(transformedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(transformedUser));
      localStorage.setItem('authToken', token);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword }),
      });
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  // Change password function
  const changePassword = async (userId, currentPassword, newPassword) => {
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  // Fetch profile function
  const fetchProfile = async (userId, role) => {
    try {
      const response = await apiRequest(`/profile/get-profile?userId=${userId}&role=${role}`, {
        method: 'GET',
      });

      const { profile } = response;

      // Transform backend profile data to match frontend User interface
      const transformedUser = {
        id: profile._id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatarUrl: profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
        bio: profile.bio || '',
        isOnline: profile.isOnline,
        createdAt: profile.createdAt,
      };

      return transformedUser;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('authToken');

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userId, updates) => {
    try {
      if (!user) throw new Error('User not authenticated');
      console.log(user);
      const endpoint = user.role === 'entrepreneur'
        ? '/profile/update-entrepreneur-profile'
        : '/profile/update-investor-profile';

      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ updates }),
      });
      console.log(response);
      const { updatedProfile } = response;

      // Transform backend profile data to match frontend User interface
      const transformedUser = {
        id: updatedProfile._id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        role: updatedProfile.role,
        avatarUrl: updatedProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedProfile.name)}&background=random`,
        bio: updatedProfile.bio || '',
        isOnline: updatedProfile.isOnline,
        createdAt: updatedProfile.createdAt,
      };

      // Update current user
      setUser(transformedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(transformedUser));

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const value = {
    user,
    socket: socketRef.current,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { createContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const socketRef = useRef(null); // 🔥 IMPORTANT

  // =========================
  // CHECK AUTH
  // =========================
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // =========================
  // LOGIN
  // =========================
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        axios.defaults.headers.common["token"] = data.token;
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setAuthUser(data.userData);
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.removeItem("token");
    axios.defaults.headers.common["token"] = null;

    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);

    if (socketRef.current) {
      socketRef.current.off();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    toast.success("Logged out successfully");
  };

  // =========================
  // UPDATE PROFILE
  // =========================
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // UPDATE STATUS
  // =========================
  const updateStatus = async (statusText, statusVideo, statusPhoto) => {
    try {
      const { data } = await axios.put("/api/auth/update-status", {statusText, statusVideo, statusPhoto});
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Status updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // CONNECT SOCKET 🔥
  // =========================
  const connectSocket = (user) => {
    if (!user || socketRef.current) return;

    socketRef.current = io(backendUrl, {
      query: { userId: user._id.toString() },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  };

  // =========================
  // INIT AUTH
  // =========================
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        axios,
        authUser,
        onlineUsers,
        socket: socketRef.current, // 🔥 stable socket
        login,
        logout,
        updateProfile,
        updateStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

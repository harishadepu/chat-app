import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'


const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider =({children})=>{

    

    const [token , setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    // check user auth 

    const checkAuth = async()=>{
        try{
            const {data} = await axios.get("/api/auth/check");
            console.log(data);
            if(data.success){
                setAuthUser(data.user)
                connectSocket(data.user)
            }

        }
        catch(error){
            toast.error(error.message)

        }
    }

    // login function to handle user auth socket conn

    const login = async(state, credentials)=>{
        try{
            const {data} = await axios.post(`/api/auth/${state}`,credentials);
            console.log(data);
            if(data.success){
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token",data.token)
                setAuthUser(data.userData);
                connectSocket(data.userData)
                toast.success(data.message)
            }else{
                toast.error(data.message)
            }
        }
        catch(error){
                toast.error(error.message)
        }
    }

    // logout function 

    const logout = async()=>{
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out succesfully")
        socket.disconnect();
    }

    // update profile 

    const updateProfile = async(body)=>{
        try{
            const {data} = await axios.put("/api/auth/update-profile",body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("profile is Updated succesfully")
            }
        }
        catch(error){
            toast.error(error.message)
        }
    }

    //connect socket function to handole socket connection

    const connectSocket = (userData)=>{
        if(!userData || socket?.connected) return;
        const newSocket = io(backendUrl,{
            query:{
                userId:userData._id,
            }
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds)=>{
            setOnlineUsers(userIds);
        })
    }

    useEffect(()=>{
        if(token){
            axios.defaults.headers.common["token"]= token;
        }
        checkAuth();
    },[token])

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    }
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}





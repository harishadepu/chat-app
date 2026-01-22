import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';
import User from './models/User.js';

const app = express();
const server = http.createServer(app);

//intialise socket.io
export const io = new Server(server,{
    cors:{origin:"http://localhost:5173"}
})

//store online users 

export const userSocketMap = {};

//socket io connect handler 

io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("user connected",userId)

    if(userId){
        userSocketMap[userId] = socket.id;
    }
    //emit online users to all connected clients 

    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    // Handle call signaling
    socket.on("call-signal", (data) => {
        const { signal, callerId, receiverId, callType, from } = data;
        console.log(`Call signal from ${from} for call between ${callerId} and ${receiverId}`);
        
        // Send signal to the other party
        let targetId;
        if (from === callerId) {
            targetId = receiverId;
        } else {
            targetId = callerId;
        }
        
        const targetSocketId = userSocketMap[targetId];
        console.log(`Forwarding signal to ${targetId} (socket: ${targetSocketId})`);
        if (targetSocketId) {
            io.to(targetSocketId).emit("call-signal", {
                signal,
                callerId,
                receiverId,
                callType,
                from
            });
        }
    });

    // Handle incoming call
    socket.on("incoming-call", async (data) => {
        const { callerId, receiverId, callType } = data;
        console.log(`Incoming call from ${callerId} to ${receiverId}, type: ${callType}`);
        try {
            const caller = await User.findById(callerId).select('fullName');
            const receiverSocketId = userSocketMap[receiverId];
            console.log(`Receiver socket ID: ${receiverSocketId}`);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("incoming-call", {
                    callerId,
                    receiverId,
                    callType,
                    callerName: caller ? caller.fullName : "Unknown Caller"
                });
                console.log(`Incoming call notification sent to ${receiverId}`);
            } else {
                console.log(`Receiver ${receiverId} not connected`);
            }
        } catch (error) {
            console.error('Error fetching caller info:', error);
        }
    });

    // Handle call acceptance
    socket.on("accept-call", (data) => {
        const { callerId, receiverId, callType } = data;
        console.log(`Call accepted by ${receiverId} for call from ${callerId}`);

        const callerSocketId = userSocketMap[callerId];
        const receiverSocketId = userSocketMap[receiverId];

        if (callerSocketId) {
            io.to(callerSocketId).emit("call-accepted", {
                callerId,
                receiverId,
                callType
            });
            console.log(`Call acceptance notification sent to caller ${callerId}`);
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-accepted", {
                callerId,
                receiverId,
                callType
            });
            console.log(`Call acceptance notification sent to receiver ${receiverId}`);
        }
    });

    // Handle call rejection
    socket.on("reject-call", (data) => {
        const { callerId, receiverId } = data;
        const callerSocketId = userSocketMap[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-rejected", {
                callerId,
                receiverId
            });
        }
    });

    // Handle end call
    socket.on("end-call", (data) => {
        const { callerId, receiverId } = data;
        const callerSocketId = userSocketMap[callerId];
        const receiverSocketId = userSocketMap[receiverId];

        if (callerSocketId) {
            io.to(callerSocketId).emit("call-ended", {
                callerId,
                receiverId
            });
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-ended", {
                callerId,
                receiverId
            });
        }
    });

    socket.on("disconnect",()=>{
        console.log("user Disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})


// Middleware
app.use(cors());
app.use(express.json({limit: '4mb'}));

app.use("/api/status",(req, res) => {
    res.send('sever is live')
});
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);


// Connect to the database
await connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
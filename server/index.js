import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

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
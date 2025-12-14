import Message from "../models/Messages.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../index.js";

// get all users except logged user 
export const getUsersForSidebar = async (req,res)=>{
    try{
        const userId = req.user._id;
        const filterdUsers = await User.find({_id:{$ne: userId}}).select("-password");

        // count messages 
        const unseenMessages = {};
        const promises = filterdUsers.map(async(user)=>{
            const messages = await Message.find({senderId:user._id,receiverId:userId,seen:false});
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true,users:filterdUsers,unseenMessages})
    }
    catch(err){
        console.log(err.Message);
        res.json({success:false, message: err.message});
    }
}

// get all msgs

export const getMessages = async(req,res)=>{
    try{
        const {id:selectedUserId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or :[
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId},
            ]
        })
        await Message.updateMany({senderId: selectedUserId, receiverId: myId},{seen:true});
        res.json({success: true, messages});

    }
    catch(err){
        console.log(err.message);
        res.json({success:false,message: err.message})
    }
}

// api to mark msg as seen using msg id 

export const markMessageAsSeen = async(req,res)=>{
    try{
        const {id} = req.params;
        await Message.findByIdAndUpdate(id,{seen:true});
        res.json({success:true});

    }
    catch(err){
        console.log(err.message);
        res.json({success: false, message: err.message})
    }
}

//send msg to select user 

export const sendMessage = async(req,res)=>{
    try{
        const {text,image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;

        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:  imageUrl
        })
        //emit the new msg to the reciver 
        const reciverSocketId = userSocketMap[receiverId];
        if(reciverSocketId){
            io.to(reciverSocketId).emit("newMessage",newMessage)
        }
        res.json({success:true, newMessage});

    }
    catch(err){
        console.log(err.message);
        res.json({success:false, message:err.message})
    }
}

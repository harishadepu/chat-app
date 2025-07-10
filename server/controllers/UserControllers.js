

import bcrypt from "bcrypt";
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";

//signUp 
export const signUp = async(req,res)=>{
    const {email,password,fullName,profilePic,bio} = req.body;
    try{
        if(!email || !password || !fullName){
            return res.json({succes:false,message:"Missing Details"});

        }
        const user = await User.findOne({email});
        if(user){
            return res.json({success:false,message: "User already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hassedPassword = await bcrypt.hash(password,salt);
        const newUser = await User.create({
            email, fullName, profilePic, bio, password:hassedPassword
        });
        const token = generateToken(newUser._id);
        res.json({success:true, message: "User created successfully", token, user: newUser});

    }
catch(err){
    console.log(err);
    res.json({success:false, message: err.message}); 
}
}

//Login 

export const login = async(req,res)=>{
    try{
        const {email,password} = req.body;
        const userData = await User.findOne({email});

        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if(!userData || !isPasswordValid){
            return res.json({success:false, message: "Invalid credentials"});

        }
        const token = generateToken(userData._id);
        res.json({success:true, message: "Login successful", token, user: userData});
    }
catch(err){
    console.log(err.message);
    res.json({success:false, message: err.message});
}
}

// controller check if user authenticated

export const checkAuth = async(req,res)=>{
    res.json({success:true, user: req.user});
}

// controller update user profile

export const updateProfile = async(req,res)=>{
    try{
        const {fullName, profilePic, bio} = req.body;
        const userId = req.user._id;
        let updatedUser;
        if(!profilePic){
            await User.findByIdAndUpdate(userId,{bio,fullName},{new:true})
        }
        else{
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName},{new:true});
        }
        res.json({success: true, message: "Profile updated successfully", user: updatedUser});
    }
    catch(err){
        console.log(err.message);
        res.json({success: false, message: err.message});
    }
}

// middleware 

import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async(req,res,next)=>{
    try{
        const token = req.headers.token;
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

        const user = await User.findById(decoded.userId).select("-passeword");
        if(!user){
            return res.json({success:false, message: "User not found"});

        }
        req.user = user;
        next();
    }
catch(err){
    console.log(err.message);
    res.json({success:false, message: err.message});
}}
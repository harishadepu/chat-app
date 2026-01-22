import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type:String, required: true, unique: true
    },
    password:{
        type:String, required: true
    },
    fullName:{
        type:String, required: true
    },
    profilePic:{
        type:String,default:""
    },
    bio:{
        type:String
    },
    status:{
        text:{
            type:String,
            default:""
        },
        video:{
            type:String,
            default:""
        },
        photo:{
            type:String,
            default:""
        },
        createdAt:{
            type:Date,
            default:null
        }
    }
},{timestamps:true});
const User = mongoose.model("User", userSchema);

export default User;
import mongoose from "mongoose";

export const connectDB = async () => {
   try { mongoose.connection.on("connected",()=>  console.log("MongoDB connected successfully"));
  
    await mongoose.connect(`${process.env.MONGO_URI}/quick-chat`);
   
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit the process with failure
  }
}
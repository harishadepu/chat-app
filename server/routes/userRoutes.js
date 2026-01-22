import express from 'express';
import { checkAuth, login, signUp, updateProfile, updateStatus } from '../controllers/UserControllers.js';
import { protectRoute } from '../middlewear/auth.js';

const userRouter = express.Router();

userRouter.post("/signup",signUp);
userRouter.post("/login",login);
userRouter.put("/update-profile", protectRoute,updateProfile);
userRouter.put("/update-status", protectRoute,updateStatus);
userRouter.get("/check",protectRoute,checkAuth);

export default userRouter;
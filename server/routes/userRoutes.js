import express from 'express';
import { checkAuth, login, signUp, updateProfile } from '../controllers/UserControllers.js';
import { protectRoute } from '../middlewear/auth.js';

const userRouter = express.Router();

userRouter.post("/signup",signUp);
userRouter.post("/login",login);
userRouter.put("/update-profile", protectRoute,updateProfile);
userRouter.get("/check",protectRoute,checkAuth);

export default userRouter;
import { Router } from "express";
import {registerUser , loginUser, logoutUser} from "../controllers/users.controller.js";
import { upload } from '../middlewares/multer.middleware.js'
import { validateUserByJwt } from "../middlewares/auth.middleware.js";
const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name: "avatar", maxCount: 1
        },
        {
            name: "coverImage", maxCount: 1
        }
    ]),
    registerUser
    );

router.route("/login").post(loginUser)    

// routes after login

router.route("/logout").post( validateUserByJwt , logoutUser)


export default router;
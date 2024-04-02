import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  accessRefreshToken,
  updatePassword,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
  getChannelStatus,
  getCurrentUser,
  getWatchHistory
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateUserByJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// routes after login

router.route("/logout").post(validateUserByJwt, logoutUser);
router.route("/refreshtoken").post(accessRefreshToken);
router.route("/Current-user").get(validateUserByJwt , getCurrentUser)
router.route("/update-password").post(validateUserByJwt, updatePassword);
router.route("/update-user").patch(validateUserByJwt, updateUserDetails);
router
  .route("/update-avatar")
  .patch(validateUserByJwt, upload.single("avatar"), updateAvatar);
router
  .route("/coverimage")
  .patch(
    validateUserByJwt,
    upload.single("coverImage"),
    updateCoverImage
  );

router.route("/channel/:username").get(validateUserByJwt , getChannelStatus);
router.route("/history").get(validateUserByJwt , getWatchHistory);

export default router;

import { Router } from "express";
import { validateUserByJwt } from "../middlewares/auth.middleware.js";
import { generateTweet } from "../controllers/tweets.controller.js";
const tweetRouter = Router()

tweetRouter.route("/createtweet").post(validateUserByJwt , generateTweet);

export default tweetRouter;
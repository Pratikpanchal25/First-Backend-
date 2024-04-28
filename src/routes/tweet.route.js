import { Router } from "express";
import { validateUserByJwt } from "../middlewares/auth.middleware.js";
import { generateTweet, getAllTweets } from "../controllers/tweets.controller.js";
const tweetRouter = Router()

tweetRouter.route("/createtweet").post(validateUserByJwt , generateTweet);
tweetRouter.route("/alltweets").post(validateUserByJwt , getAllTweets);

export default tweetRouter;
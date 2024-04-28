import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const generateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) throw new ApiError(401, "Tweet Content Is Required");

  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
  if (!user) throw new ApiError(401, "User Not Found");

  const tweet = await Tweet.create({
    owner: user.username,
    content: content,
  });

  if (!tweet) throw new ApiError(501, "Error While Generating a Tweet");

  res
    .status(200)
    .json(new ApiResponse(200, { user, tweet }, "Tweet Created Successfully"));
});

const getAllTweets = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const tweets = await Tweet.aggregate([
    [
      {
        $match: {
          owner: user.username,
        },
      },
    ],
  ]);


  return res
    .status(200)
    .json(new ApiResponse(200,{ user, tweets}, "All Tweets Got"));
});

export { generateTweet, getAllTweets };

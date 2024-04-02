import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) throw new ApiError(401, "Tweet Content Is Required");
  const tweet = Tweet.create({
    owner: req.user.username,
    content: content,
  });

  if(!tweet) throw new ApiError(501 , "Error While Generating a Tweet");

  res.status(200)
  .jsopn(new ApiResponse(200 , tweet , "Tweet Created Successfully"))
});

export {generateTweet};
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";

export const validateUserByJwt = asyncHandler(async (req, _, next) => {
  try {
    // get token from req.cookies or req.header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Invalid Access , Token Not Found");

    const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Invalid Accesss");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error || "invalid access");
  }
});

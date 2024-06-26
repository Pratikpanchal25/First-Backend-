import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { deleteOnCloudinary } from "../utils/deleteOnCloudinary.js";


const generateRefreshAndAccessToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(500, "Something Went Wrong While Generating Tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get data from front-end
  // validate data : empty
  // check if user is already registered or not
  // get files and check if files are entered or not : avatar
  // upload files to cloudinary
  // get validation from cloudinary
  // make json to upload to mongoDB
  // upload to mongoDB
  // give response without password and refresh token

  // get data from front-end
  const { fullname, username, email, password } = req.body;
  console.log("username :" + username);

  // validate data : empty

  if (
    [username, fullname, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(200, "All fields are Required");
  }

  // check if user is already registered or not

  const existOrNot = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existOrNot) throw new ApiError(409, "The User Already Exists");

  // get localpath of avatar and coverImage
  // get files and check if files are entered or not : avatar

  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(req.files);
  console.log(avatarLocalPath);

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar Image Is Required");

  // Upload On cloudinary

  const avatarCloudinaryRes = await uploadOnCloudinary(avatarLocalPath);
  console.log(avatarCloudinaryRes);
  const coverImageCloudinaryRes = await uploadOnCloudinary(coverImageLocalPath);
  console.log(coverImageCloudinaryRes);

  // get validation from cloudinary
  if (!avatarCloudinaryRes) throw new ApiError(400, "Avatar Image Is Required");

  // make json to upload to mongoDB
  // get user  from database

  const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    avatar: avatarCloudinaryRes.url,
    coverImage: coverImageCloudinaryRes?.url || "",
    email,
    password,
  });

  // get user by _id from database
  // get user without password and refresh token

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  /// validation

  if (!createdUser)
    throw new ApiError(
      500,
      "Something Went Wrong While Registering The User...Please Try Again"
    );

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        createdUser,
        "The User Is Successfully Registered...."
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // get data
  // validation username and email
  // find the user
  // if no user then tell
  // if there is user then validate password
  // if pasword is wrong then tell
  // if password is correct then give acceesToken and refresh Token
  // send in cookies

  // get data
  const { username, email, password } = req.body;

  console.log(password);
  console.log(username);

  // validation username and email
  if (!username && !email)
    throw new ApiError(400, "Username Or Email Is Required");

  // find the user

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // console.log(user);
  // if no user then tell

  if (!user) throw new ApiError(404, "User Not Found");

  // if there is user then validate password

  const passwordValidation = await user.isPasswordCorrect(password);

  if (!passwordValidation) throw new ApiError(401, "Password Is Incorrect");

  // if password is correct then give acceesToken and refresh Token

  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user._id
  );

  // make new user object which has refresh Token
  user.refreshToken = refreshToken;
  // console.log("refreshToken" , user.refreshToken);
  const newUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // console.log(user);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: newUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User Successfully Logged In"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  console.log(req.user);

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged Out User Successfully"));
});

const accessRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "RefreshToken Not Found");

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  if (!decodedToken) throw new ApiError(401, "Invalid RefreshToken");

  try {
    const user = await User.findById(decodedToken._id);
    if (!user) throw new ApiError(401, "User Not Found By RefreshToken");

    if (user.refreshToken !== incomingRefreshToken)
      throw new ApiError(401, "Invalid RefreshToken");

    const { accessToken, newRefreshToken } = generateRefreshAndAccessToken();

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "AccessToken Refreshed Successfully"
        )
      );
  } catch (error) {
    // throw new ApiError(401 , error?.message || "invalid AccessToken")
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if ((!oldPassword && !newPassword) || !(newPassword || oldPassword))
    throw new ApiError(401, "All Fields required");

  // if(oldPassword !== req.user.password) throw new ApiError(401, "old Password is Incorrect");

  const user = await User.findById(req.user._id);
  const isPasswordTrue = await user.isPasswordCorrect(oldPassword);
  console.log(isPasswordTrue);

  if (!isPasswordTrue) throw new ApiError(401, "old Password is Incorrect");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "The Password Is Successfully Updated"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: req.user,
      },
      "Fetched Current User"
    )
  );
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { email, username } = req.body;
  console.log(email);

  if (!(email || username)) throw new ApiError(401, "All Fields Are Required");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        email,
        username,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Account Details Updated"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const oldAvatarPath = req.user.avatar;
  console.log(oldAvatarPath);
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(401, "Avatar file not received");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar)
    throw new ApiError(501, "Error While Uploading Avatar On Cloudinary");

  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      avatar: avatar.url,
    },
  });

  const updatedUser = await User.findById(req.user._id).select("-password");

  const deleteImage = await deleteOnCloudinary(oldAvatarPath);
  if (deleteImage) console.log("File Deleted Successfully On Cloudinary");
  console.log(deleteImage);

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedUser }, "Avatar Updated Successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath)
    throw new ApiError(401, "CoverImage file not received");

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage)
    throw new ApiError(501, "Error While Uploading coverImage On Cloudinary");

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { updatedUser }, "CoverImage Updated Successfully")
    );
});

const getChannelStatus = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.toLowerCase().trim())
    throw new ApiError(400, "Username Is Required");

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase().trim(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "allMySubscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "channelsSubscribedByMe",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$allMySubscribers",
        },
        subscribedByMeCount: {
          $size: "$channelsSubscribedByMe",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$allMySubscribers.subscriber._id"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        subscribedByMeCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel.length) throw new ApiError(401, "User Not Found");
  console.log(channel);

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User Fetched Successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  console.log(user);
  console.log(user[0]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "WatchHistory Fetched SuccessFully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  accessRefreshToken,
  updatePassword,
  getCurrentUser,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
  getChannelStatus,
  getWatchHistory,
};

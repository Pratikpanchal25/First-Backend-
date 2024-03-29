import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { User } from "../modules/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

  const avatarLocalPath = req.files?.avatar[0]?.path
  console.log(req.files);
  console.log(avatarLocalPath);

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath) throw new ApiError(400 , "Avatar Image Is Required")

  // Upload On cloudinary

 const avatarCloudinaryRes =  await uploadOnCloudinary(avatarLocalPath);
 console.log(avatarCloudinaryRes);
 const coverImageCloudinaryRes  = await uploadOnCloudinary(coverImageLocalPath);
 console.log(coverImageCloudinaryRes);


  // get validation from cloudinary
 if(!avatarCloudinaryRes) throw new ApiError(400 , "Avatar Image Is Required")

  // make json to upload to mongoDB
  // get user  from database

const user = await  User.create({
    username: username.toLowerCase() , 
    fullname , 
    avatar: avatarCloudinaryRes.url,
    coverImage: coverImageCloudinaryRes?.url || "",
    email,
    password
  })
  
  // get user by _id from database
  // get user without password and refresh token

 const createdUser = await User.findById(user._id).select("-password -refreshToken")

  /// validation

 if(!createdUser) throw new ApiError(500 , "Something Went Wrong While Registering The User...Please Try Again")

 return res.status(201).json(
  new ApiResponse(200 , createdUser ,"The User Is Successfully Registered....")
 )



});

export default registerUser;

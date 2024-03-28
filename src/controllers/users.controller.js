import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async (req , res)=> {
    res.json({
        message: "Hi Pratik",
    })
})

export default registerUser;
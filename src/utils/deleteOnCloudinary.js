import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME  , 
  api_key: process.env.CLOUDINARY_API_KEY , 
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const deleteOnCloudinary = async (filePath) => {
    try {
        if(!filePath) return null
        const response = await cloudinary.uploader.destroy(filePath )
        console.log("The File Has Been Deleted On Cloudinary");
        
        // console.log(response);
        return response;
    } catch (error) {
        throw error;
       
    }
}

export {deleteOnCloudinary}
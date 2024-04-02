import mongoose, { mongo } from "mongoose"
import express from "express"
import { DB_NAME } from "../constants.js"

const app = express()


const connectDB = async ()=> {
    try {
        
        const databaseInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log("MONGODB Connected !!!");
        // console.log(databaseInstance);
        
    } catch (error) {
        console.log("database Connection FAILED" , error);
    }
    
}

export default connectDB
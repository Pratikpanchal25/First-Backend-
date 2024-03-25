import mongoose, { mongo } from "mongoose"
import express from "express"
import { DB_NAME } from "../constants.js"

const app = express()
console.log(process.env.MONGODB_URL);
console.log(`${process.env.MONGODB_URL}/${DB_NAME}`);

const connectDB = async ()=> {
    try {
        const databaseInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log("MONGODB Connected");
        console.log(databaseInstance);
        
    } catch (error) {
        console.log("database Connection failed" , error);
    }
    
}

export default connectDB;
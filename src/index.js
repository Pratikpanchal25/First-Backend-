import connectDB from "./db/databseConnection.js";
import dotenv from "dotenv"
import {app} from "./app.js";


dotenv.config({path: "./env"})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=> console.log(`The App is Listening on port ${process.env.PORT}`))
    
})
.catch((error)=> console.log("DB connection FAILED !!!" , error))
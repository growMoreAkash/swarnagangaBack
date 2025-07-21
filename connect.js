import mongoose from "mongoose";
// import ENV from "../config.js";
import 'dotenv/config'

const DB = process.env.DB;

const connect = async () => {
    const database = await mongoose.connect(DB, {
    })
    console.log("DB connect")
    return database;
} 
export default connect
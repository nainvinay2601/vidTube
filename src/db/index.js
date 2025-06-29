//how the database will be connected

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/*
2 STEP to remember when connecting the database 

1. Always except error so always use the try catch block 
2. consider database is on different continent so any process on it will take time so always use async await on db process 
*/

const connectDB = async () => {
  // Step 1 -> always expect an error _ ALWAYS so use the try catch block

  try {
    // connect database -> mongoose will help to connect database
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `\n✅ MongoDB Connected! 
   - Host: ${connectionInstance.connection.host}
   - DB Name: ${connectionInstance.connection.name}`
    );
  } catch (error) {
    console.error("MONGODB CONNECTION ERROR ", error);
    // connection problem so exit from it -> just a good practice. Db not connected what's the point of moving forward??
    process.exit(1); // we are intentionally crashing it so it's a good practice to give it a code:1 instead of 0
  }
};

export default connectDB;

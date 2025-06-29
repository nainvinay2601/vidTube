import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

import { app } from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 3001;

// we want to connect app only after the db connection has been set

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at port ${PORT}...`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error", err);
  });

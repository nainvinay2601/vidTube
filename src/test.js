import fs from 'fs';
import dotenv from 'dotenv';

// Check if file is even readable
const fileExists = fs.existsSync('./.env');
console.log("Does .env file exist?", fileExists);

const result = dotenv.config({ path: './.env' });
console.log("dotenv config result:", result);

console.log("process.env.PORT =", process.env.PORT);

import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controllers.js";

const router = Router();

// where will this route will serve

router.route("/").get(healthcheck); // so when someone goes on the home router and make any kind of request  like here we are doing the get req -> translates to when we send a get request a "/" respond with the healthcheck

export default router;

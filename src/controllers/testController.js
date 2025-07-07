// controllers/testController.js
import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

router.get("/ping", asyncHandler(async (req, res) => {
  res.success({ message: "pong!" });
}));

export default router;

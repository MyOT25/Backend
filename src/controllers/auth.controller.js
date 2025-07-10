import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { loginService } from "../services/auth.service.js";
import { LoginRequestDto } from "../dtos/auth.dto.js";
import { signupService } from "../services/auth.service.js";
import { SignUpDto } from "../dtos/auth.dto.js";

const router = express.Router();

// api/posts/login
router.post(
  "/posts/login",
  asyncHandler(async (req, res) => {
    const dto = new LoginRequestDto(req.body);
    const { valid, message } = dto.validate();

    if (!valid) {
      return res.error({
        errorCode: "A002",
        reason: message,
      });
    }

    const result = await loginService(dto);
    return res.success(result);
  })
);

// api/posts/signup
router.post(
  "/posts/signup",
  asyncHandler(async (req, res) => {
    const signUpDto = new SignUpDto(req.body);
    const result = await signupService(signUpDto);
    return res.success(result);
  })
);

export default router;

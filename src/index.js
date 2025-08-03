import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import passport from "passport";
import swaggerUi from "swagger-ui-express";

import errorHandler from "./middlewares/errorHandler.js";
import swaggerSpec from "./config/swagger.js";
import testRouter from "./controllers/test.controller.js"; // 변경된 경로
import userRouter from "./controllers/user.controller.js"; // (있다면 추가)

import communityRouter from "./controllers/community.controller.js";
import postRouter, {
  createViewingPost,
} from "./controllers/post.controller.js";
import { createPost, addCasting } from "./controllers/post.controller.js";
import authRouter from "./controllers/auth.controller.js";
import questionRouter from "./controllers/question.controller.js";
import answerRouter from "./controllers/answer.controller.js";
import questionTagRouter from "./controllers/questionTag.controller.js";
import homeFeedRouter from "./controllers/homeFeed.controller.js";

import "./config/passport.js"; // passport 설정

import {
  getUserTicketbook,
  getMonthlySummary,
} from "./controllers/post.controller.js";
import {
  addMemoryBook,
  getMemoryBook,
  updateMemoryBook,
} from "./controllers/memorybook.controller.js";
import { authenticateJWT } from "./middlewares/authMiddleware.js";
import { getMusicalCastings } from "./controllers/casting.controller.js";
import { getTicketBookDetail } from "./controllers/ticektbook.controller.js";

import { s3Uploader, uploadToS3 } from "./middlewares/s3Uploader.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ 공통 응답 헬퍼 등록
app.use((req, res, next) => {
  res.success = (success) => {
    return res.json({ resultType: "SUCCESS", error: null, success });
  };

  res.error = ({ errorCode = "unknown", reason = null, data = null }) => {
    return res.json({
      resultType: "FAIL",
      error: { errorCode, reason, data },
      success: null,
    });
  };

  next();
});

// ✅ 미들웨어
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger 문서
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 라우터 연결 (controllers에서 라우터 export하는 구조)
app.use("/api/test", testRouter);
app.use("/api/users", userRouter); // 필요에 따라 추가
app.use("/api/community", communityRouter);
app.use("/api", authRouter);
//app.use("/api/communities", communityRouter);
app.use("/api/communities", postRouter);
app.use("/api/posts", postRouter);
app.use("/api/questions", questionRouter);
app.use("/api/answers", answerRouter);
app.use('/api', questionTagRouter);
app.use("/api/homefeed", homeFeedRouter);

// 기본 라우트

app.use(passport.initialize()); // JWT 인증 활성화

// Swagger UI 경로 설정

app.get("/api/posts/ticketbook", authenticateJWT, getUserTicketbook);
app.get("/api/posts/monthly-summary", authenticateJWT, getMonthlySummary);
app.post(
  "/api/posts/musical",
  authenticateJWT,
  s3Uploader(),
  createViewingPost
);
app.post("/api/posts/musical/castings", authenticateJWT, addCasting);
app.post("/api/posts/memorybooks", authenticateJWT, addMemoryBook);
app.get("/api/posts/memorybooks", authenticateJWT, getMemoryBook);
app.put("/api/posts/memorybooks", authenticateJWT, updateMemoryBook);
app.get("/api/posts/musical/castings", getMusicalCastings);
app.get("/api/ticketbook/:musicalId", authenticateJWT, getTicketBookDetail);

app.get("/", (req, res) => {
  res.send("Hello MyOT!");
});

// 공통 예외 처리 미들웨어
app.use(errorHandler);

// ✅ 서버 실행
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
console.log("📦 DB_NAME:", process.env.DB_NAME);

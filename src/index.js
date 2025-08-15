import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./sockets/socketHandler.js";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import bodyParser from "body-parser";

import errorHandler from "./middlewares/errorHandler.js";
import swaggerSpec from "./config/swagger.js";
import testRouter from "./controllers/test.controller.js"; // 변경된 경로
import userRouter from "./controllers/user.controller.js"; // (있다면 추가)

import communityRouter from "./controllers/community.controller.js";
import postRouter from "./controllers/post.controller.js";
import { createPost, addCasting } from "./controllers/post.controller.js";
import authRouter from "./controllers/auth.controller.js";
import questionRouter from "./controllers/question.controller.js";
import answerRouter from "./controllers/answer.controller.js";
import questionTagRouter from "./controllers/questionTag.controller.js";
import homeFeedRouter from "./controllers/homeFeed.controller.js";
import profileFeedRouter from "./controllers/profileFeed.controller.js";
import communityReviewRouter from "./controllers/communityReview.controller.js";
import bookmarkRouter from "./controllers/bookmark.controller.js";

import "./config/passport.js"; // passport 설정

import {
  addMemoryBook,
  getMemoryBook,
  updateMemoryBook,
} from "./controllers/memorybook.controller.js";
import { authenticateJWT } from "./middlewares/authMiddleware.js";
import { getMusicalCastings } from "./controllers/casting.controller.js";

import {
  getTicketBookDetail,
  getTicketbookSeriesController,
} from "./controllers/ticketbook.controller.js";
import {
  createChatRoomController,
  getChatRoomListController,
  sendMessage,
} from "./controllers/chat.controller.js";

import { s3Uploader, uploadToS3 } from "./middlewares/s3Uploader.js";
import { getMessages } from "./controllers/message.controller.js";
import {
  getUserTicketbookWatchingRecords,
  getMonthlySummary,
  createViewingPost,
  getMusicalCast,
} from "./controllers/viewingRecord.controller.js";
import { getMusicalByName } from "./controllers/musical.controller.js";

dotenv.config();

const app = express();
const server = http.createServer(app); // 이걸로 서버 생성

const io = new Server(server, {
  cors: {
    origin: "*", // 개발 중엔 허용
    methods: ["GET", "POST"],
  },
});
// 소켓 로직 분리해서 구성
setupSocket(io);

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

app.use(passport.initialize()); // JWT 인증 활성화

// 라우터 연결 (controllers에서 라우터 export하는 구조)
app.use("/api/test", testRouter);
app.use("/api/users", userRouter); // 필요에 따라 추가
app.use("/api/community", communityReviewRouter);
app.use("/api/community", communityRouter);
app.use("/api", authRouter);
//app.use("/api/communities", communityRouter);
app.use("/api/questions", questionRouter);
app.use("/api/answers", answerRouter);
app.use("/api/communities", postRouter);
app.use("/api/post", postRouter);

//app.use("/api", questionTagRouter);
app.use("/api/homefeed", homeFeedRouter);
app.use("/api/users/:userId/profilefeed", profileFeedRouter);
app.use("/api/bookmarks", bookmarkRouter);

// 기본 라우트

// Swagger UI 경로 설정

// -- 하경 API
app.post("/api/posts/musical/castings", authenticateJWT, addCasting);
app.post("/api/posts/memorybooks", authenticateJWT, addMemoryBook);
app.get("/api/posts/memorybooks", authenticateJWT, getMemoryBook);
app.put("/api/posts/memorybooks", authenticateJWT, updateMemoryBook);
app.get("/api/posts/musical/castings", getMusicalCastings);
app.get("/api/ticketbook/:musicalId", authenticateJWT, getTicketBookDetail);
app.post("/api/chatrooms", authenticateJWT, createChatRoomController);
app.get("/api/chat/rooms", authenticateJWT, getChatRoomListController);
app.post("/api/chat/send", authenticateJWT, sendMessage);
app.get("/api/messages", authenticateJWT, getMessages);
app.get(
  "/api/viewingrecords/ticketbook",
  authenticateJWT,
  getUserTicketbookWatchingRecords
);
app.get(
  "/api/viewingrecords/monthly-summary",
  authenticateJWT,
  getMonthlySummary
);
app.post(
  "/api/viewingrecords/musical",
  authenticateJWT,
  s3Uploader(),
  createViewingPost
);
// 작품 모아보기(시리즈)
app.get(
  "/api/ticketbook/:musicalId/series",
  authenticateJWT,
  getTicketbookSeriesController
);
// 역할별 출연진 목록 조회
app.get("/api/viewingrecords/:musicalId/cast", authenticateJWT, getMusicalCast);
app.get("/api/viewingrecords/musicals", getMusicalByName);

// 하경 API --

app.get("/", (req, res) => {
  res.send("Hello MyOT!");
});

app.use("/api/posts", postRouter);

// 공통 예외 처리 미들웨어
app.use(errorHandler);

// ✅ 서버 실행
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server+ Socket.IO running on http://localhost:${port}`);
});
console.log("📦 DB_NAME:", process.env.DB_NAME);

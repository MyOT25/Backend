import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import errorHandler from "./middlewares/errorHandler.js";
import testRoutes from "./routes/testRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utils/swagger.js"; // 경로 확인
import passport from "passport";
import "./config/passport.js"; // 위에 만든 passport 설정 파일 import

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 공통 응답 헬퍼 등록
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

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger UI 경로 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(passport.initialize()); // passport 초기화

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/test", testRoutes); // 테스트 라우트 연결

// 전역 오류 처리 미들웨어
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

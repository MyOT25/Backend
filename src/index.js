import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from './config/swagger.js';
import testRouter from './controllers/test.controller.js'; // 변경된 경로
import userRouter from './controllers/user.controller.js'; // (있다면 추가)
import errorHandler from './middlewares/errorHandler.js';
// import testRouter from "./controllers/testController.js"; // 변경된 경로
// import userRouter from "./controllers/userController.js"; // (있다면 추가)

import questionRouter from './controllers/question.controllers.js';
import communityRouter from './controllers/community.controller.js';

import postRouter from './controllers/post.controller.js';

import { getTabs } from './controllers/tab.controller.js';
import { getActor } from './controllers/actor.controller.js';

import './config/passport.js'; // passport 설정

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 공통 응답 헬퍼 등록
app.use((req, res, next) => {
  res.success = (success) => {
    return res.json({ resultType: 'SUCCESS', error: null, success });
  };

  res.error = ({ errorCode = 'unknown', reason = null, data = null }) => {
    return res.json({
      resultType: 'FAIL',
      error: { errorCode, reason, data },
      success: null,
    });
  };

  next();
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());

// Swagger 문서
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 라우터 연결 (controllers에서 라우터 export하는 구조)
app.use('/api/test', testRouter);
app.use('/api/user', userRouter); // 필요에 따라 추가

// 탭 목록 조회 API
app.get('/api/communities/:communityId/tabs', getTabs);

// 배우 정보 받아오기 API
app.get('/api/communities/:communityId/actor', getActor);

app.use('/api/questions', questionRouter);
// app.use("/api/test", testRouter);
// app.use("/api/user", userRouter); // 필요에 따라 추가
app.use('/api/community', communityRouter);
app.use('/api/posts', postRouter);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Hello MyOT!');
});

// 공통 예외 처리 미들웨어
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

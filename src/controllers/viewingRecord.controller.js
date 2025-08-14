import { authenticateJWT } from "../middlewares/authMiddleware.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { getTicketbook,getMonthlySummary as getMonthlySummaryService,
  createViewingRecord
 } from "../services/viewingRecord.service.js"; // 기존 getTicketbook 재사용
 import { uploadToS3 } from "../middlewares/s3Uploader.js";



/**
 * GET /api/viewingrecords/ticketbook
 * @desc 나의 티켓북 조회
 */
/**
 * @swagger
 * /api/Viewingrecords/ticketbook:
 *   get:
 *     summary: 나의 티켓북 조회
 *     description: JWT 인증을 통해 사용자의 티켓북 데이터를 조회합니다.
 *     tags:
 *       - ViewingRecord
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 티켓북 조회 성공
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           musical_id:
 *                             type: integer
 *                             example: 12
 *                           title:
 *                             type: string
 *                             example: 엘리자벳
 *                           poster:
 *                             type: string
 *                             example: https://example.com/poster1.jpg
 *                           watch_date:
 *                             type: string
 *                             format: date
 *                             example: 2025-05-15
 *                           theater:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: 서울 예술의 전당
 *                               region:
 *                                 type: string
 *                                 example: 서울
 */
export const getUserTicketbookWatchingRecords = [
  authenticateJWT,
  asyncHandler(async (req, res) => {
    // JWT payload 구조 맞춰서 userId 꺼내기
    const userId = Number(req.user.id);
    console.log("API 진입, req.user:", req.user); 
    console.log("🎯 /watchingrecords/ticketbook → userId:", userId);

    if (!userId) {
        throw new Error("userId가 JWT에서 추출되지 않았습니다.");
      }

    const records = await getTicketbook(userId);

    res.success({
      message: "티켓북 조회 성공",
      data: records,
    });
  }),
];

/**
 * 월별 정산판 조회
 * GET /api/viewingrecords/monthly-summary?year=YYYY&month=MM
 */
/**
 * @swagger
 * /api/viewingrecords/monthly-summary:
 *   get:
 *     summary: 월별 정산판 조회
 *     description: 지정한 연도와 월에 대한 사용자의 월별 정산 데이터를 조회합니다. JWT 인증 필요.
 *     tags:
 *       - ViewingRecord
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 연도 (YYYY 형식)
 *         example: 2025
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 월 (MM 형식)
 *         example: 06
 *     responses:
 *       200:
 *         description: 월별 정산판 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "2025년 6월 월별 정산판 조회 성공"
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: "관람"
 *                           total:
 *                             type: number
 *                             example: 150000
 *                           count:
 *                             type: integer
 *                             example: 3
 */
export const getMonthlySummary = async (req, res, next) => {


  try {
    const { year, month } = req.query;

    if (!year || !month) {
      throw new Error("year와 month는 필수입니다.");
    }

    const userId = req.user?.id || 1; // 임시 userId

    // ⬇️ 수정: userId도 같이 넘김
    const data = await getMonthlySummaryService(
      userId,
      parseInt(year, 10),
      parseInt(month, 10)
    );

    res.status(200).json({
      resultType: "SUCCESS",
      error: {
        errorCode: null,
        reason: null,
        data: null,
      },
      success: {
        message: `${year}년 ${month}월 월별 정산판 조회 성공`,
        data,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/viewingrecords
 * @desc 관극 기록 등록
 * @access Private (JWT 필요)
 */

/**
 * @swagger
 * /api/viewingrecords/musical:
 *   post:
 *     tags:
 *       - ViewingRecord
 *     summary: 오늘의 관극 기록 등록
 *     description: 관극 기록(관람일, 좌석, 배우, 사진 등)을 등록하는 API입니다. 이미지 파일은 multipart/form-data 형식으로 업로드합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               musicalId:
 *                 type: integer
 *                 example: 1
 *               watchDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-12"
 *               watchTime:
 *                 type: string
 *                 example: "19:30"
 *               seat:
 *                 type: string
 *                 example: '{"theaterId":2,"floor":1,"zone":"가구역","rowNumber":"2","columnNumber":3}'
 *               casts:
 *                 type: string
 *                 example: '[{"actorId":1,"role":"루케니"},{"actorId":2,"role":"엘리자벳"}]'
 *               content:
 *                 type: string
 *                 example: "또봤다!"
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 5
 *               imageFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 여러 이미지 파일 첨부
 *     responses:
 *       200:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "관극 기록이 성공적으로 등록되었습니다."
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         userId:
 *                           type: integer
 *                           example: 1
 *                         musicalId:
 *                           type: integer
 *                           example: 1
 *                         seatId:
 *                           type: integer
 *                           example: 1
 *                         date:
 *                           type: string
 *                           format: date
 *                           example: "2025-07-12"
 *                         time:
 *                           type: string
 *                           format: time
 *                           example: "19:30"
 *                         content:
 *                           type: string
 *                           example: "또봤다!"
 *                         rating:
 *                           type: number
 *                           format: float
 *                           example: 5
 *                         images:
 *                           type: array
 *                           items:
 *                             type: string
 *                             format: url
 *                           example:
 *                             - "https://bucket.s3.amazonaws.com/img1.jpg"
 *                             - "https://bucket.s3.amazonaws.com/img2.jpg"
 */
export const createViewingPost = asyncHandler(async (req, res) => {
  const userId = req.user.id; // JWT로부터 유저 ID 추출

  // ✅ multer로 업로드된 이미지 파일들
  const imageFiles = req.files; // 배열 형태

  // ✅ S3 업로드
  let imageUrls = [];

  if (imageFiles && imageFiles.length > 0) {
    imageUrls = await Promise.all(
      imageFiles.map((file) =>
        uploadToS3(file.buffer, file.originalname, file.mimetype)
      )
    );
  }

  // ✅ body에서 다른 데이터 추출
  const { musicalId, watchDate, watchTime, seat, casts, content, rating } =
    req.body;

  // ✅ JSON 문자열 데이터 파싱
  const parsedSeat = JSON.parse(seat);
  const parsedCasts = JSON.parse(casts);

  const result = await createViewingRecord(userId, {
    musicalId: parseInt(musicalId),
    watchDate,
    watchTime,
    seat: parsedSeat,
    casts: parsedCasts,
    content,
    rating: parseFloat(rating),
    imageUrls, // S3 업로드된 URL 배열
  });

  res.success({
    message: "관극 기록이 성공적으로 등록되었습니다.",
    data: result,
  });
});

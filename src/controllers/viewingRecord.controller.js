import { authenticateJWT } from "../middlewares/authMiddleware.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { getTicketbook,getMonthlySummary as getMonthlySummaryService,
  createViewingRecord, getMusicalCastGroupedByRole
 } from "../services/viewingRecord.service.js"; // 기존 getTicketbook 재사용
 import { uploadToS3 } from "../middlewares/s3Uploader.js";
 import prisma from "../config/prismaClient.js";

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
 *                 nullable: true
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
 *         description: 관극 기록 등록 성공
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
  const userId = req.user?.id;
  if (!userId) {
    return res.error({
      statusCode: 401,
      errorCode: "A001",
      reason: "인증이 필요합니다.",
      data: null,
    });
  }

  // 1) 파일 업로드(S3)
  const imageFiles = Array.isArray(req.files) ? req.files : [];
  let imageUrls = [];
  if (imageFiles.length > 0) {
    imageUrls = await Promise.all(
      imageFiles.map((file) =>
        uploadToS3(file.buffer, file.originalname, file.mimetype)
      )
    );
  }

  // 2) body 추출 
  const {
    musicalId: _musicalId,
    watchDate,
    watchTime,
    seat: _seat,
    castingIds: _castingIds, // 추가 
    content,
    rating: _rating,
  } = req.body ?? {};

  // 3) 기본 검증
  if (!_musicalId) {
    return res.error({ statusCode: 400, errorCode: "V001", reason: "musicalId가 필요합니다.", data: null });
  }
  if (!watchDate || !watchTime) {
    return res.error({ statusCode: 400, errorCode: "V002", reason: "watchDate, watchTime이 필요합니다.", data: null });
  }
  if (!_seat) {
    return res.error({ statusCode: 400, errorCode: "V003", reason: "seat 정보가 필요합니다.", data: null });
  }

  // 4) 타입 변환/파싱
  const musicalId = Number.parseInt(_musicalId, 10);
  if (!Number.isInteger(musicalId)) {
    return res.error({ statusCode: 400, errorCode: "V004", reason: "musicalId는 정수여야 합니다.", data: null });
  }

  const rating =
    _rating === undefined || _rating === null || `${_rating}`.trim() === ""
      ? undefined
      : Number.parseFloat(_rating);
  if (rating !== undefined && (Number.isNaN(rating) || rating < 0)) {
    return res.error({ statusCode: 400, errorCode: "V005", reason: "rating 형식이 올바르지 않습니다.", data: null });
  }

  let parsedSeat;
  try {
    parsedSeat = typeof _seat === "string" ? JSON.parse(_seat) : _seat;
  } catch {
    return res.error({ statusCode: 400, errorCode: "V006", reason: "seat JSON 파싱에 실패했습니다.", data: null });
  }

   // 🎯 castingIds 파싱
   let castingIds = [];
    try {
    if (typeof _castingIds === "string") {
      // "[1,2,3]" 같은 문자열을 배열로
      castingIds = JSON.parse(_castingIds);
    } else if (Array.isArray(_castingIds)) {
      // form-data에서 같은 키 여러 번 전달된 경우
      castingIds = _castingIds;
    }

    if (!Array.isArray(castingIds)) castingIds = [];
    castingIds = castingIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));
  } catch {
    castingIds = [];
  }

  // 5) 서비스 호출(casts 전달 없음)
  const result = await createViewingRecord(userId, {
    musicalId,
    watchDate,
    watchTime,
    seat: parsedSeat,
    castingIds, // 추가 
    content,
    rating,      // number | undefined
    imageUrls,   // S3 URL[]
  });

  return res.success({
    message: "관극 기록이 성공적으로 등록되었습니다.",
    data: result, // averageRating 포함
  });
});


/**
 * 역할별 출연진 목록 조회
 */
export const getMusicalCast = asyncHandler(async (req, res) => {
  const { musicalId } = req.params;
  const { order = "asc" } = req.query;

  if (!Number.isInteger(Number(musicalId))) {
    return res.error({
      statusCode: 400,
      errorCode: "V_MUSICAL_ID",
      reason: "musicalId는 정수여야 합니다.",
      data: null,
    });
  }

  const data = await getMusicalCastGroupedByRole(musicalId, order);

  return res.success({
    message: "역할별 출연진 목록 조회 성공",
    data,
  });
});

/**
 * 오늘의 관극 단건 조회
 * 
 */
/**
 * @swagger
 * /api/viewingrecords/{id}:
 *   get:
 *     summary: 관극 기록 단건 조회
 *     description: 로그인한 사용자가 특정 관극 기록을 조회합니다. 본인뿐만 아니라 다른 사용자의 기록도 조회 가능합니다.
 *     tags: [ViewingRecord]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 관극 기록 ID
 *         example: 10
 *     responses:
 *       200:
 *         description: 관극 기록 조회 성공
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
 *                       example: 관극 기록 조회 성공
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         musicalId:
 *                           type: integer
 *                           example: 2
 *                         musicalTitle:
 *                           type: string
 *                           example: 레미제라블
 *                         seat:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             theaterId: { type: integer, example: 1 }
 *                             floor: { type: integer, example: 2 }
 *                             zone: { type: string, example: "A" }
 *                             rowNumber: { type: string, example: "12" }
 *                             columnNumber: { type: integer, nullable: true, example: 5 }
 *                         content:
 *                           type: string
 *                           example: 정말 감동적인 공연이었어요!
 *                         rating:
 *                           type: number
 *                           nullable: true
 *                           example: 4.5
 *                         averageRating:
 *                           type: number
 *                           nullable: true
 *                           example: 4.2
 *                         casting:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               castingId: { type: integer, example: 3 }
 *                               role: { type: string, example: 주연 }
 *                               actorName: { type: string, example: 홍길동 }
 *                         images:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example:
 *                             - "https://s3.bucket/viewing/123.jpg"
 *                             - "https://s3.bucket/viewing/124.jpg"
 *                         date:
 *                           type: string
 *                           format: date
 *                           example: 2025-08-21
 *                         time:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-08-21T19:30:00.000Z
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-08-21T12:00:00.000Z
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-08-21T12:05:00.000Z
 *                         author:
 *                           type: object
 *                           properties:
 *                             nickname: { type: string, example: 뮤지컬러버 }
 *                             profileImage: { type: string, example: "https://s3.bucket/profile/1.jpg" }
 *                         isMine:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: 잘못된 요청 (id가 정수가 아님)
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 관극 기록 없음
 */

export const getViewingRecordPublicById = asyncHandler(async (req, res) => {
  const requesterId = req.user?.id;
  if (!requesterId) {
    return res.error({
      statusCode: 401,
      errorCode: "A001",
      reason: "인증이 필요합니다.",
      data: null,
    });
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.error({
      statusCode: 400,
      errorCode: "V007",
      reason: "id는 정수여야 합니다.",
      data: null,
    });
  }

  const vr = await prisma.viewingRecord.findUnique({
    where: { id },
    include: {
      seat: true, // Seat?
      images: {            // ViewingImage[]
        select: { url: true },
      },
      ViewingCasts: {      // ViewingCast[]
        include: {
          casting: {
            select: {
              id: true,
              role: true,
              actor: { select: { name: true } },
            },
          },
        },
      },
      musical: {           // Musical
        select: { name: true, ratingSum: true, ratingCount: true },
      },
      user: {              // User
        select: { nickname: true, profileImage: true },
      },
    },
  });

  if (!vr) {
    return res.error({
      statusCode: 404,
      errorCode: "V008",
      reason: "관극 기록을 찾을 수 없습니다.",
      data: null,
    });
  }

  const averageRating =
    vr.musical.ratingCount > 0
      ? Number(vr.musical.ratingSum) / vr.musical.ratingCount
      : null;

  return res.success({
    message: "관극 기록 조회 성공",
    data: {
      id: vr.id,
      musicalId: vr.musicalId,
      musicalTitle: vr.musical.name,
      seat: vr.seat
        ? {
            theaterId: vr.seat.theaterId,
            floor: vr.seat.floor,
            zone: vr.seat.zone,
            rowNumber: vr.seat.rowNumber,
            columnNumber: vr.seat.columnNumber,
          }
        : null,
      content: vr.content,
      // 스키마상 rating은 Int? 입니다.
      rating: vr.rating,
      averageRating,
      casting: vr.ViewingCasts.map((vc) => ({
        castingId: vc.castingId,
        role: vc.casting.role,
        actorName: vc.casting.actor.name,
      })),
      images: vr.images.map((i) => i.url),
      date: vr.date,
      time: vr.time,
      createdAt: vr.createdAt,
      updatedAt: vr.updatedAt,
      author: {
        nickname: vr.user.nickname,
        profileImage: vr.user.profileImage,
      },
      isMine: vr.userId === requesterId,
    },
  });
});

/**
 * 최근 관람한 관극 
 */
export const getMyLatestViewingSummary = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.error({
      statusCode: 401,
      errorCode: "A001",
      reason: "인증이 필요합니다.",
      data: null,
    });
  }

  // 가장 최근 관람 1건
  const latest = await prisma.viewingRecord.findFirst({
    where: { userId: Number(userId) },
    orderBy: [
      { date: "desc" },     // 관람일 최신
      { time: "desc" },     // 관람시간 최신
      { id: "desc" },       // 동률 방지
    ],
    select: {
      id: true,
      rating: true,            // 나의 별점
      date: true,
      time: true,
      musicalId: true,
      musical: {
        select: {
          name: true,          // 제목
          poster: true,        // 필요시 카드 이미지
          startDate: true,     // 공연기간 시작
          endDate: true,       // 공연기간 끝
          ratingSum: true,     // 평균 계산용
          ratingCount: true,
          theater: {           // 장소
            select: { name: true, region: true }
          },
          castings: {          // 배우 목록
            select: { 
              role: true,
              actor: { select: { name: true } }
            },
            orderBy: [{ role: "asc" }, { actor: { name: "asc" } }],
            take: 12,          // 카드엔 보통 8~12명만
          },
        },
      },
    },
  });

  if (!latest) {
    return res.success({
      message: "최근 관람 기록이 없습니다.",
      data: null,
    });
  }

  const m = latest.musical;
  const averageRating =
    m.ratingCount > 0 ? Number(m.ratingSum) / m.ratingCount : null;

  return res.success({
    message: "최근 관람 요약 조회 성공",
    data: {
      viewingId: latest.id,
      title: m.name,
      poster: m.poster ?? null,
      place: m.theater ? m.theater.name : null,                 // 장소
      region: m.theater ? m.theater.region : null,
      period: m.startDate && m.endDate
        ? `${m.startDate.toISOString().slice(0,10)} ~ ${m.endDate.toISOString().slice(0,10)}`
        : null,                                                 // 기간
      actors: m.castings.map(c => ({
        role: c.role,
        name: c.actor.name,
      })),                                                      // 배우 리스트
      averageRating,                                            // 평균 별점
      myRating: latest.rating ?? null,                          // 나의 별점 (Int?면 정수로 옴)
      watchedDate: latest.date,
      watchedTime: latest.time,
      musicalId: latest.musicalId,
    },
  });
});

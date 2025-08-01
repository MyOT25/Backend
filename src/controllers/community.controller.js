import express from "express";
import prisma from "../config/prismaClient.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import jwt from "jsonwebtoken";

import {
  handleJoinOrLeaveCommunity,
  handleCommunityRequest,
  fetchAvailableCommunities,
  fetchAllCommunities,
  fetchMyCommunities,
  fetchCommunityById,
  updateCommunityProfile,
  getRepostFeed,
  getMediaFeed,
  getPopularFeed,
  createCommunityProfileService,
  deleteCommunityProfile,
  getMyCommunityProfile,
  getOtherUserProfile,
  getMyProfileCount,
} from "../services/community.service.js";

import { checkUserInCommunity } from "../repositories/community.repository.js";

const router = express.Router();

/**
 * @swagger
 * /api/community:
 *   get:
 *     summary: 모든 커뮤니티 목록 조회
 *     description: 모든 커뮤니티를 조회하거나, type 쿼리 파라미터에 따라 특정 타입의 커뮤니티만 필터링하여 조회합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [musical, actor]
 *         description: 커뮤니티 타입 (musical 또는 actor). 없으면 전체 조회.
 *     responses:
 *       200:
 *         description: 커뮤니티 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 communities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       communityId:
 *                         type: integer
 *                         example: 1
 *                       communityName:
 *                         type: string
 *                         example: 오페라의 유령 팬모임
 *                       type:
 *                         type: string
 *                         example: MUSICAL
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-25T12:00:00.000Z"
 *       400:
 *         description: 잘못된 요청 또는 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 오류 메시지
 */

// 모든 커뮤니티 목록 보기
router.get("/", async (req, res) => {
  try {
    let { type } = req.query;
    type = type?.toLowerCase();

    //  type이 undefined이거나 빈 문자열일 경우 null 처리
    if (!type || typeof type !== "string" || type.trim() === "") {
      type = null;
    } else {
      type = type.toUpperCase(); // 2️⃣ 대소문자 정리
    }

    // 3️ enum 값으로 유효하지 않으면 type을 null 처리
    const allowedTypes = ["musical", "actor"];
    if (!allowedTypes.includes(type)) {
      type = null;
    }

    const communities = await fetchAllCommunities(type);

    const formatted = communities.map((c) => ({
      communityId: c.id,
      communityName: c.groupName,
      type: c.type,
      createdAt: c.createdAt,
    }));

    res.status(200).json({ success: true, communities: formatted });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/type/join:
 *   post:
 *     summary: 커뮤니티 가입 또는 탈퇴
 *     description: 로그인된 사용자가 특정 커뮤니티에 가입하거나 탈퇴합니다.
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []  # JWT 인증 필요
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - communityId
 *               - action
 *             properties:
 *               communityId:
 *                 type: integer
 *                 example: 3
 *               action:
 *                 type: string
 *                 enum: [join, leave]
 *                 example: join
 *     responses:
 *       200:
 *         description: 커뮤니티 가입 또는 탈퇴 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 가입이 완료되었습니다.
 *       400:
 *         description: 잘못된 요청 또는 처리 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: userId, communityId, action(join/leave)을 확인하세요.
 */

router.post("/type/join", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { communityId, action } = req.body;
    if (!userId || !communityId || !["join", "leave"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "userId, communityId, action(join/leave)을 확인하세요.",
      });
    }
    const message = await handleJoinOrLeaveCommunity(
      userId,
      communityId,
      action
    );
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/community/type/request:
 *   post:
 *     summary: 커뮤니티 생성 요청
 *     description: 사용자가 특정 타입의 커뮤니티(작품/배우)를 새로 요청(생성)합니다.
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []  # JWT 인증 필요
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - groupName
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [musical, actor]
 *                 example: musical
 *                 description: 커뮤니티 유형
 *               targetId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: actor 타입일 경우 대상 배우 ID (musical일 경우 null 가능)
 *               groupName:
 *                 type: string
 *                 example: "노트르담 드 파리 팬모임"
 *                 description: 생성할 커뮤니티의 이름
 *               musicalName:
 *                 type: string
 *                 example: "노트르담 드 파리"
 *               recentPerformanceDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-01"
 *               theaterName:
 *                 type: string
 *                 example: "블루스퀘어"
 *               ticketLink:
 *                 type: string
 *                 example: "https://ticketsite.com/show/123"
 *     responses:
 *       201:
 *         description: 커뮤니티 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 커뮤니티가 성공적으로 생성되었습니다.
 *                 community:
 *                   type: object
 *                   description: 생성된 커뮤니티 객체
 *       400:
 *         description: 요청 값 누락 또는 처리 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 유효한 커뮤니티 타입이 필요합니다.
 *       401:
 *         description: 인증 실패 (JWT 누락 또는 오류)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 토큰이 필요합니다.
 */

router.post("/type/request", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "토큰이 필요합니다." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    console.log("🔐 JWT_SECRET 값 확인:", process.env.JWT_SECRET);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "유효하지 않은 토큰입니다." });
    }

    const {
      type,
      targetId,
      groupName,
      musicalName,
      recentPerformanceDate,
      theaterName,
      ticketLink,
    } = req.body;

    if (!type || !["musical", "actor"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "유효한 커뮤니티 타입이 필요합니다.",
      });
    }
    if (!groupName) {
      return res
        .status(400)
        .json({ success: false, message: "커뮤니티 이름은 필수입니다." });
    }

    const community = await handleCommunityRequest({
      userId,
      type,
      targetId,
      groupName,
      musicalName,
      recentPerformanceDate,
      theaterName,
      ticketLink,
    });

    res.status(201).json({
      success: true,
      message: "커뮤니티가 성공적으로 생성되었습니다.",
      community,
    });
  } catch (err) {
    console.error("커뮤니티 신청 오류:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/type/{type}/{userId}:
 *   get:
 *     summary: 가입 가능한 커뮤니티 탐색 (로그인 유저 전용)
 *     description: 로그인한 사용자가 아직 가입하지 않은 커뮤니티 목록을 조회합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [musical, actor]
 *         description: 커뮤니티 타입 (musical 또는 actor)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 로그인한 유저의 ID
 *     responses:
 *       200:
 *         description: 가입 가능한 커뮤니티 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 communities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       communityId:
 *                         type: integer
 *                         example: 4
 *                       communityName:
 *                         type: string
 *                         example: "배우 홍길동 팬클럽"
 *                       type:
 *                         type: string
 *                         example: ACTOR
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-25T10:00:00.000Z"
 *       400:
 *         description: 잘못된 userId 또는 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 유효한 userId가 필요합니다.
 */

// 가입 가능한 커뮤니티 탐색(로그인 유저 전용)
router.get("/type/:type/:userId", async (req, res) => {
  try {
    const { type, userId } = req.params;
    if (isNaN(Number(userId))) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 userId가 필요합니다." });
    }

    const normalizedType = type.toLowerCase();

    const community = await fetchAvailableCommunities(
      normalizedType,
      Number(userId)
    );

    const formatted = community.map((c) => ({
      communityId: c.id,
      communityName: c.groupName,
      type: c.type,
      createdAt: c.createdAt,
    }));

    res.status(200).json({ success: true, communities: formatted });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/mine:
 *   get:
 *     summary: 내가 가입한 커뮤니티 목록 조회
 *     description: JWT 인증을 통해 현재 로그인한 사용자가 가입한 커뮤니티 목록을 반환합니다.
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []  # JWT 인증 필요
 *     responses:
 *       200:
 *         description: 가입한 커뮤니티 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 communities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       communityId:
 *                         type: integer
 *                         example: 5
 *                       communityName:
 *                         type: string
 *                         example: "레베카 팬모임"
 *                       type:
 *                         type: string
 *                         example: MUSICAL
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-20T18:30:00.000Z"
 *       401:
 *         description: 인증 실패 (JWT 누락 또는 유효하지 않음)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 로그인이 필요합니다.
 *       400:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 메시지
 */

// 내가 가입한 커뮤니티 목록 조회
router.get("/mine", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "로그인이 필요합니다." });
    }
    const communities = await fetchMyCommunities(userId);

    const formatted = communities.map((c) => ({
      communityId: c.id,
      communityName: c.groupName,
      type: c.type,
      createdAt: c.createdAt,
    }));
    res.status(200).json({ success: true, communities: formatted });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/profile/my/count:
 *   get:
 *     summary: 현재 등록된 내 커뮤니티 프로필 개수 확인
 *     description: JWT 인증을 통해 로그인한 사용자가 생성한 커뮤니티 프로필의 총 개수를 반환합니다.
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []  # JWT 인증 필요
 *     responses:
 *       200:
 *         description: 프로필 개수 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: 잘못된 요청 또는 유효하지 않은 토큰
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 토큰이 없습니다.
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 유효하지 않은 토큰입니다.
 */

// 현재 등록된 내 프로필 개수 확인
router.get("/profile/my/count", authenticateJWT, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(400)
        .json({ success: false, message: "토큰이 없습니다." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(400)({ success: false, message: "유효하지 않습니다." });
    }
    const count = await getMyProfileCount(userId);
    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/profile/my/{communityId}:
 *   get:
 *     summary: 특정 커뮤니티에서 내 프로필 조회
 *     description: JWT 인증을 통해 로그인한 사용자가 특정 커뮤니티에서 설정한 자신의 프로필 정보를 조회합니다.
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []  # JWT 인증 필요
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *     responses:
 *       200:
 *         description: 내 프로필 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nickname:
 *                       type: string
 *                       example: "뮤덕이"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *                     bio:
 *                       type: string
 *                       example: "배우님 덕질하는 중"
 *                     communityId:
 *                       type: integer
 *                       example: 3
 *                     userId:
 *                       type: integer
 *                       example: 7
 *       400:
 *         description: 잘못된 요청 (communityId가 숫자가 아님 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 유효한 요청입니다.
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 커뮤니티에서 프로필 가져오기에 실패햇습니다.
 */

// 해당 커뮤니티에 설정한 내 프로필 조회
router.get("/profile/my/:communityId", authenticateJWT, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user?.id;

    if (!userId || isNaN(communityId)) {
      return res
        .status(400)
        .json({ success: false, messgae: "유효한 요청입니다." });
    }
    const profile = await getMyCommunityProfile(userId, parseInt(communityId));
    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("getMyCommunityProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "커뮤니티에서 프로필 가져오기에 실패햇습니다.",
    });
  }
});

/**
 * @swagger
 * /api/community/{type}/{id}:
 *   get:
 *     summary: 커뮤니티 상세 정보 조회
 *     description: 커뮤니티 타입과 ID를 기반으로 해당 커뮤니티의 상세 정보를 반환합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [musical, actor]
 *         description: 커뮤니티 타입
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *     responses:
 *       200:
 *         description: 커뮤니티 상세 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 community:
 *                   type: object
 *                   properties:
 *                     communityId:
 *                       type: integer
 *                       example: 5
 *                     groupName:
 *                       type: string
 *                       example: "팬텀싱어 팬모임"
 *                     type:
 *                       type: string
 *                       example: musical
 *                     targetId:
 *                       type: integer
 *                       example: null
 *                     musicalName:
 *                       type: string
 *                       example: "팬텀싱어"
 *                     recentPerformanceDate:
 *                       type: string
 *                       format: date
 *                       example: "2025-06-10"
 *                     theaterName:
 *                       type: string
 *                       example: "예술의전당 오페라극장"
 *                     ticketLink:
 *                       type: string
 *                       example: "https://ticketlink.com/show/phantomsinger"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-20T15:00:00.000Z"
 *                     coverImage:
 *                       type: string
 *                       example: "https://yourcdn.com/images/cover.jpg"
 *       400:
 *         description: 잘못된 타입 등 유효하지 않은 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "유효하지 않은 커뮤니티 타입입니다."
 *       404:
 *         description: 커뮤니티를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "커뮤니티를 찾을 수 없습니다."
 */

router.get("/:type/:id", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const { type } = req.params;

    if (!["musical", "actor"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 커뮤니티 타입입니다.",
      });
    }

    const community = await fetchCommunityById(communityId);
    if (!community || community.type !== type) {
      return res
        .status(404)
        .json({ success: false, message: "커뮤니티를 찾을 수 없습니다." });
    }

    const formatted = {
      communityId: community.id,
      groupName: community.groupName,
      type: community.type,
      targetId: community.targetId,
      recentPerformanceDate: community.recentPerformanceDate,
      theaterName: community.theaterName,
      ticketLink: community.ticketLink,
      createdAt: community.createdAt,
      coverImage: community.coverImage,
    };

    if (community.type === "musical") {
      formatted.musicalName = community.musicalName;
    } else if (community.type === "actor") {
      formatted.actorName = community.actorName || community.groupName;
    }

    res.status(200).json({ success: true, community: formatted });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/profile:
 *   post:
 *     summary: 커뮤니티 프로필 생성
 *     description: 사용자가 특정 커뮤니티에 사용할 프로필을 생성합니다.
 *     tags:
 *       - Community
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - communityId
 *               - nickname
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 7
 *               communityId:
 *                 type: integer
 *                 example: 3
 *               nickname:
 *                 type: string
 *                 example: "뮤지컬덕후"
 *               image:
 *                 type: string
 *                 example: "https://example.com/image.png"
 *               bio:
 *                 type: string
 *                 example: "좋아하는 배우 덕질 중"
 *     responses:
 *       201:
 *         description: 커뮤니티 프로필 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 커뮤니티 프로필이 생성되었습니다.
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12
 *                     userId:
 *                       type: integer
 *                       example: 7
 *                     communityId:
 *                       type: integer
 *                       example: 3
 *                     nickname:
 *                       type: string
 *                       example: "뮤지컬덕후"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/image.png"
 *                     bio:
 *                       type: string
 *                       example: "좋아하는 배우 덕질 중"
 *       400:
 *         description: 필수 항목 누락
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: userId, communityId, nickname은 필수입니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 내부 서버 오류
 */

// 커뮤니티 프로필 추가
router.post("/profile", async (req, res) => {
  try {
    const { userId, communityId, nickname, image, bio } = req.body;

    if (!userId || !communityId || !nickname) {
      return res.status(400).json({
        success: false,
        message: "userId, communityId, nickname은 필수입니다.",
      });
    }

    const profile = await createCommunityProfileService({
      userId,
      communityId,
      nickname,
      image,
      bio,
    });

    res.status(201).json({
      success: true,
      message: "커뮤니티 프로필이 생성되었습니다.",
      profile,
    });
  } catch (err) {
    console.error("커뮤니티 프로필 추가 오류:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/profile/{id}:
 *   patch:
 *     summary: 커뮤니티 프로필 수정
 *     description: 기존에 생성된 커뮤니티 프로필의 닉네임, 이미지, 자기소개를 수정합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 수정할 커뮤니티 프로필의 ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *                 example: "뮤지컬찐팬"
 *               image:
 *                 type: string
 *                 example: "https://example.com/new-image.png"
 *               bio:
 *                 type: string
 *                 example: "요즘은 '레베카'에 푹 빠졌어요"
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 communityId:
 *                   type: integer
 *                   example: 3
 *                 message:
 *                   type: string
 *                   example: 커뮤니티 프로필이 수정되었습니다.
 *       400:
 *         description: 필수 항목 누락 또는 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 닉네임은 필수입니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 커뮤니티 프로필 수정 실패
 */

// 커뮤니티 프로필 수정하기
router.patch("/profile/:id", async (req, res) => {
  try {
    const profileId = Number(req.params.id);
    const { nickname, image, bio } = req.body;

    if (!nickname) {
      return res
        .status(400)
        .json({ success: false, message: "닉네임은 필수입니다." });
    }

    const updatedProfile = await updateCommunityProfile(profileId, {
      nickname,
      image,
      bio,
    });
    res.status(200).json({
      success: true,
      communityId: updatedProfile.id,
      message: "커뮤니티 프로필이 수정되었습니다.",
    });
  } catch (err) {
    console.error("커뮤니티 프로필 수정 실패:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * @swagger
 * /api/community/profile/{id}:
 *   delete:
 *     summary: 커뮤니티 프로필 삭제
 *     description: 특정 커뮤니티 프로필 ID를 기반으로 프로필을 삭제합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 삭제할 커뮤니티 프로필의 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 커뮤니티 프로필 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 커뮤니티 프로필이 삭제되었습니다
 *                 deletedProfile:
 *                   type: object
 *                   description: 삭제된 프로필 객체
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     userId:
 *                       type: integer
 *                       example: 7
 *                     communityId:
 *                       type: integer
 *                       example: 2
 *                     nickname:
 *                       type: string
 *                       example: "지킬앤하이드찐팬"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/image.png"
 *                     bio:
 *                       type: string
 *                       example: "소름 돋는 넘버 좋아함"
 *       400:
 *         description: 유효하지 않은 프로필 ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 유효한 프로필 ID가 필요합니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 커뮤니티 프로필 삭제 실패
 */

// 커뮤니티 프로필 삭제하기
router.delete("/profile/:id", async (req, res) => {
  try {
    const profileId = Number(req.params.id);

    if (isNaN(profileId)) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 프로필 ID가 필요합니다." });
    }
    const deletedProfile = await deleteCommunityProfile(profileId);

    res.status(200).json({
      success: true,
      message: "커뮤니티 프로필이 삭제되었습니다",
      deletedProfile,
    });
  } catch (err) {
    console.error("커뮤니티 프로필 삭제 실패:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/{id}/feed/reposts:
 *   get:
 *     summary: 커뮤니티 리포스트 피드 조회
 *     description: 해당 커뮤니티에서 다른 커뮤니티의 글을 인용한 피드(리포스트)만 필터링하여 조회합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 커뮤니티 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 리포스트 피드 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 feed:
 *                   type: array
 *                   description: 리포스트 피드 목록
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: integer
 *                         example: 10
 *                       originalCommunityId:
 *                         type: integer
 *                         example: 2
 *                       originalPostTitle:
 *                         type: string
 *                         example: "레베카 공연 후기 인용"
 *                       repostedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-25T15:00:00.000Z"
 *                       content:
 *                         type: string
 *                         example: "진짜 좋았던 배우의 연기를 소개합니다."
 *                       author:
 *                         type: string
 *                         example: "뮤덕이"
 *       400:
 *         description: 커뮤니티 ID가 유효하지 않거나 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 메시지
 */

// 커뮤니티 내 피드 다른 커뮤니티로 인용
//현재 커뮤니티의 피드 중, '다른 커뮤니티의 글을 인용한 글(repost)'만 보여줌
router.get("/:id/feed/reposts", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const feed = await getRepostFeed(communityId);
    res.status(200).json({ success: true, feed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/{id}/feed/media:
 *   get:
 *     summary: 커뮤니티 미디어 피드 조회
 *     description: 해당 커뮤니티의 게시글 중 이미지나 영상 등의 미디어가 포함된 피드만 조회합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 커뮤니티 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 미디어 피드 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 feed:
 *                   type: array
 *                   description: 미디어 피드 목록
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: integer
 *                         example: 15
 *                       title:
 *                         type: string
 *                         example: "지킬앤하이드 커튼콜 영상 공유"
 *                       content:
 *                         type: string
 *                         example: "커튼콜 장면이 너무 멋져서 공유해요!"
 *                       mediaUrls:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["https://example.com/image1.jpg", "https://example.com/video1.mp4"]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-25T16:20:00.000Z"
 *                       author:
 *                         type: string
 *                         example: "뮤지컬덕후"
 *       400:
 *         description: 커뮤니티 ID가 유효하지 않거나 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 메시지
 */

//커뮤니티 내 미디어가 있는 피드만 필터링 할 수 있는 탭
router.get("/:id/feed/media", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const feed = await getMediaFeed(communityId);
    res.status(200).json({ success: true, feed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/{id}/feed/popular:
 *   get:
 *     summary: 커뮤니티 인기 피드 조회
 *     description: 해당 커뮤니티에서 최근 인기 있는 게시글(좋아요 수 기준)을 조회합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 커뮤니티 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 인기 피드 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 feed:
 *                   type: array
 *                   description: 인기 피드 목록
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: integer
 *                         example: 21
 *                       title:
 *                         type: string
 *                         example: "요즘 가장 핫한 배우 후기🔥"
 *                       content:
 *                         type: string
 *                         example: "이번 공연에서 정말 눈에 띄었던 배우 후기입니다."
 *                       likes:
 *                         type: integer
 *                         example: 128
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-24T14:00:00.000Z"
 *                       author:
 *                         type: string
 *                         example: "뮤덕이"
 *       400:
 *         description: 커뮤니티 ID가 유효하지 않거나 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 메시지
 */

// 요즘 인기글만 볼 수 있는 피드
router.get("/:id/feed/popular", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const feed = await getPopularFeed(communityId);
    res.status(200).json({ success: true, feed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/user-profile/{communityId}/{userId}:
 *   get:
 *     summary: 특정 유저의 커뮤니티 프로필 조회
 *     description: 지정된 유저가 해당 커뮤니티에 설정한 프로필 정보를 반환합니다.
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 유저 ID
 *     responses:
 *       200:
 *         description: 유저의 커뮤니티 프로필 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     userId:
 *                       type: integer
 *                       example: 5
 *                     communityId:
 *                       type: integer
 *                       example: 3
 *                     nickname:
 *                       type: string
 *                       example: "배우찐팬"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/user-image.jpg"
 *                     bio:
 *                       type: string
 *                       example: "이 배우님은 진심입니다."
 *       400:
 *         description: 잘못된 ID 또는 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 메시지
 */

// 특정 유저의 해당 커뮤니티 프로필 조회

router.get("/user-profile/:communityId/:userId", async (req, res) => {
  try {
    const communityId = Number(req.params.communityId);
    const userId = Number(req.params.userId);
    const profile = await getOtherUserProfile(communityId, userId);
    res.status(200).json({ success: true, profile });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

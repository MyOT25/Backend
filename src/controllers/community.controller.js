import express from "express";
import prisma from "../config/prismaClient.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import jwt from "jsonwebtoken";
//import { authenticateOptional } from "../middlewares/authOptional.js";

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
  switchCommunityProfileType,
  getCommunityFeedAll,
} from "../services/community.service.js";

import { checkUserInCommunity } from "../repositories/community.repository.js";

const router = express.Router();

/**
 * @swagger
 * /api/community/{id}/feed:
 *   get:
 *     summary: 커뮤니티 전체 피드 조회 (원본+리포스트)
 *     description: 해당 커뮤니티에서 작성된 모든 게시글을 최신순으로 조회합니다. 커서 기반 페이지네이션 지원.
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 커뮤니티 ID
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: cursor
 *         schema: { type: integer }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: 전체 피드 조회 성공
 *       400:
 *         description: 잘못된 요청
 */

router.get("/:id/feed", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    if (Number.isNaN(communityId)) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 커뮤니티 ID가 필요합니다." });
    }

    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const order = (req.query.order || "desc").toString().toLowerCase();

    const { items, nextCursor } = await getCommunityFeedAll(communityId, {
      limit,
      cursor,
      order,
    });
    return res.status(200).json({ success: true, feed: items, nextCursor });
  } catch (err) {
    console.error("getCommunityFeedAll error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community:
 *   get:
 *     summary: 모든 커뮤니티 목록 조회
 *     description: 모든 커뮤니티를 조회하거나, type 쿼리 파라미터에 따라 특정 타입의 커뮤니티만 필터링하여 조회합니다.
 *     tags: [Community]
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
 *                 success: { type: boolean, example: true }
 *                 communities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       communityId: { type: integer, example: 1 }
 *                       communityName: { type: string, example: "오페라의 유령 팬모임" }
 *                       type: { type: string, example: "musical" }
 *                       createdAt: { type: string, format: date-time, example: "2025-07-25T12:00:00.000Z" }
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
 *     description: 로그인된 사용자가 특정 커뮤니티에 가입하거나 탈퇴합니다. 가입 시 프로필 타입(BASIC/MULTI) 선택 가능하며, MULTI 선택 시 멀티 프로필을 즉시 생성합니다.
 *     tags: [Community]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [communityId, action]
 *             properties:
 *               communityId: { type: integer, example: 3 }
 *               action:
 *                 type: string
 *                 enum: [join, leave]
 *                 example: join
 *               profileType:
 *                 type: string
 *                 description: 가입 시 사용할 프로필 타입 (join일 때만 사용)
 *                 enum: [BASIC, MULTI]
 *                 example: BASIC
 *               multi:
 *                 type: object
 *                 nullable: true
 *                 description: profileType=MULTI일 때 생성할 멀티 프로필 정보
 *                 properties:
 *                   nickname: { type: string, example: "뮤지컬덕후" }
 *                   image: { type: string, nullable: true, example: "https://example.com/image.png" }
 *                   bio: { type: string, nullable: true, example: "배우 덕질은 삶의 활력" }
 *     responses:
 *       200:
 *         description: 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "커뮤니티 가입 완료" }
 *       400:
 *         description: 잘못된 요청 또는 처리 실패
 */

router.post("/type/join", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { communityId, action, profileType, multi } = req.body;
    if (!userId || !communityId || !["join", "leave"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "userId, communityId, action(join/leave)을 확인하세요.",
      });
    }
    const message = await handleJoinOrLeaveCommunity(
      userId,
      Number(communityId),
      action,
      profileType,
      multi
    );
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/community/profile/type/{communityId}:
 *   patch:
 *     summary: 커뮤니티 내 프로필 타입 전환 (BASIC ⇄ MULTI)
 *     description: BASIC → MULTI로 전환 시 한도 체크 후 멀티 생성, MULTI → BASIC 전환 시 기존 멀티 자동 삭제.
 *     tags: [Community]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema: { type: integer }
 *         description: 커뮤니티 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profileType]
 *             properties:
 *               profileType:
 *                 type: string
 *                 enum: [BASIC, MULTI]
 *                 example: MULTI
 *               multi:
 *                 type: object
 *                 nullable: true
 *                 description: MULTI 전환 시 생성할 멀티 프로필 정보
 *                 properties:
 *                   nickname: { type: string, example: "전환_닉" }
 *                   image: { type: string, nullable: true, example: null }
 *                   bio: { type: string, nullable: true, example: "전환하며 생성" }
 *     responses:
 *       200:
 *         description: 전환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "프로필 타입이 변경되었습니다." }
 *                 changedTo:
 *                   type: string
 *                   enum: [BASIC, MULTI]
 *                   example: MULTI
 *                 profile:
 *                   type: object
 *                   nullable: true
 *                   description: MULTI로 전환 시 생성된 멀티 프로필
 *                   properties:
 *                     id: { type: integer, example: 12 }
 *                     userId: { type: integer, example: 7 }
 *                     communityId: { type: integer, example: 3 }
 *                     nickname: { type: string, example: "전환_닉" }
 *                     image: { type: string, nullable: true, example: null }
 *                     bio: { type: string, nullable: true, example: "전환하며 생성" }
 *       400:
 *         description: 잘못된 요청 또는 한도 초과 등
 */

// 커뮤니티 가입 후 타입 전환/자동삭제 (커뮤니티별 프로필 타입 전환)
// 타입 전환: BASIC ⇄ MULTI
router.patch(
  "/profile/type/:communityId",
  authenticateJWT,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const communityId = Number(req.params.communityId);

      // 1) 바디 안전 분해
      const { profileType, multi } = req.body ?? {};

      // 2) 검증 (대소문자 무관)
      const normalized =
        typeof profileType === "string" ? profileType.toUpperCase() : undefined;

      if (!["BASIC", "MULTI"].includes(normalized)) {
        return res.status(400).json({
          success: false,
          message: "profileType must be BASIC or MULTI",
        });
      }
      if (!userId || Number.isNaN(communityId)) {
        return res
          .status(400)
          .json({ success: false, message: "유효하지 않은 요청입니다." });
      }

      // 3) 서비스 호출
      const result = await switchCommunityProfileType({
        userId,
        communityId,
        profileType: normalized,
        multi, // { nickname, image, bio } | undefined
      });

      return res.status(200).json({
        success: true,
        message: "프로필 타입이 변경되었습니다.",
        ...result,
      });
    } catch (err) {
      console.error("switch type error:", err);
      return res
        .status(400)
        .json({ success: false, message: err?.message ?? "변경 실패" });
    }
  }
);

/**
 * @swagger
 * /api/community/profile/me/{communityId}:
 *   patch:
 *     summary: 현재 선택된 타입(BASIC/MULTI)에 맞춰 내 프로필 내용 수정
 *     description: MULTI 사용 중이면 멀티 프로필을, BASIC 사용 중이면 User 기본 프로필을 수정합니다.
 *     tags: [Community]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: { type: string, example: "수정닉" }
 *               image: { type: string, nullable: true, example: null }
 *               bio: { type: string, nullable: true, example: "소개 수정" }
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "프로필이 수정되었습니다." }
 *                 profile:
 *                   type: object
 *                   description: 수정 후 프로필 스냅샷
 *                   properties:
 *                     id: { type: integer, example: 7 }
 *                     userId: { type: integer, example: 7 }
 *                     communityId: { type: integer, example: 3 }
 *                     nickname: { type: string, example: "수정닉" }
 *                     image: { type: string, nullable: true, example: null }
 *                     bio: { type: string, nullable: true, example: "소개 수정" }
 *       400:
 *         description: 잘못된 요청
 */

// 현재 선택된 타입 기준으로 내용만 수정 (닉네임/이미지/바이오)
router.patch("/profile/me/:communityId", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const communityId = Number(req.params.communityId);
    const { nickname, image, bio } = req.body;

    if (!userId || isNaN(communityId)) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 요청이 아닙니다." });
    }

    const result = await updateCommunityProfile({
      mode: "EDIT",
      userId,
      communityId,
      patch: { nickname, image, bio },
    });

    return res.status(200).json({
      success: true,
      message: "프로필이 수정되었습니다.",
      profile: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
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
 *     summary: 내 멀티 프로필 사용 현황
 *     description: 사용 중인 멀티 프로필 수 및 무료/유료 한도를 반환합니다.
 *     tags: [Community]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 used: { type: integer, example: 3 }
 *                 limit: { type: integer, nullable: true, example: 5, description: 유료면 null }
 *                 remain: { type: integer, nullable: true, example: 2, description: 유료면 null }
 *                 tier: { type: string, enum: [FREE, PAID], example: "FREE" }
 *       400:
 *         description: 토큰 누락/유효하지 않음
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
      return res
        .status(400)
        .json({ success: false, message: "유효하지 않습니다." });
    }
    const result = await getMyProfileCount(userId); // { used, isSubscribed }
    const limit = result.isSubscribed ? null : 5;
    const remain = result.isSubscribed ? null : Math.max(0, 5 - result.used);
    res.status(200).json({
      success: true,
      used: result.used,
      limit,
      remain,
      tier: result.isSubscribed ? "PAID" : "FREE",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/profile/my/{communityId}:
 *   get:
 *     summary: 특정 커뮤니티에서 내 프로필 조회
 *     description: 멀티 사용 중이면 멀티 값을, 아니면 기본 프로필(BASIC)을 반환합니다.
 *     tags: [Community]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 profileType: { type: string, enum: [BASIC, MULTI], example: "BASIC" }
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 7 }
 *                     userId: { type: integer, example: 7 }
 *                     communityId: { type: integer, example: 3 }
 *                     nickname: { type: string, example: "내기본닉" }
 *                     image: { type: string, nullable: true, example: "https://example.com/me.png" }
 *                     bio: { type: string, nullable: true, example: "자기소개" }
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 내부 오류
 */

// 해당 커뮤니티에 설정한 내 프로필 조회
router.get("/profile/my/:communityId", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const communityId = Number(req.params.communityId);
    if (!userId || Number.isNaN(communityId)) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 요청입니다." });
    }

    const { profileType, profile } = await getMyCommunityProfile(
      userId,
      communityId
    );
    return res.status(200).json({ success: true, profileType, profile });
  } catch (e) {
    console.error("getMyCommunityProfile error:", e);
    return res
      .status(500)
      .json({ success: false, message: "프로필 조회 실패" });
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
 *                   $ref: '#/components/schemas/CommunityDetail'
 *                 isJoined:
 *                   type: boolean
 *                   description: 요청에 사용자 토큰이 있을 때 계산됨. 없으면 false
 *                   example: true
 *                 joinedProfile:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     profileId:
 *                       type: integer
 *                       example: 12
 *                     nickname:
 *                       type: string
 *                       example: "뮤지컬덕후"
 *                     joinedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-25T02:04:45.000Z"
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

router.get("/:type/:id", authenticateJWT, async (req, res) => {
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

    const userId = req.user?.id;
    let joinedProfile = null;
    if (userId) {
      joinedProfile = await checkUserInCommunity(userId, communityId);
    }

    return res.status(200).json({
      success: true,
      community: formatted,
      isJoined: !!joinedProfile,
      joinedProfile: joinedProfile
        ? {
            profileId: joinedProfile.id,
            nickname: joinedProfile.nickname,
            joinedAt: joinedProfile.createdAt,
          }
        : null,
    });
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

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
 * /api/community/type/join:
 *   post:
 *     summary: 커뮤니티 가입 또는 탈퇴
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communityId:
 *                 type: integer
 *                 example: 1
 *               action:
 *                 type: string
 *                 enum: [join, leave]
 *                 example: join
 *     responses:
 *       200:
 *         description: 성공적으로 가입/탈퇴 처리됨
 *       400:
 *         description: 잘못된 요청
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
 *     tags:
 *       - Community
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [musical, actor]
 *                 example: musical
 *               targetId:
 *                 type: integer
 *                 example: 101
 *               groupName:
 *                 type: string
 *                 example: 뮤지컬 팬 모임
 *               musicalName:
 *                 type: string
 *                 example: 레미제라블
 *               recentPerformanceDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-06-15
 *               theaterName:
 *                 type: string
 *                 example: 샤롯데씨어터
 *               ticketLink:
 *                 type: string
 *                 example: https://ticket.com/lesmis
 *     responses:
 *       201:
 *         description: 커뮤니티 생성 성공
 *       400:
 *         description: 잘못된 요청 또는 실패
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
 * /api/community/{type}/{userId}:
 *   get:
 *     summary: 가입 가능한 커뮤니티 조회
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [musical, actor]
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 가입 가능한 커뮤니티 목록
 *       400:
 *         description: 잘못된 요청
 */

// 가입 가능한 커뮤니티 탐색(로그인 유저 전용)
router.get("/:type/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 userId가 필요합니다." });
    }
    const communities = await fetchAvailableCommunities(userId);

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
 * /api/community/:
 *   get:
 *     summary: 전체 커뮤니티 목록 조회
 *     tags:
 *       - Community
 *     responses:
 *       200:
 *         description: 커뮤니티 목록 반환
 *       400:
 *         description: 조회 실패
 */

// 모든 커뮤니티 목록 보기
router.get("/", async (req, res) => {
  try {
    const communities = await fetchAllCommunities();

    const formatted = communities.map((c) => ({
      communityId: c.id,
      communitiyName: c.groupName,
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
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 가입한 커뮤니티 목록 반환
 *       401:
 *         description: 인증 필요
 *       400:
 *         description: 조회 실패
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
 *     summary: 내가 등록한 커뮤니티 프로필 개수 조회
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 등록된 커뮤니티 프로필 수 반환
 *       401:
 *         description: 인증 필요
 *       400:
 *         description: 조회 실패
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
 *     summary: 내가 설정한 커뮤니티 프로필 조회
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *     responses:
 *       200:
 *         description: 내 프로필 반환
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
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
 *     summary: 커뮤니티 상세 조회
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [musical, actor]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *     responses:
 *       200:
 *         description: 커뮤니티 상세 반환
 *       400:
 *         description: 요청 실패
 *       404:
 *         description: 커뮤니티를 찾을 수 없음
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
      musicalName: community.musicalName,
      recentPerformanceDate: community.recentPerformanceDate,
      theaterName: community.theaterName,
      ticketLink: community.ticketLink,
      createdAt: community.createdAt,
    };

    res.status(200).json({ success: true, community: formatted });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/type/{id}/status:
 *   get:
 *     summary: 해당 커뮤니티 가입 여부 확인
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *     responses:
 *       200:
 *         description: 가입 여부 반환
 *       401:
 *         description: 인증 실패
 *       400:
 *         description: 요청 실패
 */

// 커뮤니티 가입 여부 조회
router.get("/type/:id/status", async (req, res) => {
  try {
    const userId = req.user?.id;
    const communityId = Number(req.params.id);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "로그인이 필요합니다." });
    }
    const isJoined = await checkUserInCommunity(userId, communityId);
    res.status(200).json({ success: true, isMember: isJoined });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/profile:
 *   post:
 *     summary: 커뮤니티 프로필 생성
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
 *                 example: 1
 *               communityId:
 *                 type: integer
 *                 example: 1
 *               nickname:
 *                 type: string
 *                 example: "열정팬"
 *               image:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               bio:
 *                 type: string
 *                 example: "뮤지컬을 사랑하는 팬입니다."
 *     responses:
 *       201:
 *         description: 커뮤니티 프로필 생성 완료
 *       400:
 *         description: 필수 정보 누락 또는 생성 실패
 *       500:
 *         description: 서버 오류
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
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 프로필 ID
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
 *                 example: "열정팬2"
 *               image:
 *                 type: string
 *                 example: "https://example.com/image2.jpg"
 *               bio:
 *                 type: string
 *                 example: "뮤지컬 덕후입니다."
 *     responses:
 *       200:
 *         description: 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
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
 *     tags:
 *       - Community
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 프로필 ID
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
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
 *     summary: 커뮤니티의 인용 피드 목록 조회
 *     tags:
 *       - Community Feed
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 커뮤니티 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 인용 피드 목록 반환
 *       400:
 *         description: 조회 실패
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
 *     summary: 커뮤니티의 미디어 피드 목록 조회
 *     tags:
 *       - Community Feed
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 커뮤니티 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 미디어 포함 피드 목록 반환
 *       400:
 *         description: 조회 실패
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
 *     summary: 커뮤니티의 인기 피드 목록 조회
 *     tags:
 *       - Community Feed
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 커뮤니티 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 인기 피드 목록 반환
 *       400:
 *         description: 조회 실패
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
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 유저의 프로필 반환
 *       400:
 *         description: 잘못된 요청
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

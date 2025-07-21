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
  addCommunityProfile,
  updateCommunityProfile,
} from "../services/community.service.js";

import { checkUserInCommunity } from "../repositories/community.repository.js";

const router = express.Router();

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

// 커뮤니티 프로필 추가
router.post("/profile", async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      profileImage,
      ticketLink,
      musicalName,
      theaterName,
      recentPerformanceDate,
    } = req.body;

    const profileData = {
      name,
      type,
      description,
      profileImage,
      ticketLink,
      musicalName,
      theaterName,
      recentPerformanceDate,
    };

    const newCommunity = await addCommunityProfile(profileData);

    res.status(200).json({
      success: true,
      communityId: newCommunity.id,
      message: "커뮤니티 프로필이 추가되었습니다.",
    });
  } catch (err) {
    console.error("커뮤니티 프로필 추가 실패:", err);
    console.log("req.body 확인 👉", req.body);

    res.status(500).json({
      success: false,
      message: "커뮤니티 프로필 추가 중 오류가 발생했습니다.",
    });
  }
});

// 커뮤니티 프로필 수정하기
router.put("/profile/:id", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const {
      name,
      type,
      description,
      profileImage,
      ticketLink,
      musicalName,
      theaterName,
      recentPerformanceDate,
    } = req.body;

    const profileData = {
      name,
      type,
      description,
      profileImage,
      ticketLink,
      musicalName,
      theaterName,
      recentPerformanceDate,
    };

    const updated = await updateCommunityProfile(communityId, profileData);
    res.status(200).json({
      success: true,
      communityId: updated.id,
      message: "커뮤니티 프로필이 수정되었습니다.",
    });
  } catch (err) {
    console.error("커뮤니티 프로필 수정 실패:", err);
    res.status(500).json({
      success: false,
      message: "커뮤니티 프로필 수정 중 오류가 발생했습니다.",
    });
  }
});
export default router;

import express from "express";
import prisma from "../config/prismaClient.js";

import {
  handleJoinOrLeaveCommunity,
  handleCommunityRequest,
  fetchAvailableCommunities,
  fetchAllCommunities,
} from "../services/community.service.js";

const router = express.Router();

router.post("/type/join", async (req, res) => {
  try {
    const { userId, communityId, action } = req.body;
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

router.post("/request", async (req, res) => {
  try {
    const {
      userId,
      name,
      description,
      type,
      musicalName,
      recentPerformanceDate,
      theaterName,
      ticketLink,
    } = req.body;
    const message = await handleCommunityRequest({
      userId,
      name,
      description,
      type,
      musicalName,
      recentPerformanceDate,
      theaterName,
      ticketLink,
    });
    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 가입 가능한 커뮤니티 탐색(로그인 유저 전용)
router.get("/type/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const communities = await fetchAvailableCommunities(userId);

    const formatted = communities.map((c) => ({
      communityId: c.id,
      communityName: c.name,
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
      communitiyName: c.name,
      type: c.type,
      createdAt: c.createdAt,
    }));

    res.status(200).json({ success: true, communities: formatted });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/list", async (req, res) => {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        //name: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });

    const formatted = communities.map((c) => ({
      communityId: c.id,
      communityName: "작품",
      type: c.type,
      createdAt: c.createdAt,
    }));

    res.status(200).json({ success: true, communities });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

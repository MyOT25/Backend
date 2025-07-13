import express from "express";
import prisma from "../config/prismaClient.js";

import {
  handleJoinOrLeaveCommunity,
  handleCommunityRequest,
  fetchAvailableCommunities,
} from "../services/community.service.js";

const router = express.Router();

router.post("/work/join", async (req, res) => {
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

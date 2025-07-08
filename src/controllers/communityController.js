import express from "express";
import prisma from "../../prisma/client.js";

import {
  handleJoinOrLeaveCommunity,
  handleCommunityRequest,
  fetchAvailableCommunities,
} from "../services/communityService.js";

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
    const { userId, name, description, type, requestedAt } = req.body;
    const message = await handleCommunityRequest({
      userId,
      name,
      description,
      type,
      requestedAt,
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
        name: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });

    res.status(200).json({ success: true, communities });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

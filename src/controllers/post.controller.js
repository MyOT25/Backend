import {
  getTicketbook,
  getMonthlySummary as getMonthlySummaryService,
} from "../services/post.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import prisma from "../config/prismaClient.js";
// import prisma from "../../prisma/client.js";
import express from "express";
import {
  getPostByActorName,
  handleCreatePost,
  fetchPostList,
  fetchPostDetail,
  handleAddComment,
  handleToggleLike,
  handleUpdatePost,
  handleDeletePost,
} from "../services/post.service.js";
import {
  getPostTags,
  getPostImages,
  getPostComments,
} from "../repositories/post.repositories.js";
import firebaseAdmin from "firebase-admin";
const { messaging } = firebaseAdmin;

/**
 * GET /api/posts/ticketbook
 * @desc 나의 티켓북 조회
 */

export const getUserTicketbook = asyncHandler(async (req, res) => {
  // 일단 임시로
  // const userId = req.user.id; // JWT 인증 미들웨어로부터 유저 ID 추출
  const userId = 1;

  const records = await getTicketbook(userId);

  res.success({
    message: "티켓북 조회 성공",
    data: records,
  });
});

/**
 * 월별 정산판 조회
 * GET /api/posts/monthly-summary?year=YYYY&month=MM
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

const router = express.Router();

router.get("/filter", async (req, res) => {
  try {
    const { actorName } = req.query;
    const posts = await getPostByActorName(actorName);
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, communityId, title, content, category, tagNames, images } =
      req.body;
    const postId = await handleCreatePost({
      userId,
      communityId,
      title,
      content,
      category,
      tagNames,
      images,
    });
    res.status(201).json({
      success: true,
      message: "게시글이 성공적으로 등록되었습니다.",
      postId,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch("/:postId", async (req, res) => {
  try {
    const { userId, communityId, title, content, category, tagNames, images } =
      req.body;
    const { postId } = req.params;
    await handleUpdatePost({
      postId: Number(postId),
      userId,
      communityId,
      title,
      content,
      category,
      tagNames,
      images,
    });

    res.status(200).json({
      success: true,
      message: "게시글이 성공적으로 수정되었습니다.",
      postId: Number(postId),
    });
  } catch (err) {
    res.status(500).json({
      resultType: "FAIL",
      error: {
        errorCode: "unknown",
        reason: err.message,
        data: null,
      },
      success: null,
    });
  }
});

router.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    await handleDeletePost({ postId: Number(postId), userId });

    res.status(200).json({
      success: true,
      message: "게시글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { id: communityId, category, sort } = req.query;
    const posts = await fetchPostList({
      communityId: parseInt(communityId),
      category,
      sort,
    });
    res.status(200).json({ success: true, posts });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/communities/:communityId/posts/:postId", async (req, res) => {
  try {
    const communityId = parseInt(req.params.communityId);
    const postId = parseInt(req.params.postId);

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        communityId: communityId,
      },
      include: {
        user: { select: { nickname: true } },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "해당 커뮤니티에 이 게시글이 없습니다.",
      });
    }

    const tags = await getPostTags(postId);
    const images = await getPostImages(postId);
    const comments = await getPostComments(postId);

    res.status(200).json({
      success: true,
      post: {
        postId: post.id,
        title: post.title,
        content: post.content,
        author: post.user.nickname,
        category: post.category,
        createdAt: post.createdAt,
        likeCount: post.likeCount,
        tags,
        images,
        comments,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/*
router.post("/:postId/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { userId, communityId, content, isAnonymous } = req.body;
    const commentId = await handleAddComment({
      postId,
      userId,
      communityId,
      content,
      isAnonymous,
    });
    res.status(201).json({
      success: true,
      message: "댓글이 성공적으로 등록되었습니다.",
      commentId,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
*/

router.post("/:postId/like", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { userId } = req.body;

    const message = await handleToggleLike({ postId, userId });

    res.status(200).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/:postId/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { userId, communityId, content, isAnonymous } = req.body;

    const commentId = await handleAddComment({
      postId,
      userId,
      communityId,
      content,
      isAnonymous,
    });

    res.status(200).json({
      success: true,
      message: "댓글이 성공적으로 등록되었습니다.",
      commentId,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

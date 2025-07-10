import prisma from "../config/prismaClient.js";
import { UnauthorizedError } from "../middlewares/CustomError.js";
import PostRepository from "../repositories/post.repository.js";
import {
  findPostsByActorName,
  insertPost,
  findOrCreateTag,
  getPostListByFilters,
  getPostById,
  getPostTags,
  getPostImages,
  getPostComments,
  insertComment,
  togglePostLike,
} from "../repositories/post.repositories.js";
export const getTicketbook = async (userId) => {
  console.log(Object.keys(prisma)); // 모델들 확인
  const viewings = await prisma.viewingRecord.findMany({
    where: { userId },
    include: {
      musical: {
        include: {
          theater: {
            include: {
              region: true,
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  if (!viewings || viewings.length === 0) {
    throw new UnauthorizedError("티켓북에 기록이 없습니다.", 404);
  }

  return viewings.map((v) => ({
    musical_id: v.musical.id,
    title: v.musical.name,
    poster: v.musical.poster,
    watch_date: v.date,
    theater: {
      name: v.musical.theater.name,
      region: v.musical.theater.region.name,
    },
  }));
};

/**
 * 신규 월별 정산판 조회 (함수 방식으로 추가)
 */
export const getMonthlySummary = async (userId, year, month) => {
  const viewings = await PostRepository.findViewingRecordsByMonth(
    userId,
    year,
    month
  );

  if (!viewings || viewings.length === 0) {
    throw new UnauthorizedError("해당 월에 관람 기록이 없습니다.", 404);
  }

  return viewings.map((v) => ({
    postId: v.id,
    musicalId: v.musical.id,
    musicalTitle: v.musical.name,
    watchDate: v.date,
    watchTime: v.time,
    seat: {
      locationId: v.seat?.id,
      row: v.seat?.row,
      column: v.seat?.column,
      seatType: v.seat?.seat_type,
    },
    content: v.content,
    imageUrls: [v.musical.poster] || [],
  }));
};

// 배우 이름으로 후기 필터링
export const getPostByActorName = async (actorName) => {
  if (!actorName) throw new Error("배우 이름이 필요합니다.");
  const posts = await findPostsByActorName(actorName);
  return posts;
};

// 게시글 작성
export const handleCreatePost = async ({
  userId,
  communityId,
  title,
  content,
  category,
  tagNames,
  images,
}) => {
  // 게시글 생성
  const postId = await insertPost(
    userId,
    communityId,
    title,
    content,
    category
  );

  // 태그 생성 및 연결
  const tagIds = [];
  for (const tagName of tagNames) {
    const tagId = await findOrCreateTag(tagName);
    tagIds.push(tagId);
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      tags: {
        connect: tagIds.map((id) => ({ id })),
      },
    },
  });

  // 이미지 등록 (Image 모델 기반으로 직접 작성)
  for (const imageUrl of images) {
    await prisma.image.create({
      data: {
        post: { connect: { id: postId } },
        url: imageUrl,
      },
    });
  }

  return postId;
};

// 게시글 목록 조회
export const fetchPostList = async ({ communityId, category, sort }) => {
  if (!communityId || !category || !sort) {
    throw new Error("communityId, category, sort는 필수입니다.");
  }

  const validSorts = ["likes", "latest"];
  if (!validSorts.includes(sort)) {
    throw new Error("지원하지 않는 정렬 기준입니다.");
  }

  return await getPostListByFilters(communityId, category, sort);
};

// 게시글 상세 조회
export const fetchPostDetail = async (postId) => {
  const post = await getPostById(postId);
  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  const tags = await getPostTags(postId);
  const images = await getPostImages(postId);
  const comments = await getPostComments(postId);

  return {
    ...post,
    tags,
    images,
    comments,
  };
};

// 댓글 작성
export const handleAddComment = async ({
  postId,
  userId,
  communityId,
  content,
  isAnonymous,
}) => {
  if (!postId || !userId || !communityId || !content) {
    throw new Error("필수 값이 누락되었습니다.");
  }

  const comment = await insertComment({
    postId,
    userId,
    communityId,
    content,
    isAnonymous,
  });

  return comment.id;
};

// 좋아요 등록

export const handleToggleLike = async ({ postId, userId }) => {
  const message = await togglePostLike({ postId, userId });
  return message;
};

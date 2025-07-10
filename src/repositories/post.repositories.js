import prisma from "../../prisma/client.js";

//  배우 이름으로 후기 필터 조회
export const findPostsByActorName = async (actorName) => {
  // 1. actorName에 해당하는 Tag 찾기
  const tag = await prisma.tag.findUnique({
    where: { name: actorName },
  });

  if (!tag) return [];

  // 2. 해당 Tag ID로 PostTag 테이블에서 post 연결
  const postTags = await prisma.postTag.findMany({
    where: { tagId: tag.id },
    include: {
      post: {
        include: {
          user: {
            select: { nickname: true },
          },
          tags: true,
        },
      },
    },
  });

  // 3. postTags → post로 매핑
  const posts = postTags
    .filter((pt) => pt.post !== null)
    .map((pt) => {
      const post = pt.post;
      return {
        postId: post.id,
        title: post.title,
        content: post.content,
        author: post.user.nickname,
        createdAt: post.createdAt,
        likeCount: post.likeCount,
        tags: post.tags.map((t) => t.name),
      };
    });

  return posts;
};

// 게시글 작성
export const insertPost = async (
  userId,
  communityId,
  title,
  content,
  category
) => {
  const post = await prisma.post.create({
    data: {
      user: { connect: { id: userId } },
      communityId,
      title,
      content,
      category,
      setting: { connect: { id: 1 } },
    },
  });
  return post.id;
};

//  태그 확인/생성
export const findOrCreateTag = async (tagName) => {
  const existing = await prisma.tag.findUnique({ where: { name: tagName } });
  if (existing) return existing.id;

  const newTag = await prisma.tag.create({ data: { name: tagName } });
  return newTag.id;
};

// 게시글-태그 연결
export const insertPostTag = async (postId, tagId, userId, communityId) => {
  await prisma.postTag.create({
    data: {
      postId,
      tagId,
      userId,
      communityId,
    },
  });
};

// 게시글 이미지 추가
export const insertPostImage = async (
  postId,
  userId,
  communityId,
  imageUrl
) => {
  await prisma.image.create({
    data: {
      post: { connect: { id: postId } },
      url: imageUrl,
    },
  });
};

// 게시글 목록 필터
export const getPostListByFilters = async (communityId, category, sort) => {
  const orderBy =
    sort === "likes" ? { likeCount: "desc" } : { createdAt: "desc" };

  const posts = await prisma.post.findMany({
    where: {
      communityId,
      category,
    },
    include: {
      user: { select: { nickname: true } },
    },
    orderBy,
  });

  return posts.map((post) => ({
    postId: post.id,
    title: post.title,
    author: post.user.nickname,
    category: post.category,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt,
    communityId: post.communityId,
  }));
};

//  게시글 상세 조회
export const getPostById = async (postId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: { select: { nickname: true } },
    },
  });

  if (!post) return null;

  return {
    postId: post.id,
    title: post.title,
    content: post.content,
    author: post.user.nickname,
    category: post.category,
    createdAt: post.createdAt,
    likeCount: post.likeCount,
  };
};

//  게시글 태그 조회
export const getPostTags = async (postId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      tags: true,
    },
  });

  return post.tags.map((tag) => tag.name);
};

//  게시글 이미지 조회
export const getPostImages = async (postId) => {
  const images = await prisma.image.findMany({
    where: { postId },
    select: { url: true },
  });
  return images.map((i) => i.url);
};
//  게시글 댓글 조회
export const getPostComments = async (postId) => {
  const comments = await prisma.comment.findMany({
    where: { postId },
    include: {
      user: { select: { nickname: true } },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return comments.map((comment) => ({
    commentId: comment.id,
    author: comment.user.nickname,
    content: comment.content,
    createdAt: comment.createdAt,
  }));
};

export const insertComment = async ({
  postId,
  userId,
  communityId,
  content,
  isAnonymous,
}) => {
  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      communityId,
      content,
      isAnonymous,
    },
  });

  return comment;
};

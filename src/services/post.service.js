import prisma from "../config/prismaClient.js";
import {
  NotFoundError,
  UnauthorizedError,
} from "../middlewares/CustomError.js";
import PostRepository from "../repositories/post.repository.js";
import { findPostsByActorName } from "../repositories/post.repositories.js";
import CommentRepository from "../repositories/comment.repository.js";
import { formatPostResponse } from "../dtos/post.dto.js";

// 배우 이름으로 후기 필터링
export const getPostByActorName = async (actorName) => {
  if (!actorName) throw new Error("배우 이름이 필요합니다.");
  const posts = await findPostsByActorName(actorName);
  return posts;
};

/*
 *일반 게시글 등록(생성)
 */
export const createPostService = async (userId, dto) => {
  const { communityId, content, hasMedia, postimages, visibility } = dto;

  // 커뮤니티 가입 여부 확인
  const membership = await PostRepository.findUserCommunity(
    userId,
    communityId
  );
  if (!membership) {
    throw new Error("해당 커뮤니티에 가입된 사용자만 글을 작성할 수 있습니다.");
  }

  // 트랜잭션 시작
  const post = await prisma.$transaction(async (tx) => {
    // 1. 게시글 생성
    const createdPost = await tx.post.create({
      data: {
        userId,
        communityId,
        content,
        hasMedia,
        visibility,
      },
      select: {
        id: true,
        userId: true,
        communityId: true,
        content: true,
        visibility: true,
        createdAt: true,
      },
    });

    // 2. 이미지 저장
    let savedImages = [];

    if (postimages && postimages.length > 0) {
      const imageList = Array.isArray(postimages) ? postimages : [postimages];
      const imageData = imageList.map((url) => ({
        postId: createdPost.id,
        url,
      }));

      await tx.postImage.createMany({ data: imageData });
      savedImages = imageList;
    }

    // 3. 해시태그 추출 및 저장
    const tags = dto.extractHashtags();
    for (const tagName of tags) {
      const tag = await tx.tag_Post.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });

      await tx.postTag.create({
        data: {
          postId: createdPost.id,
          tagId: tag.id,
        },
      });
    }

    return {
      post: createdPost,
      postimages: savedImages,
    };
  });

  return post;
};

/*재게시용 게시글 생성 */
export const createRepostService = async (userId, postId, createRepostDto) => {
  const repost = await PostRepository.createRepost({
    userId,
    communityId: createRepostDto.communityId,
    visibility: createRepostDto.visibility,
    repostTargetId: postId,
  });

  await PostRepository.incrementRepostCount(postId);

  return repost;
};

/**
 * 인용 게시글 생성
 */
export const createQuotePostService = async (userId, postId, dto) => {
  const { content, postimages, communityId, visibility, hasMedia, repostType } =
    dto;

  const result = await prisma.$transaction(async (tx) => {
    // 1. 인용 게시글 생성
    const createdPost = await tx.post.create({
      data: {
        userId,
        communityId,
        isRepost: true,
        repostType,
        repostTargetId: postId,
        content,
        hasMedia,
        visibility,
      },
      select: {
        id: true,
        content: true,
        repostTargetId: true,
      },
    });

    // 2. 이미지 저장
    let savedImages = [];

    if (postimages && postimages.length > 0) {
      const imageList = Array.isArray(postimages) ? postimages : [postimages];
      const imageData = imageList.map((url) => ({
        postId: createdPost.id,
        url,
      }));

      await tx.postImage.createMany({ data: imageData });
      savedImages = imageList;
    }

    // 3. 해시태그 추출 및 저장
    const tags = dto.extractHashtags?.() ?? [];
    for (const tagName of tags) {
      const tag = await tx.tag_Post.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });

      await tx.postTag.create({
        data: {
          postId: createdPost.id,
          tagId: tag.id,
        },
      });
    }

    return {
      post: createdPost,
      postimages: savedImages,
    };
  });

  // 4. 원본 게시글 repostCount 증가
  await PostRepository.incrementRepostCount(postId);

  return result;
};

/**
 * 게시글 수정
 */
export const updatePostService = async (postId, userId, updatePostDto) => {
  const { content, postimages, visibility } = updatePostDto;

  // 1. 게시글 존재 및 작성자 확인
  const post = await PostRepository.findPostById(postId);
  if (!post) {
    throw new NotFoundError("게시글이 존재하지 않습니다.");
  }
  if (post.user.id !== userId) {
    throw new ForbiddenError("게시글 수정 권한이 없습니다.");
  }

  // 2. hasMedia 판단
  const hasMedia = Array.isArray(postimages) && postimages.length > 0;

  // 3. repostType 판단 (인용 게시글에서 content와 postimages가 둘 다 null이면 repost로 변경)
  let newRepostType = post.repostType;
  const isEmptyContent = !content || content.trim() === "";
  const isEmptyImages = !postimages || postimages.length === 0;
  if (
    post.isRepost &&
    post.repostType === "quote" &&
    isEmptyContent &&
    isEmptyImages
  ) {
    newRepostType = "repost";
  }

  // 4~7. 트랜잭션으로 수정, 삭제, 삽입 처리
  await prisma.$transaction(async (tx) => {
    // 4. 게시글 본문, hasMedia, visibility, repostType 수정
    await tx.post.update({
      where: { id: postId },
      data: {
        content,
        visibility,
        hasMedia,
        repostType: newRepostType,
      },
    });

    // 5. 기존 이미지 및 태그 삭제
    await tx.postImage.deleteMany({ where: { postId } });
    await tx.postTag.deleteMany({ where: { postId } });

    // 6. 새로운 이미지 등록
    if (hasMedia) {
      const imageData = postimages.map((url) => ({ postId, url }));
      await tx.postImage.createMany({ data: imageData });
    }

    // 7. 해시태그 추출 및 저장
    const hashtags = updatePostDto.extractHashtags?.() || [];
    for (const tag of hashtags) {
      const tagRecord = await tx.tag.upsert({
        where: { name: tag },
        update: {},
        create: { name: tag },
      });
      await tx.postTag.create({
        data: {
          postId,
          tagId: tagRecord.id,
        },
      });
    }
  });

  // 8. 수정된 게시글 다시 조회 및 반환
  const updatedPost = await PostRepository.findPostById(postId);
  return updatedPost;
};

/**
 * 게시글 삭제
 */
export const deletePostService = async (postId, userId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. 게시글 존재 여부 확인
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError("삭제할 게시글이 존재하지 않습니다.");
    }

    // 2. 작성자 본인인지 확인
    if (post.user.id !== userId) {
      throw new ForbiddenError("게시글 삭제 권한이 없습니다.");
    }

    // 3. 리포스트 게시글이라면, 원본의 repostCound 감소
    if (post.isRepost && post.repostTargetId) {
      await tx.post.update({
        where: { id: post.repostTargetId },
        data: {
          repostCount: {
            decrement: 1,
          },
        },
      });
    }

    // 4. 연관 데이터 삭제
    await PostRepository.deletePostImagesByPostId(postId);
    await PostRepository.deletePostTagsByPostId(postId);
    await PostRepository.deletePostLikesByPostId(postId);
    await PostRepository.deletePostBookmarksByPostId(postId);

    // 5. 게시글 자체 삭제
    await PostRepository.deletePostById(postId);

    // 6. 응답
    return postId;
  });
};

/**
 * repost 게시글 삭제
 */
export const deleteRepostService = async (postId, userId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. 게시글 존재 여부 확인
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError("삭제할 게시글이 존재하지 않습니다.");
    }

    // 2. 작성자 본인인지 확인
    if (post.user.id !== userId) {
      throw new ForbiddenError("게시글 삭제 권한이 없습니다.");
    }

    // 3. 리포스트 게시글이라면, 원본의 repostCound 감소
    if (post.isRepost && post.repostTargetId) {
      await tx.post.update({
        where: { id: post.repostTargetId },
        data: {
          repostCount: {
            decrement: 1,
          },
        },
      });
    }
    // 4. 게시글 자체 삭제
    await PostRepository.deletePostById(postId);

    // 6. 응답
    return postId;
  });
};

/**
 * 좋아요 등록/해제 (토글 방식)
 */
export const postLikeService = async (postId, userId) => {
  // 1. 게시글 존재 여부 확인
  const post = await PostRepository.findPostById(postId);
  if (!post) {
    throw new NotFoundError("게시글이 존재하지 않습니다.");
  }

  // 2. 유저가 이미 좋아요 했는지 확인
  const existingLike = await PostRepository.findPostLike(userId, postId);

  // 3. 토글 처리
  if (existingLike) {
    // 좋아요 취소
    await PostRepository.deletePostLike(userId, postId);
    return {
      message: "좋아요 취소 완료",
      isLiked: false,
    };
  } else {
    // 좋아요 등록
    await PostRepository.createPostLike(userId, postId);
    return {
      message: "좋아요 등록 완료",
      isLiked: true,
    };
  }
};

/**
 * 좋아요 누른 유저 목록 조회
 */
export const getPostLikedUsersService = async (postId, page, limit) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    PostRepository.findUsersWhoLikedPost(postId, skip, limit),
    PostRepository.countUsersWhoLikedPost(postId),
  ]);

  const userList = users.map((like) => like.user);

  return {
    total,
    page,
    limit,
    users: userList,
  };
};

// 전체 게시물 받아오는 함수
export const getAllPostService = {
  async getAllPosts() {
    const posts = await PostRepository.getAllPosts();
    return posts.map((post) => formatPostResponse(post));
  },
};

// 미디어 게시물 받아오는 함수
export const getMediaPostsService = async () => {
  const mediaPosts = await PostRepository.findMediaPosts();
  return mediaPosts;
};

// 댓글 등록
export const createCommentService = async (userId, postId, content) => {
  return await CommentRepository.createComment(userId, postId, content);
};

// 댓글 조회
export const getCommentsService = async (postId) => {
  return await CommentRepository.getCommentsByPostId(postId);
};

// 댓글 수정
export const updateCommentService = async (userId, commentId, content) => {
  const comment = await CommentRepository.findCommentById(commentId);
  if (!comment) throw new NotFoundError("댓글이 존재하지 않습니다.");
  console.log(userId, comment.userId);
  if (comment.userId !== userId)
    throw new UnauthorizedError("수정 권한이 없습니다.");

  return await CommentRepository.updateComment(commentId, content);
};

// 댓글 삭제
export const deleteCommentService = async (userId, commentId) => {
  const comment = await CommentRepository.findCommentById(commentId);
  if (!comment) throw new NotFoundError("댓글이 존재하지 않습니다.");
  if (comment.userId !== userId)
    throw new UnauthorizedError("삭제 권한이 없습니다.");

  return await CommentRepository.deleteComment(commentId);
};

// 재게시한 유저 목록 받아오는 함수
export const getRepostedUsersService = async (postId) => {
  return await PostRepository.findUsersWhoReposted(postId);
};

// 인용한 게시물 정보 받아옴
export const getQuotedPostService = async (postId) => {
  const quoted = await PostRepository.findQuotedPost(postId);

  if (!quoted) {
    throw new NotFoundError("해당 게시글은 인용한 게시글이 없습니다.");
  }

  return quoted;
};

/**
 * 게시글 상세 조회
 */
export const getPostDetail = async (postId, userId) => {
  const post = await PostRepository.getOnePostById(postId, userId);

  if (!post) {
    throw new NotFoundError("게시글을 찾을 수 없습니다.");
  }

  // isRepost가 true인데 원본이 없는 경우
  if (post.isRepost) {
    if (!post.repostTarget) {
      post.repostTarget = { message: "삭제된 게시글입니다." };
    }
  } else {
    // 리포스트가 아니면 null로 설정
    post.repostTarget = null;
  }

  return post;
};

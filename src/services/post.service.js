import prisma from '../config/prismaClient.js';
import { NotFoundError, UnauthorizedError } from '../middlewares/CustomError.js';
import PostRepository from '../repositories/post.repository.js';
/** */
import { findPostsByActorName } from '../repositories/post.repositories.js';
import CommentRepository from '../repositories/comment.repository.js';
import { formatPostResponse } from '../dtos/post.dto.js';

/* 티켓북 조회 */
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
    orderBy: { date: 'desc' },
  });

  if (!viewings || viewings.length === 0) {
    throw new UnauthorizedError('티켓북에 기록이 없습니다.', 404);
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
  const viewings = await PostRepository.findViewingRecordsByMonth(userId, year, month);

  if (!viewings || viewings.length === 0) {
    throw new UnauthorizedError('해당 월에 관람 기록이 없습니다.', 404);
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

/* 오늘의 관극 등록
 */
export const createViewingRecord = async (userId, body) => {
  const { musicalId, watchDate, watchTime, seat, casts, content, rating, imageUrls } = body;

  // 좌석 upsert
  const seatRecord = await prisma.seat.upsert({
    where: {
      theaterId_row_column: {
        theaterId: seat.locationId,
        row: seat.row,
        column: seat.column,
      },
    },
    update: {},
    create: {
      theaterId: seat.locationId,
      row: seat.row,
      column: seat.column,
      seat_type: seat.seatType,
    },
  });

  // 관극 기록 생성
  const viewing = await prisma.viewingRecord.create({
    data: {
      userId,
      musicalId,
      seatId: seatRecord.id,
      date: new Date(watchDate),
      time: new Date(`${watchDate}T${watchTime}`),
      content,
      rating,
    },
  });

  // 이미지 등록
  if (imageUrls?.length) {
    await prisma.viewingImage.createMany({
      data: imageUrls.map((url) => ({
        viewingId: viewing.id,
        url,
      })),
    });
  }

  // 출연진 등록
  if (casts?.length) {
    await prisma.casting.createMany({
      data: casts.map((c) => ({
        musicalId,
        actorId: c.actorId,
        role: c.role,
      })),
    });
  }

  return viewing;
};

// 배우 이름으로 후기 필터링
export const getPostByActorName = async (actorName) => {
  if (!actorName) throw new Error('배우 이름이 필요합니다.');
  const posts = await findPostsByActorName(actorName);
  return posts;
};

/*일반 게시글 등록(생성)
 */
export const createPostService = async (userId, dto) => {
  const { communityId, content, hasMedia, postimages } = dto;

  // 커뮤니티 가입 여부 확인
  const membership = await PostRepository.findUserCommunity(userId, communityId);
  if (!membership) {
    throw new Error('해당 커뮤니티에 가입된 사용자만 글을 작성할 수 있습니다.');
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
      },
      select: {
        id: true,
        content: true,
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
export const createRepostService = async (userId, communityId, postId, createRepostDto) => {
  // 커뮤니티 가입 여부 확인
  const membership = await PostRepository.findUserCommunity(userId, communityId);
  if (!membership) {
    throw new Error('해당 커뮤니티에 가입된 사용자만 재게시할 수 있습니다.');
  }

  const repost = await PostRepository.createRepost({
    userId,
    communityId,
    repostType: createRepostDto.repostType,
    repostTargetId: postId,
  });

  await PostRepository.incrementRepostCount(postId);

  return repost;
};

/**
 * 인용 게시글 생성
 */
export const createQuotePostService = async (userId, communityId, postId, dto) => {
  const { repostType, content, postimages, hasMedia } = dto;

  // 커뮤니티 가입 여부 확인
  const membership = await PostRepository.findUserCommunity(userId, communityId);
  if (!membership) {
    throw new Error('해당 커뮤니티에 가입된 사용자만 인용 게시글을 작성할 수 있습니다.');
  }

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
      },
      select: {
        id: true,
        content: true,
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
  const { content, postimages } = updatePostDto;

  // 1. 게시글 존재 및 작성자 확인
  const post = await PostRepository.findPostById(postId);
  if (!post) {
    throw new NotFoundError('게시글이 존재하지 않습니다.');
  }
  if (post.user.id !== userId) {
    throw new ForbiddenError('게시글 수정 권한이 없습니다.');
  }

  // 2. hasMedia 판단
  const hasMedia = Array.isArray(postimages) && postimages.length > 0;

  // 3~6. 트랜잭션으로 수정, 삭제, 삽입 처리
  await prisma.$transaction(async (tx) => {
    // 3. 게시글 본문 및 hasMedia 수정
    await tx.post.update({
      where: { id: postId },
      data: {
        content,
        hasMedia,
      },
    });

    // 4. 기존 이미지 및 태그 삭제
    await tx.postImage.deleteMany({ where: { postId } });
    await tx.postTag.deleteMany({ where: { postId } });

    // 5. 새로운 이미지 등록
    if (hasMedia) {
      const imageData = postimages.map((url) => ({ postId, url }));
      await tx.postImage.createMany({ data: imageData });
    }

    // 6. 해시태그 추출 및 저장
    const hashtags = updatePostDto.extractHashtags();
    for (const tag of hashtags) {
      const tagRecord = await tx.tag_Post.upsert({
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

  // 7. 수정된 게시글 다시 조회 및 반환
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
      throw new NotFoundError('삭제할 게시글이 존재하지 않습니다.');
    }

    // 2. 작성자 본인인지 확인
    if (post.user.id !== userId) {
      throw new ForbiddenError('게시글 삭제 권한이 없습니다.');
    }

    // 3. 연관 데이터 삭제
    await PostRepository.deletePostImagesByPostId(postId);
    await PostRepository.deletePostTagsByPostId(postId);

    // 4. 게시글 자체 삭제
    await PostRepository.deletePostById(postId);

    // 5. 응답
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
    throw new NotFoundError('게시글이 존재하지 않습니다.');
  }

  // 2. 유저가 이미 좋아요 했는지 확인
  const existingLike = await PostRepository.findPostLike(userId, postId);

  // 3. 토글 처리
  if (existingLike) {
    // 좋아요 취소
    await PostRepository.deletePostLike(userId, postId);
    return {
      message: '좋아요 취소 완료',
      isLiked: false,
    };
  } else {
    // 좋아요 등록
    await PostRepository.createPostLike(userId, postId);
    return {
      message: '좋아요 등록 완료',
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
  if (!comment) throw new NotFoundError('댓글이 존재하지 않습니다.');
  console.log(userId, comment.userId);
  if (comment.userId !== userId) throw new UnauthorizedError('수정 권한이 없습니다.');

  return await CommentRepository.updateComment(commentId, content);
};

// 댓글 삭제
export const deleteCommentService = async (userId, commentId) => {
  const comment = await CommentRepository.findCommentById(commentId);
  if (!comment) throw new NotFoundError('댓글이 존재하지 않습니다.');
  if (comment.userId !== userId) throw new UnauthorizedError('삭제 권한이 없습니다.');

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
    throw new NotFoundError('해당 게시글은 인용한 게시글이 없습니다.');
  }

  return quoted;
};

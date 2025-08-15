import bookmarkRepository from "../repositories/bookmark.repository.js";
import { BadRequestError } from "../middlewares/CustomError.js";

// 북마크 추가
export const addBookmarkService = async (userId, postId) => {
  const exists = await bookmarkRepository.isBookmarked(userId, postId);
  if (exists) {
    throw new BadRequestError("이미 북마크한 게시글입니다.");
  }

  return await bookmarkRepository.createBookmark(userId, postId);
};

// 북마크 제거
export const removeBookmarkService = async (userId, postId) => {
  const exists = await bookmarkRepository.isBookmarked(userId, postId);
  if (!exists) {
    throw new BadRequestError("북마크하지 않은 게시글입니다.");
  }

  return await bookmarkRepository.deleteBookmark(userId, postId);
};

/**
 * 로그인한 유저가 북마크한 게시글 조회
 */
export const getBookmarkPostsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // 1. 북마크 게시글 조회
  const bookmarks = await bookmarkRepository.getBookmarkPosts(
    userId,
    skip,
    limit
  );

  if (!bookmarks || bookmarks.length === 0) {
    throw new NotFoundError("북마크한 게시글이 없습니다.");
  }

  // 2. total 계산 (간단히 현재 조회한 개수, 더 정확하게는 count 쿼리 추가 가능)
  const total = bookmarks.length;

  // 3. post 가공
  const processedPosts = bookmarks.map(({ post }) => {
    // 일반 게시글
    if (!post.isRepost) {
      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        commentCount: post.commentCount,
        likeCount: post.likeCount,
        repostCount: post.repostCount,
        bookmarkCount: post.bookmarkCount,
        isRepost: post.isRepost,
        repostType: post.repostType,
        user: post.user,
        postImages: post.postImages,
        community: post.community,
        postLikes: post.postLikes.length > 0,
        postBookmarks: post.postBookmarks.length > 0,
      };
    }

    // 인용 게시글
    if (post.isRepost && post.repostType === "quote") {
      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        commentCount: post.commentCount,
        likeCount: post.likeCount,
        repostCount: post.repostCount,
        bookmarkCount: post.bookmarkCount,
        isRepost: true,
        repostType: "quote",
        user: post.user,
        postImages: post.postImages,
        community: post.community,
        postLikes: post.postLikes.length > 0,
        postBookmarks: post.postBookmarks.length > 0,
        repostTarget: post.repostTarget
          ? {
              id: post.repostTarget.id,
              content: post.repostTarget.content,
              createdAt: post.repostTarget.createdAt,
              user: post.repostTarget.user,
              postImages: post.repostTarget.postImages,
              community: post.repostTarget.community,
            }
          : { message: "삭제된 게시글입니다." },
      };
    }

    // 기타 타입은 그대로 반환
    return post;
  });

  return { total, page, limit, posts: processedPosts };
};

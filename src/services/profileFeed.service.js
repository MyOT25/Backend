import profileFeedRepo from "../repositories/profileFeed.repository.js";

class ProfileFeedService {
  // 특정 유저 게시글 조회
  async getAllPosts({ loginUserId, targetUserId, page = 1, limit = 10 }) {
    const { total, posts } = await profileFeedRepo.getUserPosts({
      loginUserId,
      targetUserId,
      page,
      limit,
    });

    const processedPosts = posts.map((post) => {
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

      // 리포스트 게시글
      if (post.isRepost && post.repostType === "repost") {
        return {
          id: post.id,
          isRepost: true,
          repostType: "repost",
          user: post.user,
          community: post.community,
          repostTarget: post.repostTarget
            ? {
                id: post.repostTarget.id,
                content: post.repostTarget.content,
                createdAt: post.repostTarget.createdAt,
                commentCount: post.repostTarget.commentCount,
                likeCount: post.repostTarget.likeCount,
                repostCount: post.repostTarget.repostCount,
                bookmarkCount: post.repostTarget.bookmarkCount,
                user: post.repostTarget.user,
                postImages: post.repostTarget.postImages,
                community: post.repostTarget.community,
                postLikes: post.repostTarget.postLikes.length > 0,
                postBookmarks: post.repostTarget.postBookmarks.length > 0,
              }
            : { message: "삭제된 게시글 입니다." },
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
            : { message: "삭제된 게시글 입니다." },
        };
      }

      // 혹시 다른 타입이 있으면 그대로 반환
      return post;
    });

    return { total, posts: processedPosts };
  }

  //리포스트 게시글 조회
  async getRepostPosts({ loginUserId, targetUserId, page = 1, limit = 10 }) {
    const { total, posts } = await profileFeedRepo.getUserRepostPosts({
      loginUserId,
      targetUserId,
      page,
      limit,
    });

    const processedPosts = posts.map((post) => ({
      id: post.id,
      isRepost: true,
      repostType: post.repostType,
      user: post.user,
      community: post.community,
      repostTarget: post.repostTarget
        ? {
            id: post.repostTarget.id,
            content: post.repostTarget.content,
            createdAt: post.repostTarget.createdAt,
            commentCount: post.repostTarget.commentCount,
            likeCount: post.repostTarget.likeCount,
            repostCount: post.repostTarget.repostCount,
            bookmarkCount: post.repostTarget.bookmarkCount,
            user: post.repostTarget.user,
            postImages: post.repostTarget.postImages,
            community: post.repostTarget.community,
            postLikes: post.repostTarget.postLikes.length > 0,
            postBookmarks: post.repostTarget.postBookmarks.length > 0,
          }
        : { message: "삭제된 게시글 입니다." },
    }));

    return { total, posts: processedPosts };
  }

  //인용 게시글 조회
  async getQuotePosts({ loginUserId, targetUserId, page = 1, limit = 10 }) {
    const { total, posts } = await profileFeedRepo.getUserQuotePosts({
      loginUserId,
      targetUserId,
      page,
      limit,
    });

    const processedPosts = posts.map((post) => ({
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
        : { message: "삭제된 게시글 입니다." },
    }));

    return { total, posts: processedPosts };
  }

  async getMediaPosts({ loginUserId, targetUserId, page = 1, limit = 10 }) {
    const { total, posts } = await profileFeedRepo.getUserMediaPosts({
      loginUserId,
      targetUserId,
      page,
      limit,
    });

    const processedPosts = posts.map((post) => {
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
            : { message: "삭제된 게시글 입니다." },
        };
      }

      return post;
    });

    return { total, posts: processedPosts };
  }
}

export default new ProfileFeedService();

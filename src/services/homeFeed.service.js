import { getHomeFeedPosts as getHomeFeedPostsRepo } from "../repositories/homeFeed.repository.js";

export const getHomeFeedPostsService = async ({
  userId,
  page = 1,
  limit = 10,
}) => {
  const { total, posts } = await getHomeFeedPostsRepo({ userId, page, limit });

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
        postComments: post.postComments.length > 0,
        reposts: post.reposts.some((r) => r.repostTargetId === post.id),
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
              postComments: post.repostTarget.postComments.length > 0,
              reposts: post.repostTarget.reposts.some(
                (r) => r.repostTargetId === post.repostTarget.id
              ),
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
        postComments: post.postComments.length > 0,
        reposts: post.reposts.some((r) => r.repostTargetId === post.id),
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
};

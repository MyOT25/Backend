import * as searchRepo from "../repositories/search.repository.js";

export const searchPostsService = async (
  keyword,
  userId,
  page = 1,
  take = 10
) => {
  const { total, posts } = await searchRepo.searchPostsByKeyword(
    keyword,
    userId,
    page,
    take
  );

  // 삭제된 리포스트 처리
  const processedPosts = posts.map((post) => {
    if (post.isRepost && !post.repostTarget) {
      return {
        ...post,
        repostTarget: { message: "삭제된 게시글 입니다." },
      };
    }
    return post;
  });

  return {
    total,
    page,
    take,
    posts: processedPosts,
  };
};

import profileFeedRepository from "../repositories/profileFeed.repository.js";

class ProfileFeedService {
  // 공통: repostTarget이 null일 경우 처리
  formatRepostTargets(posts) {
    return posts.map((post) => {
      if (post.isRepost && post.repostTarget === null) {
        return {
          ...post,
          repostTarget: {
            message: "삭제된 게시글입니다.",
          },
        };
      }
      return post;
    });
  }

  // 전체 게시글 조회
  async getAllPosts(userId, page, limit) {
    const result = await profileFeedRepository.getUserPosts(
      userId,
      {},
      page,
      limit
    );
    const posts = this.formatRepostTargets(result.posts);

    return {
      ...result,
      posts,
    };
  }

  // 인용 게시글 조회
  async getQuotePosts(userId, page, limit) {
    const result = await profileFeedRepository.getQuotePosts(
      userId,
      page,
      limit
    );
    const posts = this.formatRepostTargets(result.posts);

    return {
      ...result,
      posts,
    };
  }

  // 리포스트 게시글 조회
  async getRepostPosts(userId, page, limit) {
    const result = await profileFeedRepository.getRepostPosts(
      userId,
      page,
      limit
    );
    const posts = this.formatRepostTargets(result.posts);

    return {
      ...result,
      posts,
    };
  }

  // 미디어 게시글 조회
  async getMediaPosts(userId, page, limit) {
    const result = await profileFeedRepository.getUserPosts(
      userId,
      { hasMedia: true },
      page,
      limit
    );
    const posts = this.formatRepostTargets(result.posts);

    return {
      ...result,
      posts,
    };
  }
}

export default new ProfileFeedService();

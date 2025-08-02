import homeFeedRepository from "../repositories/homeFeed.repository.js";

class HomeFeedService {
  async getFollowingPosts(userId, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const posts = await homeFeedRepository.getFollowingPosts(
      userId,
      skip,
      take
    );
    const totalCount = await homeFeedRepository.getFollowingPostsCount(userId);

    return {
      totalCount,
      page,
      pageSize,
      posts,
    };
  }
}

export default new HomeFeedService();

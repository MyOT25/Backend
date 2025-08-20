import followRepository from "../repositories/user.repository.js";

class FollowService {
  // 팔로우
  async followUser(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error("자기 자신은 팔로우할 수 없습니다.");
    }

    const existingFollow = await followRepository.isAlreadyFollowing(
      followerId,
      followingId
    );
    if (existingFollow) {
      throw new Error("이미 팔로우 중입니다.");
    }

    return followRepository.createFollow(followerId, followingId);
  }

  // 언팔로우
  async unfollowUser(followerId, followingId) {
    const existingFollow = await followRepository.isAlreadyFollowing(
      followerId,
      followingId
    );

    if (!existingFollow) {
      throw new Error("팔로우 중이 아닙니다.");
    }

    return followRepository.deleteFollow(followerId, followingId);
  }

  // 팔로워 목록 조회
  async getFollowersList(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      followRepository.getFollowers(userId, skip, limit),
      followRepository.getFollowersCount(userId),
    ]);

    return { data, total };
  }

  // 팔로잉 목록 조회
  async getFollowingsList(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      followRepository.getFollowings(userId, skip, limit),
      followRepository.getFollowingsCount(userId),
    ]);

    return { data, total };
  }

  // 팔로워, 팔로잉 수 조회
  async getFollowCount(userId) {
    return followRepository.getFollowCount(userId);
  }

  // 특정 유저를 현재 팔로우 중인지 확인
  async isFollowing(followerId, followingId) {
    const result = await followRepository.isAlreadyFollowing(
      followerId,
      followingId
    );
    return !!result; // true/false 반환
  }
}

export default new FollowService();

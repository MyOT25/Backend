import prisma from "../config/prismaClient.js";

class FollowRepository {
  // Follow 테이블 추가
  async createFollow(followerId, followingId) {
    return prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  // Follow 테이블 삭제
  async deleteFollow(followerId, followingId) {
    return prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
  }

  // 팔로워 조회 (페이징)
  async getFollowers(userId, skip = 0, limit = 10) {
    return prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
          },
        },
      },
      skip,
      take: limit,
    });
  }

  // 팔로워 전체 개수 조회
  async getFollowersCount(userId) {
    return prisma.follow.count({
      where: { followingId: userId },
    });
  }

  // 팔로잉 조회 (페이징)
  async getFollowings(userId, skip = 0, limit = 10) {
    return prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
          },
        },
      },
      skip,
      take: limit,
    });
  }

  // 팔로잉 전체 개수 조회
  async getFollowingsCount(userId) {
    return prisma.follow.count({
      where: { followerId: userId },
    });
  }

  // 유저의 팔로워 수, 팔로잉 수 조회
  async getFollowCount(userId) {
    const followers = await prisma.follow.count({
      where: { followingId: userId },
    });
    const followings = await prisma.follow.count({
      where: { followerId: userId },
    });
    return { followers, followings };
  }

  // 이미 팔로우 중인지 확인
  async isAlreadyFollowing(followerId, followingId) {
    return prisma.follow.findFirst({
      where: { followerId, followingId },
    });
  }
}

export default new FollowRepository();

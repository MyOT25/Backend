import {
  findCommunityViewingReviews,
  findViewingLike,
  insertViewingLike,
  removeViewingLike,
} from "../repositories/communityReview.repository.js";

export async function getCommunityReviewFeed(
  communityId,
  userId,
  { sort, limit, cursor }
) {
  return findCommunityViewingReviews({
    communityId,
    userId,
    sort,
    limit,
    cursor,
  });
}

export async function toggleViewingLike(viewingId, userId) {
  const exists = await findViewingLike(viewingId, userId);
  let likeCount;
  if (exists) {
    likeCount = await removeViewingLike(viewingId, userId);
    return { liked: false, likeCount };
  } else {
    likeCount = await insertViewingLike(viewingId, userId);
    return { liked: true, likeCount };
  }
}

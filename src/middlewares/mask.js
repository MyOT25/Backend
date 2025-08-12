export function maskAuthor(user, isAnonymous) {
  if (!user) return null;
  if (!isAnonymous) {
    // 공개
    return {
      id: user.id,
      nickname: user.nickname ?? user.username ?? `user_${user.id}`,
      profileImageUrl: user.profileImageUrl ?? null,
    };
  }
  // 익명
  return {
    id: null,
    nickname: '익명',
    profileImageUrl: null,
  };
}

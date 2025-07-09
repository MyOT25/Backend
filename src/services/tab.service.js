import { getCommunityTypeById } from '../repositories/tab.repository.js';

const TAB_PRESETS = {
  ACTOR: [
    { key: 'highlight', name: '하이라이트' },
    { key: 'all', name: '전체' },
    { key: 'media', name: '미디어' },
    { key: 'memorybook', name: '메모리북' },
  ],
  MUSICAL: [
    { key: 'highlight', name: '하이라이트' },
    { key: 'all', name: '전체' },
    { key: 'review', name: '후기' },
    { key: 'media', name: '미디어' },
    { key: 'memorybook', name: '메모리북' },
  ],
};

export const getTabsByCommunityId = async (communityId) => {
  const type = await getCommunityTypeById(communityId);
  if (!type || !TAB_PRESETS[type]) return null;
  return TAB_PRESETS[type];
};

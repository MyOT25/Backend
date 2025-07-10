import { getTabsByCommunityId } from '../services/tab.service.js';

export const getTabs = async (req, res) => {
  try {
    const { communityId } = req.params;

    // 커뮤니티 성격에 따른 탭 정보 저장
    const tabs = await getTabsByCommunityId(communityId);

    if (!tabs) {
      return res.status(404).json({ message: '존재하지 않는 커뮤니티이거나 탭 정보 없음' });
    }

    return res.status(200).json({ tabs });
  } catch (error) {
    console.error('탭 조회 에러:', error);
    return res.status(500).json({ message: '서버 에러' });
  }
};

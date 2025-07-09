import { getActorByCommunityId } from '../services/actor.service.js';

export const getActor = async (req, res) => {
  try {
    const { communityId } = req.params;
    const actor = await getActorByCommunityId(Number(communityId));
    if (!actor) {
      return res.status(404).json({ message: '배우 정보를 찾을 수 없습니다.' });
    }
    return res.status(200).json(actor);
  } catch (error) {
    console.error('배우 정보 조회 실패:', error);
    return res.status(500).json({ message: '서버 에러' });
  }
};

import { findCastingsByMusicalId } from "../repositories/casting.repository.js";
import { UnauthorizedError } from "../middlewares/CustomError.js";

/**
 * 특정 뮤지컬의 출연진 목록 서비스
 * @param {number} musicalId - 뮤지컬 ID
 * @returns {Promise<Array>}
 */
export const getMusicalCastingsService = async (musicalId) => {
    const castings = await findCastingsByMusicalId(musicalId);
  
    if (!castings || castings.length === 0) {
      throw new UnauthorizedError("해당 뮤지컬의 출연진이 없습니다.", 404);
    }
  
    return castings.map((c) => ({
      role: c.role,
      actor: {
        id: c.actor.id,
        name: c.actor.name,
        image: c.actor.image,
      },
    }));
  };
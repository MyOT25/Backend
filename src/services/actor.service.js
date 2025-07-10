import { findActorByCommunityId } from '../repositories/actor.repository.js';
import { ActorDto } from '../dtos/actor.dto.js';

export const getActorByCommunityId = async (communityId) => {
  const actor = await findActorByCommunityId(communityId);
  if (!actor) return null;
  return ActorDto(actor);
};

export const ActorDto = (actor) => {
  return {
    id: actor.id,
    name: actor.name,
    profile: actor.profile,
    image: actor.image,
    snsLink: actor.snsLink,
  };
};

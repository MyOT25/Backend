export const formatPostResponse = (post) => ({
  postId: post.id,
  musicalId: post.musical.id,
  musicalTitle: post.musical.title,
  watchDate: post.watch_date,
  watchTime: post.watch_time,
  seat: {
    locationId: post.seat.location_id,
    row: post.seat.row,
    column: post.seat.column,
    seatType: post.seat.seat_type,
  },
  content: post.content,
  imageUrls: post.postimages.map((img) => img.url),
});

//일반 게시물 등록 DTO (리포스트X)
export class CreatePostDTO {
  constructor({ content, postimages = [], hasMedia, communityId }) {
    this.content = content;
    this.postimages = Array.isArray(postimages) ? postimages : [postimages]; // 단일 or 배열 대응
    this.hasMedia = hasMedia;
    this.communityId = parseInt(communityId);
  }

  extractHashtags() {
    const matched = this.content?.match(/#[^\s#]+/g) || [];
    return matched.map((tag) => tag.replace("#", ""));
  }
}

//게시물 재게시 DTO (repost)
export class CreateRepostDTO {
  constructor({ repostType, communityId }) {
    this.repostType = repostType; // 'post' 또는 'review'
    this.communityId = communityId;
  }
}

//게시글 인용 DTO (quote)
export class CreateQuotePostDTO {
  constructor({ repostType, content, postimages = [], hasMedia, communityId }) {
    this.repostType = repostType; // "post" 또는 "review"
    this.content = content;
    this.postimages = Array.isArray(postimages) ? postimages : [postimages];
    this.hasMedia = hasMedia;
    this.communityId = parseInt(communityId);
  }

  extractHashtags() {
    const matched = this.content?.match(/#[^\s#]+/g) || [];
    return matched.map((tag) => tag.replace("#", ""));
  }
}

//게시글 수정 DTO
export class UpdatePostDTO {
  constructor({ content, postimages }) {
    this.content = content;
    this.postimages = Array.isArray(postimages) ? postimages : [postimages];
  }

  extractHashtags() {
    const matched = this.content?.match(/#[^\s#]+/g) || [];
    return matched.map((tag) => tag.replace("#", ""));
  }
}

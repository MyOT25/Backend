export const formatPostResponse = (post) => ({
  postId: post.id,
  watchDate: post.watch_date,
  watchTime: post.watch_time,
  content: post.content,
  imageUrls: post.postimages?.map((img) => img.url) || [],
});
//일반 게시물 등록 DTO (리포스트X)
export class CreatePostDTO {
  constructor({ content, postimages = [], communityId, visibility }) {
    this.content = content;
    this.postimages = Array.isArray(postimages) ? postimages : [postimages]; // 단일 or 배열 대응
    this.hasMedia =
      this.postimages &&
      this.postimages.length > 0 &&
      this.postimages[0] !== null;

    this.communityId = parseInt(communityId);
    this.visibility = visibility;
  }

  extractHashtags() {
    const matched = this.content?.match(/#[^\s#]+/g) || [];
    return matched.map((tag) => tag.replace("#", ""));
  }
}

//게시물 재게시 DTO (repost)
export class CreateRepostDTO {
  constructor({ communityId, visibility }) {
    this.communityId = communityId;
    this.visibility = visibility;
  }
}

//게시글 인용 DTO (quote)
export class CreateQuotePostDTO {
  constructor({ content, postimages = [], communityId, visibility }) {
    this.content = content;
    this.postimages = Array.isArray(postimages) ? postimages : [postimages];
    this.hasMedia =
      this.postimages &&
      this.postimages.length > 0 &&
      this.postimages[0] !== null;
    this.communityId = parseInt(communityId);
    this.visibility = visibility;

    // repostType 결정
    if (
      (this.content === null || this.content === "") &&
      (!this.postimages ||
        this.postimages.length === 0 ||
        this.postimages[0] === null)
    ) {
      this.repostType = "repost"; // 둘 다 null이면 재게시
    } else {
      this.repostType = "quote"; // 하나라도 있으면 인용
    }
  }

  extractHashtags() {
    const matched = this.content?.match(/#[^\s#]+/g) || [];
    return matched.map((tag) => tag.replace("#", ""));
  }
}

//게시글 수정 DTO
export class UpdatePostDTO {
  constructor({ content, postimages, visibility }) {
    this.content = content;
    this.postimages = Array.isArray(postimages) ? postimages : [postimages];
    this.visibility = visibility;
  }

  extractHashtags() {
    const matched = this.content?.match(/#[^\s#]+/g) || [];
    return matched.map((tag) => tag.replace("#", ""));
  }
}

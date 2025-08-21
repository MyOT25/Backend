export class SearchPostsDto {
  constructor({ query, page, take }) {
    this.query = query?.trim() || "";
    this.page = page ? parseInt(page, 10) : 1; // 기본 1페이지
    this.take = take ? parseInt(take, 10) : 10; // 기본 10개
  }

  get skip() {
    return (this.page - 1) * this.take;
  }
}

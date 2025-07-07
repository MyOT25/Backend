export class DuplicateUserEmailError extends Error {
  errorCode = "U001";

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
    this.statusCode = 400;
  }
}

export class UnauthorizedError extends Error {
  errorCode = "A001";

  constructor(reason = "Unauthorized") {
    super(reason);
    this.reason = reason;
    this.statusCode = 401;
  }
}

// ... 필요한 만큼 추가 정의 가능
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

export class BadRequestError extends Error {
  errorCode = "C001";

  constructor(reason = "잘못된 요청입니다", data = null) {
    super(reason);
    this.reason = reason;
    this.data = data;
    this.statusCode = 400;
  }
}

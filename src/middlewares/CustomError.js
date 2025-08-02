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

export class NotFoundError extends Error {
  errorCode = "N001";

  constructor(reason = "요청한 리소스를 찾을 수 없습니다", data = null) {
    super(reason);
    this.reason = reason;
    this.data = data;
    this.statusCode = 404;
  }
}

export default class CustomError {
  static DuplicateUserEmailError = DuplicateUserEmailError;
  static UnauthorizedError = UnauthorizedError;
  static BadRequestError = BadRequestError;
  static NotFoundError=NotFoundError;
}
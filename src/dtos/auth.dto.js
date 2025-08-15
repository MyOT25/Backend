//로그인 DTO
export class LoginRequestDto {
  constructor(body) {
    this.loginId = body.loginId;
    this.password = body.password;
  }

  validate() {
    if (!this.loginId || !this.password) {
      return {
        valid: false,
        message: "loginId와 password는 필수입니다.",
      };
    }
    return { valid: true };
  }
}

//일반 회원가입 DTO
export class SignUpDto {
  constructor({ username, email, loginId, password, nickname, birthDate }) {
    this.username = username;
    this.email = email;
    this.loginId = loginId;
    this.password = password;
    this.nickname = nickname;
    this.birthDate = birthDate;
  }
}

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
  constructor({
    username,
    email,
    birthDate,
    loginId,
    password,
    nickname,
    profileImage,
    bio,
    isSubscribed,
  }) {
    this.username = username;
    this.email = email;
    this.birthDate = new Date(birthDate);
    this.loginId = loginId;
    this.password = password;
    this.nickname = nickname;
    this.profileImage = profileImage;
    this.bio = bio;
    this.isSubscribed = isSubscribed ?? 0;
  }
}

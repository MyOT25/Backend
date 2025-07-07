import passport from 'passport'

// 인증된 사용자만 접근 가능한 미들웨어
export const authenticateJWT = passport.authenticate("jwt", { session: false });
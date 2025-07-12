import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import prisma from "../config/prismaClient.js"; // pool 대신 prisma

const JWT_SECRET = process.env.JWT_SECRET;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    console.log(" JWT Payload: ", jwt_payload);
    try {
      const user = await prisma.user.findUnique({
        where: { id: jwt_payload.userId }, // payload.userId
      });

      if (user) {
        console.log("✅ 유저 찾음:", user.loginId);
        return done(null, user); // req.user에 유저 정보 저장
      } else {
        console.log("❌ 유저 없음");
        return done(null, false); // 유저 없으면 인증 실패
      }
    } catch (err) {
        console.error("🔥 passport 오류", err);
      return done(err, false);
    }
  })
);

export default passport;

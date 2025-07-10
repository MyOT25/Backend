// import passport from "passport";
// import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
// import pool from "../db.config.js"; // DB 접근용 (예: findById)

// const JWT_SECRET = process.env.JWT_SECRET;

// const opts = {
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: JWT_SECRET,
// };

// passport.use(
//   new JwtStrategy(opts, async (jwt_payload, done) => {
//     try {
//       const user = await pool.users.findById(jwt_payload.id);
//       if (user) {
//         return done(null, user);
//       } else {
//         return done(null, false);
//       }
//     } catch (err) {
//       return done(err, false);
//     }
//   })
// );

// export default passport;
import passport from 'passport';

export const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        resultType: 'FAIL',
        error: {
          errorCode: 'unauthorized',
          reason: '유효하지 않은 토큰입니다.',
        },
        success: null,
      });
    }
    req.user = user; // 👉 직접 req에 넣어줘야 함
    next(); // 다음 미들웨어로 이동
  })(req, res, next);
};

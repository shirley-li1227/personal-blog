const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/db");

function decodeTokenFromHeader(authHeader) {
  const [scheme, token] = (authHeader || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    return {
      id: payload.userId,
      username: payload.username,
    };
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const user = decodeTokenFromHeader(authHeader);
  if (!user) {
    return res.status(401).json({ message: "token 已过期或无效" });
  }

  req.user = user;
  return next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const user = decodeTokenFromHeader(authHeader);
  if (user) {
    req.user = user;
  }
  return next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  findUserByUsername,
  findUserByEmail,
  createUser,
  findUserById,
} = require("../models/userModel");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const PASSWORD_MIN_LENGTH = 6;
const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function validateRegisterInput({ username, email, password }) {
  if (
    typeof username !== "string" ||
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return "用户名长度必须在 3-20 个字符之间";
  }

  if (email && (typeof email !== "string" || !EMAIL_REGEX.test(email))) {
    return "邮箱格式不正确";
  }

  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return "密码长度至少 6 位";
  }

  return null;
}

function buildFallbackEmail(username) {
  const safeUsername = username.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 30) || "user";
  return `${safeUsername}_${Date.now()}@no-email.local`;
}

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body || {};
    const normalizedUsername =
      typeof username === "string" ? username.trim() : username;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const validationError = validateRegisterInput({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUserByUsername = await findUserByUsername(normalizedUsername);
    if (existingUserByUsername) {
      return res.status(409).json({ message: "用户名已存在" });
    }

    if (normalizedEmail) {
      const existingUserByEmail = await findUserByEmail(normalizedEmail);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "邮箱已存在" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const emailToSave = normalizedEmail || buildFallbackEmail(normalizedUsername);
    await createUser({
      username: normalizedUsername,
      email: emailToSave,
      hashedPassword,
    });

    return res.status(201).json({
      message: "注册成功",
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "用户名和密码不能为空" });
    }

    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) {
      return res.status(400).json({ message: "用户名和密码不能为空" });
    }

    const user = await findUserByUsername(normalizedUsername);
    if (!user) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT 配置缺失" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    const userInfo = await findUserById(user.id);

    return res.status(200).json({
      message: "登录成功",
      token,
      user: userInfo,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
};

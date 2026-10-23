import asyncHandler from "express-async-handler";
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT SECRET KEY is not configured");
  }

  return process.env.JWT_SECRET;
};

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
});

const setAuthCookie = (res, userId, jwtSecret) => {
  const token = jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });

  res.cookie("token", token, {
    ...getAuthCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  const jwtSecret = getJwtSecret();
  const existingUser = await userModel.findOne({ email });

  if (existingUser) {
    const error = new Error("User already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = setAuthCookie(res, user._id, jwtSecret);

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: user.email,
    subject: "Welcome to our ecommerce website",
    text: `Welcome to our ecommerce website. Your account has been created with email ${user.email}.`,
  };

  await transporter.sendMail(mailOptions);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    userId: user._id,
    token,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const jwtSecret = getJwtSecret();

  const user = await userModel.findOne({ email: email.trim().toLowerCase() });
  const passwordMatches = user && (await bcrypt.compare(password, user.password));

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = setAuthCookie(res, user._id, jwtSecret);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", getAuthCookieOptions());
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});
import bcrypt from "bcrypt";
import express from "express";
import joi from "joi";
import jwt from "jsonwebtoken";
import { TestError } from "../errors/TestError.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

// express.Rounter() : 모듈식 마운팅 가능한 핸들러를 반환
//  - 마운팅이란?
//      => 어떠한 것을 Available 한 상태로 준비한느 것을 말한다.
//      => 여기선, express 인스턴스를 우리가 사용할 수 있는 형태인 핸들러로 반환해준다는 것!

// 라우팅이란?
//  - (특정 Method와 url) 로 이루어진 클라이언트 요청에 애플리케이션이 응답하는 방법을 결정하는 것
//  - 각 라우트는 하나 이상의 핸들러 함수를 가질 수 있으며, 라우트가 일치할 때 실행된다.

// express 인스턴스 생성
const router = express.Router();

// 기본 라우팅 방법
// app.METHOD(PATH, HANDLER)
//      - METHOD    : HTTP 요청 Method
//      - PATH      : 서버에서의 url 경로
//      - HANDER    : 라우트가 일치할 때 실행되는 함수

// HTTP Method (CRUD)
// 1) GET       : READ
// 2) POST      : CREATE
// 3) PUT       : UPDATE (해당 리소스 모두 Update)
// 4) PATCH     : UPDATE (해당 리소스 일부 Update)
// 5) DELETE    : DELETE

// -----------------------------------------------------------------------------------------------------------

const userSchema = joi.object({
  name: joi.string().alphanum().min(3).max(30).required(),
  password: joi.string().min(6).max(30).required(),
  confirmPassword: joi.string().min(6).max(30).required(),
});

// 1. 회원 가입 API

router.post("/sign-up", async (req, res, next) => {
  try {
    const { name, password, confirmPassword } = await userSchema.validateAsync(
      req.body,
    );

    const checkUserName = await prisma.users.findFirst({
      where: { name },
    });

    if (checkUserName) throw new TestError("checkUserName");

    if (password !== confirmPassword) throw new Error("Not Equal Password");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: "회원가입에 성공하였습니다." });
  } catch (error) {
    next(error);
  }
});

router.post("/sign-in", async (req, res, next) => {
  try {
    const { name, password } = req.body;

    const user = await prisma.users.findFirst({
      where: { name },
      select: {
        name: true,
        password: true,
      },
    });

    if (!user) throw new Error("존재하지 않는 ID 입니다.");

    const hashedPassword = await bcrypt.hash(password, 10);

    if (hashedPassword === user.password)
      throw new Error("비밀번호가 일치하지 않습니다.");

    const accessToken = jwt.sign(
      {
        userId: user.name,
      },
      "custom-secret-key",
      {
        expiresIn: "1h",
      },
    );

    res.header("authorization", `Bearer ${accessToken}`);

    return res.status(200).json({ message: "로그인에 성공하였습니다." });
  } catch (error) {
    next(error);
  }
});

router.get("/users", authMiddleware, async (req, res, next) => {
  console.log(req.user);

  const { name } = req.user;

  const users = await prisma.users.findFirst({
    where: { name: name },
    select: {
      userId: true,
      name: true,
      password: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: users });
});

export default router;

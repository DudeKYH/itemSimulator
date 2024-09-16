import bcrypt from "bcrypt";
import express from "express";
import joi from "joi";
import jwt from "jsonwebtoken";
import { BadRequestError } from "../errors/BadRequestError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import authEssentialMiddleware from "../middlewares/auth.essential.middleware.js";
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

// 회원 가입 API
router.post("/signUp", async (req, res, next) => {
  try {
    const { name, password, confirmPassword } = await userSchema.validateAsync(
      req.body,
    );

    // ID 중복 체크
    const checkUserName = await prisma.users.findFirst({
      where: { name },
    });

    // ID가 이미 존재 => ConflictError
    if (checkUserName) throw new ConflictError("해당 ID가 이미 존재합니다.");

    // password 재확인 불일치 => BadRequestError
    if (password !== confirmPassword)
      throw new BadRequestError("비밀번호가 일치하지 않습니다.");

    // password는 bcrypt로 암호화하여 저장한다.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회원가입 정보를 토대로 Users Table에 생성
    const user = await prisma.users.create({
      data: {
        name,
        password: hashedPassword,
      },
    });

    delete user.password;

    // 회원가입 완료 => http status code : 201
    return res
      .status(201)
      .json({ message: "회원가입에 성공하였습니다.", data: user });
  } catch (error) {
    next(error);
  }
});

// 로그인 API => JWT 발급을 해준다.
// 그리고 클라이언트는 매번 인증 처리 미들 웨어를 통과하기 위해
// 매번 요청 시 JWT를 Request의 Header의 Authorization에 담아야 한다.
router.post("/signIn", async (req, res, next) => {
  try {
    const { name, password } = req.body;

    // 입력받은 Name, Password로 유저가 존재하는지 찾는다.
    const user = await prisma.users.findFirst({
      where: { name },
      select: {
        userId: true,
        name: true,
        password: true,
      },
    });

    if (!user) throw new NotFoundError("해당 ID가 존재하지 않습니다.");

    // 회원가입할 때의 비밀번호 정보와 입력받은 비밀번호가 같은지 검증한다.
    const checkPaswword = await bcrypt.compare(password, user.password);

    if (!checkPaswword)
      throw new BadRequestError("비밀번호가 일치하지 않습니다.");

    // 로그인 정보가 일치한다면, Access Token으로 JsonWebToken을 생성한다.
    // Option으로 expiresIn: "1d" 와 같이 토큰의 만료 기간을 지정할 수 있다.
    const accessToken = jwt.sign(
      {
        userId: +user.userId,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "1d",
      },
    );

    // 생성된 jwt 토큰을 Header의 authorization 필드에 담는다.
    res.header("authorization", `Bearer ${accessToken}`);

    return res.status(200).json({ message: "로그인에 성공하였습니다." });
  } catch (error) {
    next(error);
  }
});

// 유저 정보 조회 API
// 로그인한 유저에 대해서만 자신의 정보를 응답해준다.
router.get("/users", authEssentialMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const users = await prisma.users.findFirst({
    where: { userId: userId },
    select: {
      userId: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: users });
});

export default router;

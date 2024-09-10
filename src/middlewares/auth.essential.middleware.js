import jwt from "jsonwebtoken";
import {
  NotExistAccessTokenError,
  UnauthorizedError,
} from "../errors/AuthError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.cookies;

    if (!authorization)
      throw new NotExistAccessTokenError("Access Token이 존재하지 않습니다.");

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new UnauthorizedError("Access Token의 타입이 올바르지 않습니다.");

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    const userId = decodedToken.userId;

    if (!userId) throw new UnauthorizedError("사용자 인증에 실패하였습니다.");

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!user) throw new NotFoundError("해당 유저가 존재하지 않습니다.");

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

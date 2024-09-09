import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {
    console.log(req.headers);

    const { authorization } = req.headers;

    if (!authorization) throw new Error("토큰이 존재하지 않습니다.");

    const [tokenType, token] = authorization.split(" ");

    if (tokenType === "bearer")
      throw new Error("토큰의 타입이 Bearer 형식이 아닙니다.");

    const decodedToken = jwt.verify(token, "custom-secret-key");

    const userId = decodedToken.userId;

    if (!userId) throw new Error("로그인이 필요합니다.");

    console.log("----------", userId);

    const user = await prisma.users.findFirst({
      where: { name: userId },
    });

    if (!user) throw new Error("토큰 사용자가 존재하지 않습니다.");

    req.user = user;

    console.log("인증 미들 웨어 통과");

    next();
  } catch (error) {
    //next(error);

    return res.status(400).json({ message: error.message });
  }
}

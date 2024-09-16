import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new Error();
    }

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer") throw new Error();

    if (!token) throw new Error();

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    const userId = decodedToken.userId;

    if (!userId) throw new Error();

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!user) throw new Error();

    req.user = user;

    next();
  } catch (error) {
    next();
  }
}

import express from "express";
import joi from "joi";
import { ForbiddenError } from "../errors/ForbiddenError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import authEssentialMiddleware from "../middlewares/auth.essential.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

const characterIdSchema = joi.object({
  characterId: joi.number().positive().integer().required(),
});

router.post(
  "/makeMoney/:characterId",
  authEssentialMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { characterId } = await characterIdSchema.validateAsync(req.params);

      let character = await prisma.characters.findFirst({
        where: { characterId },
        select: {
          characterId: true,
          userId: true,
          money: true,
        },
      });

      if (!character) throw new NotFoundError("캐릭터 조회에 실패하였습니다.");

      if (character.userId !== userId)
        throw new ForbiddenError("유저의 캐릭터가 아니므로 접근이 불가합니다.");

      // 검증이 끝났으면 character의 money를 100 더해준다.
      character = await prisma.characters.update({
        where: { characterId },
        data: {
          money: { increment: 100 },
        },
      });

      return res
        .status(200)
        .json({ message: "돈을 획득하였습니다.", money: character.money });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

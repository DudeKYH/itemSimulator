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

router.get(
  "/inventories/:characterId",
  authEssentialMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { characterId } = await characterIdSchema.validateAsync(req.params);

      const character = await prisma.characters.findFirst({
        where: { characterId },
        select: {
          userId: true,
          inventories: {
            where: {
              characterId,
            },
            select: {
              itemId: true,
              amount: true,
              items: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!character) throw new NotFoundError("캐릭터 조회에 실패하였습니다.");

      if (character.userId !== userId)
        throw new ForbiddenError("보유한 캐릭터가 아닙니다.");

      const data = character.inventories.map((inventory) => {
        return {
          itemCode: inventory.itemId,
          itemName: inventory.items["name"],
          count: inventory.amount,
        };
      });

      return res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

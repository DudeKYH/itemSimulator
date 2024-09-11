import express from "express";
import joi from "joi";
import { ConflictError } from "../errors/ConflictError.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import authEssentialMiddleware from "../middlewares/auth.essential.middleware.js";
import authInessentialMiddleware from "../middlewares/auth.inessential.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

const characterNameSchema = joi.object({
  name: joi.string().min(3).max(30).required(),
});

const characterIdSchema = joi.object({
  characterId: joi.number().positive().integer().required(),
});

router.post("/characters", authEssentialMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name } = await characterNameSchema.validateAsync(req.body);

    // 캐릭터 Name 중복체크
    const checkCharacter = await prisma.characters.findFirst({
      where: { name: name },
    });

    // 이미 name의 character가 존재 => ConflictError
    if (checkCharacter)
      throw new ConflictError(`${name} 캐릭터가 이미 존재합니다.`);

    const character = await prisma.characters.create({
      data: {
        name: name,
        userId: userId,
      },
    });

    return res.status(201).json({
      message: `${character.name} 캐릭터를 생성하였습니다.`,
      data: { characterId: character.characterId },
    });
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/characters/:characterId",
  authEssentialMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { characterId } = await characterIdSchema.validateAsync(req.params);

      const character = await prisma.characters.findFirst({
        where: { characterId },
      });

      if (!character) throw new NotFoundError("캐릭터 조회에 실패하였습니다.");

      if (character.userId !== userId)
        throw new ForbiddenError("자신의 캐릭터만 삭제할 수 있습니다.");

      const deleteCharacter = await prisma.characters.delete({
        where: { characterId },
      });

      return res
        .status(200)
        .json({ message: `${deleteCharacter.name} 캐릭터를 삭제하였습니다.` });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/characters/:characterId",
  authInessentialMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const { characterId } = await characterIdSchema.validateAsync(req.params);

      let character = await prisma.characters.findFirst({
        where: { characterId },
        select: {
          userId: true,
          name: true,
          health: true,
          power: true,
          money: true,
        },
      });

      if (!character) {
        throw new NotFoundError("캐릭터 조회에 실패하였습니다.");
      }

      // 로그인한 유저의 캐릭터가 아니라면 money는 보여주면 안된다.
      if (character.userId !== userId) {
        delete character.money;
      }
      delete character.userId;

      return res.status(200).json({ data: character });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

import express from "express";
import joi from "joi";
import { BadRequestError } from "../errors/BadRequestError.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import authEssentialMiddleware from "../middlewares/auth.essential.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

const characterIdSchema = joi.object({
  characterId: joi.number().positive().integer().required(),
});

const itemSchema = joi.object({
  itemCode: joi.number().positive().integer().required(),
});

// CharacterId의 캐릭터 장비창을 조회하는 API
router.get("/equipments/:characterId", async (req, res, next) => {
  try {
    const { characterId } = await characterIdSchema.validateAsync(req.params);

    const character = await prisma.characters.findFirst({
      where: { characterId },
      select: {
        userId: true,
        equipments: {
          select: {
            itemId: true,
            items: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!character) throw new NotFoundError("캐릭터 조회에 실패하였습니다.");

    const data = character.equipments.map((equipment) => {
      return {
        itemCode: equipment.itemId,
        itemName: equipment.items["name"],
      };
    });

    return res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
});

// 아이템 장착 API
router.post(
  "/equipments/:characterId",
  authEssentialMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { characterId } = await characterIdSchema.validateAsync(req.params);
      const { itemCode } = await itemSchema.validateAsync(req.body);

      // 캐릭터 조회
      let character = await prisma.characters.findFirst({
        where: { characterId },
        select: {
          characterId: true,
          userId: true,
          inventories: true,
          equipments: true,
        },
      });

      if (!character) throw new NotFoundError("캐릭터 조회에 실패하였습니다.");

      if (character.userId !== userId)
        throw new ForbiddenError("유저의 캐릭터가 아니므로 접근이 불가합니다.");

      // 장착할 아이템 검증
      const item = await prisma.items.findFirst({
        where: { itemId: itemCode },
      });

      if (!item) throw new NotFoundError("아이템 조회에 실패하였습니다.");

      // 장착할 아이템이 인벤토리에 있는지 검증
      let findInventory = character.inventories.find((inventory) => {
        return inventory.itemId === itemCode;
      });

      if (!findInventory)
        throw new BadRequestError("해당 아이템이 인벤토리에 없습니다.");

      // 장착할 아이템을 이미 장착했는지 검증
      const findEquipment = character.equipments.find((equipment) => {
        return equipment.itemId === itemCode;
      });

      if (findEquipment)
        throw new BadRequestError("해당 아이템을 이미 장착 중입니다.");

      // 이제 장착을 시작한다.
      const equipment = await prisma.equipments.create({
        data: {
          characterId,
          itemId: itemCode,
        },
      });

      // 장착 아이템의 스탯을 캐릭터에 반영한다.
      character = await prisma.characters.update({
        where: { characterId },
        data: {
          health: { increment: item.health },
          power: { increment: item.power },
        },
        include: {
          inventories: true,
          equipments: true,
        },
      });

      // 인벤토리에서 장착한 아이템의 수량을 빼준다(1개라면 삭제)
      findInventory = character.inventories.find((inventory) => {
        return inventory.itemId === itemCode;
      });

      // 2개 이상이라면 아이템 수량을 1개 감소
      if (findInventory.amount > 1) {
        await prisma.inventories.update({
          where: { inventoryId: findInventory.inventoryId },
          data: {
            amount: { decrement: 1 },
          },
        });
      }
      // 1개라면 아이템을 인벤토리에서 삭제
      else {
        await prisma.inventories.delete({
          where: { inventoryId: findInventory.inventoryId },
        });
      }

      return res
        .status(201)
        .json({ message: `${item.name} 아이템을 장착하였습니다.` });
    } catch (error) {
      next(error);
    }
  },
);

// 아이템 탈착 API
router.delete(
  "/equipments/:characterId",
  authEssentialMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { characterId } = await characterIdSchema.validateAsync(req.params);
      const { itemCode } = await itemSchema.validateAsync(req.body);

      // 캐릭터 조회
      let character = await prisma.characters.findFirst({
        where: { characterId },
        select: {
          characterId: true,
          userId: true,
          inventories: true,
          equipments: true,
        },
      });

      if (!character) throw new NotFoundError("캐릭터 조회에 실패하였습니다.");

      if (character.userId !== userId)
        throw new ForbiddenError("유저의 캐릭터가 아니므로 접근이 불가합니다.");

      // 탈착할 아이템 검증
      const item = await prisma.items.findFirst({
        where: { itemId: itemCode },
      });

      if (!item) throw new NotFoundError("아이템 조회에 실패하였습니다.");

      // 탈착할 아이템이 장비창에 있는지 검증
      const findEquipment = character.equipments.find((equipment) => {
        return equipment.itemId === itemCode;
      });

      if (!findEquipment)
        throw new BadRequestError("해당 아이템을 장착 중이지 않습니다.");

      // 이제 탈착을 시작한다.
      // 먼저 장비창에서 아이템을 삭제한다.
      const equipment = await prisma.equipments.delete({
        where: { equipmentId: findEquipment.equipmentId },
      });

      // 탈착 아이템의 스탯만큼 캐릭터 스탯을 감소시킨다.
      character = await prisma.characters.update({
        where: { characterId },
        data: {
          health: { decrement: item.health },
          power: { decrement: item.power },
        },
        include: {
          inventories: true,
          equipments: true,
        },
      });

      // 인벤토리에 탈착한 아이템을 다시 넣어준다
      const findInventory = character.inventories.find((inventory) => {
        return inventory.itemId === itemCode;
      });

      // 인벤토리에 해당 아이템이 존재한다면 아이템 수량을 1개 증가시켜준다
      if (findInventory) {
        await prisma.inventories.update({
          where: { inventoryId: findInventory.inventoryId },
          data: {
            amount: { increment: 1 },
          },
        });
      }
      // 인벤토리에 해당 아이템이 존재없다면 아이템을 생성해서 넣어준다.
      else {
        await prisma.inventories.create({
          data: {
            characterId,
            itemId: itemCode,
            amount: 1,
          },
        });
      }

      return res
        .status(200)
        .json({ message: `${item.name} 아이템을 탈착하였습니다.` });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

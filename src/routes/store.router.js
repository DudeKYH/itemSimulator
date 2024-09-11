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

const itemSchema = joi.array().items(
  joi.object({
    itemCode: joi.number().positive().integer().required(),
    itemCount: joi.number().positive().integer().required(),
  }),
);

router.post(
  "/store/:characterId",
  authEssentialMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { characterId } = await characterIdSchema.validateAsync(req.params);
      const purchaseItemArr = await itemSchema.validateAsync(req.body);

      let character = await prisma.characters.findFirst({
        where: { characterId },
        select: {
          characterId: true,
          userId: true,
          money: true,
          inventories: {
            where: {
              characterId,
            },
          },
        },
      });

      if (!character) throw new NotFoundError("캐릭터 조회에 실패하였습니다.");

      if (character.userId !== userId)
        throw new ForbiddenError("유저의 캐릭터가 아니므로 접근이 불가합니다.");

      let totalPrice = 0;

      for (const purchaseItem of purchaseItemArr) {
        const itemCode = purchaseItem.itemCode;
        const itemCount = purchaseItem.itemCount;

        const item = await prisma.items.findFirst({
          where: { itemId: itemCode },
        });

        if (!item)
          throw new NotFoundError("구매할 아이템 조회에 실패했습니다.");

        totalPrice += itemCount * item.price;
      }

      if (character.money < totalPrice)
        throw new BadRequestError("캐릭터의 Money가 부족합니다.");

      for (const purchaseItem of purchaseItemArr) {
        const findInventory = character.inventories.find((inventory) => {
          return inventory.itemId === purchaseItem.itemCode;
        });

        if (!findInventory) {
          await prisma.inventories.create({
            data: {
              characterId,
              itemId: purchaseItem.itemCode,
              amount: purchaseItem.itemCount,
            },
          });
        } else {
          await prisma.inventories.update({
            where: {
              inventoryId: findInventory.inventoryId,
            },
            data: {
              amount: { increment: purchaseItem.itemCount },
            },
          });
        }
      }

      character = await prisma.characters.update({
        where: { characterId },
        data: {
          money: character.money - totalPrice,
        },
      });

      return res.status(201).json({
        message: "아이템을 모두 구입했습니다.",
        money: character.money,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/store/:characterId",
  authEssentialMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { characterId } = await characterIdSchema.validateAsync(req.params);
      const sellItemArr = await itemSchema.validateAsync(req.body);

      let character = await prisma.characters.findFirst({
        where: { characterId },
        select: {
          characterId: true,
          userId: true,
          money: true,
          inventories: {
            where: {
              characterId,
            },
          },
        },
      });

      if (!character) throw new NotFoundError("캐릭터 조회에 실패하였습니다.");

      if (character.userId !== userId)
        throw new ForbiddenError("유저의 캐릭터가 아니므로 접근이 불가합니다.");

      // 요청 받은 판매할 아이템 검증
      for (const sellItem of sellItemArr) {
        const sellItemCode = sellItem.itemCode;
        const sellItemCount = sellItem.itemCount;

        // 인벤토리에서 판매할 아이템 Code와 일치하고 판매할 수량만큼 갖고 있는지 검증한다..
        const findInventory = character.inventories.find((inventory) => {
          console.log(inventory.amount, inventory.itemId);
          console.log(sellItemCount, sellItemCode);
          return (
            inventory.amount >= sellItemCount &&
            inventory.itemId === sellItemCode
          );
        });

        // 보유 수량보다 판매 수량이 초과하거나 판매할 아이템이 없으면 잘못된 요청으로 거절한다.
        if (!findInventory)
          throw new BadRequestError("아이템 판매 요청이 거절되었습니다.");

        // 아이템 가격 조회
        const item = await prisma.items.findFirst({
          where: { itemId: sellItem.itemCode },
          select: {
            price: true,
          },
        });

        if (!item) throw new NotFoundError("아이템 조회에 실패하였습니다.");

        sellItem.price = Math.floor(item.price * 0.6);
      }

      // 검증이 끝났으면 이제 요청한 아이템들을 판다.
      for (const sellItem of sellItemArr) {
        const sellItemCode = sellItem.itemCode;
        const sellItemCount = sellItem.itemCount;
        const sellItemPrice = sellItem.price;

        const findInventory = character.inventories.find((inventory) => {
          console.log(inventory.itemId, sellItemCode);
          return inventory.itemId === sellItemCode;
        });

        // 이제 판매할 아이템은 인벤토리에서 삭제하거나 수량을 빼준다.
        // 판매할 수량과 보유 수량이 같은 경우 : 삭제
        if (findInventory.amount === sellItemCount) {
          await prisma.inventories.delete({
            where: { inventoryId: findInventory.inventoryId },
          });
        } else {
          // 판매할 수량보다 보유 수량이 많은 경우 : 수정(판매수량만큼 빼줘서)
          await prisma.inventories.update({
            where: { inventoryId: findInventory.inventoryId },
            data: {
              amount: { decrement: sellItemCount },
            },
          });
        }

        // 캐릭터의 Money를 판매가격만큼 더해준 값으로 수정한다.
        character = await prisma.characters.update({
          where: { characterId },
          data: {
            money: { increment: sellItemPrice * sellItemCount },
          },
          include: {
            inventories: true,
          },
        });
      }

      return res.status(200).json({
        message: "아이템을 모두 판매하였습니다.",
        money: character.money,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

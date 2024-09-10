import express from "express";
import joi from "joi";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

const itemSchema = joi.object({
  itemName: joi.string().min(2).max(30).required(),
  itemStat: joi
    .object({
      health: joi.number().positive().integer().required(),
      power: joi.number().positive().integer().required(),
    })
    .required(),
  itemPrice: joi.number().positive().integer().required(),
});

const itemCodeSchema = joi.object({
  itemCode: joi.number().positive().integer().required(),
});

const itemModifySchema = joi.object({
  itemName: joi.string().min(2).max(30),
  itemStat: joi.object({
    health: joi.number().positive().integer(),
    power: joi.number().positive().integer(),
  }),
});

router.post("/items", async (req, res, next) => {
  try {
    const { itemName, itemStat, itemPrice } = await itemSchema.validateAsync(
      req.body,
    );

    // 아이템의 이름 중복 체크
    const checkItem = await prisma.items.findFirst({
      where: { name: itemName },
    });

    if (checkItem)
      throw new ConflictError(`${itemName} 아이템이 이미 존재합니다.`);

    const item = await prisma.items.create({
      data: {
        name: itemName,
        health: itemStat.health,
        power: itemStat.power,
        price: itemPrice,
      },
    });

    return res.status(201).json({
      message: `${item.name} 아이템을 생성했습니다.`,
      data: { itemCode: item.itemId, itemName: item.name },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/items", async (req, res, next) => {
  try {
    const items = await prisma.items.findMany({
      select: {
        itemId: true,
        name: true,
        price: true,
      },
    });

    return res.status(200).json({ data: items });
  } catch (error) {
    next(error);
  }
});

router.get("/items/:itemCode", async (req, res, next) => {
  try {
    const { itemCode } = await itemCodeSchema.validateAsync(req.params);

    const item = await prisma.items.findFirst({
      where: { itemId: itemCode },
      select: {
        itemId: true,
        name: true,
        health: true,
        power: true,
        price: true,
      },
    });

    if (!item) throw new NotFoundError("아이템 조회에 실패하였습니다.");

    return res.status(200).json({ data: item });
  } catch (error) {
    next(error);
  }
});

router.patch("/items/:itemCode", async (req, res, next) => {
  try {
    const { itemCode } = await itemCodeSchema.validateAsync(req.params);
    const { itemName, itemStat } = await itemModifySchema.validateAsync(
      req.body,
    );

    const item = await prisma.items.update({
      where: { itemId: itemCode },
      data: {
        name: itemName,
        health: itemStat?.health,
        power: itemStat?.power,
      },
    });

    if (!item) throw new NotFoundError("아이템 조회에 실패하였습니다.");

    return res
      .status(200)
      .json({ message: `${item.itemId} 아이템이 수정되었습니다.`, data: item });
  } catch (error) {
    next(error);
  }
});

export default router;

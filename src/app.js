import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import errorHandlingMiddleware from "./middlewares/errorHandling.middleware.js";
import CharacterRouter from "./routes/characters.router.js";
import EquipmentRouter from "./routes/equipments.router.js";
import InvenrotyRouter from "./routes/inventories.router.js";
import ItemRouter from "./routes/items.router.js";
import MakeMoneyRouter from "./routes/makeMoney.router.js";
import StoreRouter from "./routes/store.router.js";
import UserRouter from "./routes/users.router.js";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT ? 3010 : process.env.SERVER_PORT;

app.use(express.json());
app.use(cookieParser());

app.use("/api", [
  UserRouter,
  CharacterRouter,
  ItemRouter,
  StoreRouter,
  InvenrotyRouter,
  EquipmentRouter,
  MakeMoneyRouter,
]);

app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸습니다.");
});

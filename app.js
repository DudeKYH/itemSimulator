import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import errorHandlingMiddleware from "./src/middlewares/errorHandling.middleware.js";
import UsersRouter from "./src/routes/users.router.js";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

//app.use(authMiddleware);

app.use(express.json());
app.use(cookieParser());

app.use("/api", [UsersRouter]);

app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸습니다.");
});

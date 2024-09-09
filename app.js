import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸습니다.");
});

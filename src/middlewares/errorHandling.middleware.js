export default function (err, req, res, next) {
  console.error("에러 미들웨어 호출", err);

  if (err.isJoi)
    return res
      .status(400)
      .json({ errorNmae: err.name, errorMessage: err.message });

  return res
    .status(err.status === undefined ? 400 : err.status)
    .json({ errorName: err.name, errorMessage: err.message });
}

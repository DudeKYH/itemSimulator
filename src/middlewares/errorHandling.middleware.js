export default function (err, req, res, next) {
  if (err.isJoi)
    return res
      .status(400)
      .json({ errorNmae: err.name, errorMessage: err.message });

  if (err.name === "TokenExpiredError")
    return res.status(401).json({
      errorNmae: err.name,
      errorMessage: "AccessToken이 만료되었습니다. 다시 로그인해주세요",
    });

  return res
    .status(err.status === undefined ? 500 : err.status)
    .json({ errorName: err.name, errorMessage: err.message });
}

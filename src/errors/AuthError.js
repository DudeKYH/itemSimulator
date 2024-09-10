export class NotExistAccessTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotExistAccessTokenError";
    this.status = 400;
  }
}

export class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

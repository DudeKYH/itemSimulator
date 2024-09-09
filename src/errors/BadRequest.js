export class BadRequest extends Error {
  constructor(message) {
    this.name = "BadRequest";
    this.status = 400;
  }
}

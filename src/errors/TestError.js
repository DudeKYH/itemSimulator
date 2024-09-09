export class TestError extends Error {
  constructor(message) {
    super(message);
    this.name = "TestError";
    this.status = 408;
  }
}

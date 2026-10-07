export class HttpException extends Error {
  public status: number;
  public data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

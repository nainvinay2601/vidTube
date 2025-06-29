class ApiError extends Error {
  constructor(
    statusCode,
    message = " Something Went Wrong :(",
    errors = [],
    stack = "string"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
// this will standardize our api error response
export { ApiError };

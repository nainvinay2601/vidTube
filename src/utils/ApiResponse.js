// error response and api response are always in a class format

class ApiResponse {
  constructor(statusCode, data, message = "Successs") {
    ((this.statusCode = statusCode),
      (this.data = data),
      (this.message = message),
      (this.success = statusCode < 400));
  }
}
// this will standardize our api response 
export { ApiResponse };

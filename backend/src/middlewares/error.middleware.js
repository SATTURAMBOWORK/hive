import { StatusCodes } from "http-status-codes";

function notFoundHandler(req, res) {
  res.status(StatusCodes.NOT_FOUND).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error.message || "Something went wrong";

  res.status(statusCode).json({ message });
}

export { notFoundHandler, errorHandler };

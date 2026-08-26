/**
 * 404 Route Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

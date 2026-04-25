function notFoundHandler(req, res) {
  res.status(404).json({
    message: "Route not found",
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "图片大小不能超过 5MB",
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

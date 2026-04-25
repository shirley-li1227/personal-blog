function getHealth(req, res) {
  res.status(200).json({
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
};

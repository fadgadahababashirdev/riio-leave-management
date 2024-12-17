const jwt = require('jsonwebtoken');
const authorization = async (req, res, next) => {
  try {
    const token = req.headers['authorization'];
    if (!token) {
      return res
        .status(400)
        .json({ status: 'failed', message: 'Please login first' });
    } else {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(400)
            .json({
              status: 'Failed',
              message: 'invalid token or has expired',
            });
        }
        req.user = decoded.userId;
        next();
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'failed', message: error.message });
  }
};

module.exports = authorization;

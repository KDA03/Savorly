const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Access denied. No token provided.',
          status: 401
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        error: {
          message: 'User not found.',
          status: 404
        }
      });
    }

    req.user = {
      uid: decoded.uid,
      ...userDoc.data()
    };
    next();
  } catch (error) {
    return res.status(403).json({
      error: {
        message: 'Invalid token.',
        status: 403
      }
    });
  }
};

module.exports = { authenticateToken }; 
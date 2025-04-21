const jwt = require('jsonwebtoken');
exports.authenticateUser = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    console.log('Authorization Header:', authorizationHeader);

    if (!authorizationHeader) {
      return res.status(401).json({ error: 'Authorization header ไม่พบ' });
    }

    // ตรวจสอบรูปแบบ Bearer
    if (!authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'รูปแบบ Authorization header ไม่ถูกต้อง' });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token || token.length === 0) {
      return res.status(401).json({ error: 'Token ไม่ถูกต้อง' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log('Decoded Token:', decoded);

    if (!decoded.userId) {
      return res.status(401).json({ error: 'Token ไม่มีข้อมูล ID' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token Error:', error.name, error.message);
    return res.status(401).json({ 
      error: 'Token ไม่ถูกต้อง หรือหมดอายุ',
      details: error.message 
    });
  }
};

// Middleware สำหรับตรวจสอบว่าเป็น Admin หรือไม่
exports.isAdmin = (req, res, next) => {
  // ตรวจสอบว่า user มีข้อมูล roleId หรือไม่
  const { roleId } = req.user;
  
  if (!roleId) {
    return res.status(403).json({ error: 'ข้อมูล roleId ไม่พบใน Token' });
  }

  // ตรวจสอบว่า roleId เป็น 2 หรือไม่ (Admin)
  if (roleId !== 2) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้' });
  }

  
  next();
};

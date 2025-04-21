const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

// เพิ่มการกำหนดชื่อฟิลด์และการตรวจสอบไฟล์  
const fileFilter = (req, file, cb) => {
  // อนุญาตเฉพาะไฟล์รูปภาพ
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น'), false);
  }
};

const upload = multer({
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ที่ 5MB
  }
});

module.exports = upload;
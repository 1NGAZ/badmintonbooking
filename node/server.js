const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const path = require('path');
const authRouter = require("./routes/auth");
const userRoutes = require("./routes/user");
const reservationRoutes = require('./routes/reservation');
const timeSlotRoutes = require('./routes/timeslot');
const approvalRoutes = require('./routes/approvalRoutes');
const { createTimeSlotsForDateController } = require('./controllers/timeSlotController');
const historyRoutes = require('./routes/historyRoutes');
const courtRoutes = require("./routes/courtRoutes");
const courteditname = require("./routes/courteditname");
const roleRoutes = require('./routes/roleRoutes'); 
const app = express();
const port = 8000;
const reportsRouter = require('./routes/reports');
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use("/history",historyRoutes);
app.use("/auth", authRouter);
app.use("/user", userRoutes);
app.use('/reservation', reservationRoutes);
app.use('/timeslot', timeSlotRoutes);
app.use('/approval', approvalRoutes);
app.use("/courts", courtRoutes);
app.use("/courteditname", courteditname);
app.use('/roles', roleRoutes); 
app.use('/reports', reportsRouter);
// ให้บริการไฟล์จากโฟลเดอร์ uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Custom error handling for Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    return res.status(400).json({ error: 'ไฟล์ไม่ถูกต้องหรือเกินขนาดที่กำหนด' });
  } else if (err) {
    // Handle other errors
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
  next();
});
// API สำหรับแสดงไฟล์ (ใช้ GET method)
app.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('ไฟล์ไม่พบ');
    }
  });
});


const cron = require('node-cron');

// เรียกฟังก์ชันทันทีเมื่อเริ่มต้นแอปพลิเคชัน
(async () => {
  try {
    console.log('กำลังสร้าง time slots สำหรับ 7 วันถัดไปเป็นครั้งแรก...');
    await createTimeSlotsForDateController();
    console.log('สร้าง time slots ครั้งแรกสำเร็จ');
  } catch (error) {
    console.error('Initial timeslot creation failed:', error);
  }
})();

// ตั้งเวลาให้ทำงานทุกวันตอนเที่ยงคืน
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('กำลังสร้าง time slots สำหรับ 7 วันถัดไป...');
    await createTimeSlotsForDateController();
    console.log('สร้าง time slots สำเร็จ');
  } catch (error) {
    console.error('Daily timeslot creation failed:', error);
  }
});








app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

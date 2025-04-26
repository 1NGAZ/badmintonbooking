const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
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
const promotionRoutes = require('./routes/promotion');

const app = express();
const port = process.env.PORT || 3000;
const reportsRouter = require('./routes/reports');


async function main() {
  await prisma.$connect();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error('Server startup error:', error);
});



app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.get('/', (req, res) => {
  res.send('Hello World!');
});



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
app.use('/promotions', promotionRoutes);
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
// (async () => {
//   try {
//     console.log('กำลังสร้าง time slots สำหรับ 7 วันถัดไปเป็นครั้งแรก...');
//     await createTimeSlotsForDateController();
//     console.log('สร้าง time slots ครั้งแรกสำเร็จ');
//   } catch (error) {
//     console.error('Initial timeslot creation failed:', error);
//   }
// })();

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


// ฟังก์ชันสำหรับสมัครแอดมิน
const ensureAdminExists = async () => {
  const email = process.env.USER;
  const password = process.env.PASS;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      console.log(`✔️ Admin user (${email}) already exists`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: { email, password: hashedPassword },
      });

      let memberRole = await prisma.role.findUnique({
        where: { name: 'แอดมิน' },
      });

      if (!memberRole) {
        memberRole = await prisma.role.create({
          data: { name: 'แอดมิน' },
        });
      }

      await prisma.userRoles.create({
        data: {
          userId: newUser.id,
          roleId: memberRole.id,
        },
      });

      console.log(`✅ Created admin user: ${email}`);
    });
  } catch (err) {
    console.error('❌ Error ensuring admin exists:', err);
  }
};
ensureAdminExists();

// ฟังก์ชันสำหรับสร้างสถานะ
const ensureReservationStatuses = async () => {
  const statuses = [
    process.env.STATUS_1,
    process.env.STATUS_2,
    process.env.STATUS_3,
    process.env.STATUS_4,
    process.env.STATUS_5,
  ];

  try {
    for (const name of statuses) {
      const existing = await prisma.reservation_status.findFirst({ where: { name } });
      if (!existing) {
        await prisma.reservation_status.create({ data: { name } });
        console.log(`✅ สร้างสถานะใหม่: ${name}`);
      } else {
        console.log(`✔️ มีสถานะอยู่แล้ว: ${name}`);
      }
    }
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาดในการสร้างสถานะ:", err);
  }
};
ensureReservationStatuses();




app.get('/health', (req, res) => res.status(200).send('OK'));
try {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`)
  })
} catch (error) {
  console.error('Server error:', error);
}


// controllers/userController.js
const jwt = require("jsonwebtoken");
const { getUserById } = require("../models/userModel");
const SECRET_KEY = process.env.JWT_SECRET_KEY;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const selectUserId = async (req, res) => {
  try {
    // ดึง token จาก cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(403).json({ message: "No token provided" });
    }

    // ตรวจสอบและ decode token
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // ค้นหาผู้ใช้จาก userId พร้อม include userRoles และ role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true, // รวมข้อมูล role (เช่น id, name)
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ส่งข้อมูลผู้ใช้กลับไปยัง client
    res.json(user);
  } catch (error) {
    console.error("Error fetching data from database: ", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Failed to authenticate token" });
    }
    res.status(500).json({ error: "Error fetching data from database" });
  } finally {
    // ปิดการเชื่อมต่อ Prisma (ถ้าจำเป็น)
    await prisma.$disconnect();
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        error: 'ไม่พบ ID ผู้ใช้'
      });
    }

    const { fname, lname, phone } = req.body;

    // สร้างอ็อบเจกต์ data สำหรับอัปเดต
    const data = {};
    if (fname) data.fname = fname.trim();
    if (lname) data.lname = lname.trim();
    if (phone) data.phone = phone.trim();

    // ตรวจสอบว่ามีฟิลด์ที่ต้องการอัปเดตหรือไม่
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: 'ไม่มีข้อมูลสำหรับอัปเดต'
      });
    }

    // อัปเดตข้อมูล
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data,
      select: {
        id: true,
        fname: true,
        lname: true,
        email: true,
        phone: true
      }
    });

    return res.status(200).json({
      message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }

    // ปรับโครงสร้างข้อมูลให้ง่ายต่อการใช้งาน
    const userProfile = {
      id: user.id,
      email: user.email,
      fname: user.fname,
      lname: user.lname,
      phone: user.phone,
      roles: user.userRoles.map(ur => ur.role)
    };

    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลโปรไฟล์ได้" });
  } finally {
    await prisma.$disconnect();
  }
};





module.exports = { selectUserId, updateUser , getProfile };

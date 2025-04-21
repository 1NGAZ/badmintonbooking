// controllers/roleController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ดึงข้อมูลผู้ใช้ทั้งหมดพร้อมบทบาท
const getAllUsers = async (req, res) => {
  try {
    console.log('User in request:', req.user); // ตรวจสอบว่า req.user มีข้อมูลถูกต้อง
    
    // ตรวจสอบการเรียกใช้ prisma
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    // ปรับโครงสร้างข้อมูลให้ตรงกับที่ frontend ต้องการ
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      fname: user.fname,
      lname: user.lname,
      phone: user.phone,
      roles: user.userRoles.map(ur => ur.role)
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ error: error.message });
  }
};

// ดึงข้อมูลบทบาททั้งหมด
const getAllRoles = async (req, res) => {
  try {
    // ตรวจสอบว่าผู้ใช้เป็น admin
    // แก้ไขการตรวจสอบเพื่อป้องกัน undefined
    const isAdmin = req.user && req.user.roles && req.user.roles.some(role => role.name === "admin");
    if (!isAdmin) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึงข้อมูล" });
    }

    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลบทบาทได้" });
  }
};

// กำหนดบทบาทให้ผู้ใช้
const assignRole = async (req, res) => {
  try {
    console.log('User in request:', req.user); // ตรวจสอบข้อมูลผู้ใช้ทั้งหมด
    
    // แก้ไขการตรวจสอบให้ใช้ roleId แทน roles
    const isAdmin = req.user && req.user.roleId === 2;
    
    if (!isAdmin) {
      console.log('User is not admin, roleId:', req.user?.roleId);
      return res.status(403).json({ error: "ไม่มีสิทธิ์กำหนดบทบาท" });
    }

    const { userId, roleId } = req.body;
    console.log('Request body:', req.body);

    // ตรวจสอบว่าผู้ใช้พยายามแก้ไขตัวเองหรือไม่
    if (parseInt(userId) === req.user.userId) { // เปลี่ยนจาก req.user.id เป็น req.user.userId
      return res.status(403).json({ error: "ไม่สามารถเปลี่ยนแปลงสิทธิ์ของตัวเองได้" });
    }

    // ลบบทบาทเดิมทั้งหมด
    await prisma.userRoles.deleteMany({
      where: { userId: parseInt(userId) }
    });

    // เพิ่มบทบาทใหม่
    await prisma.userRoles.create({
      data: {
        userId: parseInt(userId),
        roleId: parseInt(roleId)
      }
    });

    res.json({ message: "กำหนดบทบาทสำเร็จ" });
  } catch (error) {
    console.error("Error assigning role:", error);
    res.status(500).json({ error: "ไม่สามารถกำหนดบทบาทได้", details: error.message });
  }
};

// ลบบทบาทของผู้ใช้
const removeRole = async (req, res) => {
  try {
    // ตรวจสอบว่าผู้ใช้เป็น admin
    // แก้ไขการตรวจสอบเพื่อป้องกัน undefined
    const isAdmin = req.user && req.user.roles && req.user.roles.some(role => role.name === "admin");
    if (!isAdmin) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์ลบบทบาท" });
    }

    const { userId, roleId } = req.body;
    
    // ลบบทบาทของผู้ใช้
    await prisma.userRoles.delete({
      where: {
        userId_roleId: {
          userId: parseInt(userId),
          roleId: parseInt(roleId)
        }
      }
    });

    res.json({ message: "ลบบทบาทสำเร็จ" });
  } catch (error) {
    console.error("Error removing role:", error);
    res.status(500).json({ error: "ไม่สามารถลบบทบาทได้" });
  }
};

module.exports = {
  getAllUsers,
  getAllRoles,
  assignRole,
  removeRole
};
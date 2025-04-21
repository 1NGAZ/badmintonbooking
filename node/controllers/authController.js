const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

// ฟังก์ชันสำหรับเข้าสู่ระบบ
const login = async (req, res) => {
  const { email, password } = req.body;

  console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({ error: "โปรดกรอกอีเมลและรหัสผ่าน" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง" });
  }

  try {
    // ดึงข้อมูลผู้ใช้พร้อมกับการเชื่อมโยงข้อมูล userRoles
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: true },
    });

    if (!user) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // ตรวจสอบว่า userRoles มีข้อมูลหรือไม่
    if (!user.userRoles || user.userRoles.length === 0) {
      return res.status(401).json({ error: "ผู้ใช้ไม่มีบทบาท (role)" });
    }

    // ตรวจสอบรหัสผ่าน
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // ดึง roleId จาก userRoles (ถ้ามีหลาย role ให้เลือก role แรก)
    const roleId = user.userRoles[0]?.roleId;
    if (!roleId) {
      return res.status(401).json({ error: "ไม่พบ roleId ในข้อมูลผู้ใช้" });
    }


    console.log('Role ID:', roleId);
    // สร้าง JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, roleId: roleId },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // ส่ง token ใน cookie
    res.cookie("token", token, {
      maxAge: 60 * 60 * 1000,  // 10 นาที
      secure: false, // ใช้ false สำหรับการทดสอบใน localhost (ไม่ใช้ HTTPS)
      httpOnly: true,
      sameSite: "Strict",
    });

    // ส่งผลลัพธ์กลับ
    return res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token: token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "เซิร์ฟเวอร์เกิดข้อผิดพลาด" });
  }
};


// ฟังก์ชันสำหรับสมัครสมาชิก
const register = async (req, res) => {
  const { email, password, confirmPassword, fname, lname, phone } = req.body;

  // เช็คว่าผู้ใช้กรอกข้อมูลครบหรือไม่
  if (!email || !password || !confirmPassword || !fname || !lname || !phone) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  // เช็คว่า password กับ confirmPassword ตรงกันหรือไม่
  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ error: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน" });
  }

  // เช็คความยาวรหัสผ่าน
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" });
  }

  // ตรวจสอบรูปแบบของอีเมล
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง" });
  }

  // ตรวจสอบหมายเลขโทรศัพท์
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: "หมายเลขโทรศัพท์ไม่ถูกต้อง" });
  }

  // ตรวจสอบ fname และ lname ว่ามีตัวอักษรเท่านั้น
  const nameRegex = /^[a-zA-Zก-๙]+$/;
  if (!nameRegex.test(fname) || !nameRegex.test(lname)) {
    return res.status(400).json({
      error:
        "ชื่อและนามสกุลต้องประกอบด้วยตัวอักษรเท่านั้น (ไม่มีตัวเลขหรืออักขระพิเศษ)",
    });
  }

  try {
    // ตรวจสอบว่าอีเมลนี้มีในระบบแล้วหรือไม่
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // ใช้ Prisma transaction เพื่อเพิ่ม user และ role
    const result = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: { email, password: hashedPassword, fname, lname, phone },
      });

      let memberRole = await prisma.role.findUnique({
        where: { name: "สมาชิก" },
      });

      if (!memberRole) {
        memberRole = await prisma.role.create({ data: { name: "สมาชิก" } });
      }

      await prisma.userRoles.create({
        data: { userId: newUser.id, roleId: memberRole.id },
      });

      return { id: newUser.id, email: newUser.email };
    });

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ", user: result });
  } catch (error) {
    console.error("Error:", error); // เพิ่มการ log ข้อผิดพลาดเพื่อให้ดูง่ายขึ้น
    res
      .status(500)
      .json({ error: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง" });
  }
};

// ฟังก์ชันสำหรับออกระบบ
const logout = async (req, res) => {
  try {
    // ลบคุกกี้ที่เก็บ Token
    res.clearCookie("token", {
      httpOnly: true, // ป้องกันการเข้าถึงจาก JavaScript
      secure: false, // ใช้ false ใน localhost (ถ้าใช้ HTTPS ให้ใช้ true)
      sameSite: "Strict", // กำหนด sameSite สำหรับคุกกี้
      path: "/", // ลบใน path นี้ทั้งหมด
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ message: "Logout failed", error });
  }
};

module.exports = { login, register, logout };

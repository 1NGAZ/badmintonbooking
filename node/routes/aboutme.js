const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET - ดึงข้อมูลเกี่ยวกับ
router.get("/", async (req, res) => {
  try {
    const aboutme = await prisma.aboutme.findMany({
      orderBy: {
        id: "desc",
      },
    });  
    res.json(aboutme);
  } catch (error) {
    console.log("Error Aboutme ", error);
    res.status(500).json({ error: "Failed to fetch Aboutme" });
  }
});

// PUT - อัพเดทข้อมูลเกี่ยวกับเรา
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params; 
    const { about,phone,email,location,normalday,weekend} = req.body;
        if (!about || !phone || !email || !location || !normalday || !weekend) {
          return res.status(400).json({
            error: "กรุณากรอกข้อมูลให้ครบถ้วน",
          });
        }

    const updatedAboutme = await prisma.aboutme.update({
      where: { id: parseInt(id) },
      data: {
        about: about,
        phone: phone,
        email: email,
        location: location,
        normalday: normalday,
        weekend: weekend,
      },
    });
    res.json({ message: "อัพเดทข้อมูลเกี่ยวกับเราเสร็จสิ้น", data: updatedAboutme });
  } catch (error) {
    console.error("Error updating Aboutme:", error);
    res.status(500).json({ error: "Failed to update Aboutme" }); 
  } 
});

module.exports = router;
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//GET ดึงกฏทั้งหมด
router.get("/", async (req, res) => {
  try {
    const rule = await prisma.rule.findMany({
      orderBy: {
        id: "desc",
      },
    });
    res.json(rule);
  } catch (error) {
    console.log("Error Rule ", error);
    res.status(500).json({ error: "Failed to fetch Rule" });
  }
});

// PUT อัพเดทกฏการใช้งาน
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { maxtimeslots, courtrule, paymentrule } = req.body;

    //ตรวจสอบข้อมูลว่าครบถ้วนไหม
    if (!maxtimeslots || !courtrule || !paymentrule) {
      return res.status(400).json({
        error:
          "ข้อมูลไม่ครบถ้วน กรุณาระบุ maxtimeslots, courtrule และ paymentrule",
      });
    }

    // ตรวจสอบว่า maxtimeslots เป็นตัวเลขที่ถูกต้องหรือไม่
    const maxTimeSlotsNumber = parseInt(maxtimeslots);
    if (isNaN(maxTimeSlotsNumber) || maxTimeSlotsNumber <= 0) {
      return res.status(400).json({
        error: "จำนวนช่วงเวลาสูงสุดต้องเป็นตัวเลขที่มากกว่า 0",
      });
    }

    const updatedRule = await prisma.rule.update({
      where: { id: parseInt(id) },
      data: {
        maxtimeslots: maxTimeSlotsNumber,
        courtrule: courtrule,
        paymentrule: paymentrule,
      },
    });
    res.json({ message: "อัพเดทกฏการใช้งานเสร็จสิ้น", data: updatedRule });
  } catch (error) {
    console.error("Error updating Rule:", error);
    res.status(500).json({ error: "Failed to update Rule" });
  }
});
module.exports = router;

const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// 🏸 ดึง TimeSlots ของสนามตาม ID
router.get("/:courtId/timeslots", async (req, res) => {
    try {
        const { courtId } = req.params;
        const { date } = req.query;

        const whereClause = { courtId: Number(courtId) };
        if (date) {
            whereClause.start_time = {
                gte: new Date(`${date}T00:00:00Z`),
                lte: new Date(`${date}T23:59:59Z`),
            };
        }

        const timeSlots = await prisma.timeSlot.findMany({
            where: whereClause,
            select: {
                id: true,
                start_time: true,
                end_time: true,
                statusId: true,
                status: { select: { name: true } },
            },
        });

        res.json(timeSlots);
    } catch (error) {
        console.error("Error fetching time slots:", error);
        res.status(500).json({ error: "Failed to fetch time slots" });
    }
});

// ✨ อัปเดตสถานะของ TimeSlot และสามารถเปิดใช้งานใหม่ได้
router.put("/:courtId/timeslots", async (req, res) => {
    try {
        const { courtId } = req.params;
        const { timeSlots, resetStatus } = req.body;

        if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
            return res.status(400).json({ error: "Invalid request: timeSlots is required" });
        }

        const updatePromises = timeSlots.map(async (slot) => {
            const existingTimeSlot = await prisma.timeSlot.findUnique({
                where: { id: slot.id },
            });

            if (!existingTimeSlot) {
                console.warn(`Warning: TimeSlot ID ${slot.id} not found.`);
                return null;
            }

            let newStatusId = slot.statusId;
            if (resetStatus) {
                newStatusId = 4; // 4 คือ "ว่าง"
            }

            return prisma.timeSlot.update({
                where: { id: slot.id },
                data: { statusId: newStatusId },
            });
        });

        const updatedTimeSlots = (await Promise.all(updatePromises)).filter(Boolean);

        res.json({ message: "Time slots updated successfully", updatedTimeSlots });
    } catch (error) {
        console.error("Error updating time slots:", error);
        res.status(500).json({ error: "Failed to update time slots" });
    }
});

// 🔄 รีเซ็ต TimeSlot ทั้งหมดของสนามให้กลับมาเป็น "ว่าง"
router.put("/:courtId/timeslots/reset", async (req, res) => {
    try {
        const { courtId } = req.params;

        const updatedTimeSlots = await prisma.timeSlot.updateMany({
            where: {
                courtId: Number(courtId),
                statusId: { not: 4 },
            },
            data: { statusId: 4 },
        });

        res.json({ message: "Time slots reset successfully", updatedTimeSlots });
    } catch (error) {
        console.error("Error resetting time slots:", error);
        res.status(500).json({ error: "Failed to reset time slots" });
    }
});

// เพิ่ม endpoint นี้ต่อจาก endpoints ที่มีอยู่
// 🗑️ ลบสนามและ TimeSlots ที่เกี่ยวข้อง
router.delete("/:courtId", async (req, res) => {
    try {
        const { courtId } = req.params;

        // 1. ลบ Reservations ที่เกี่ยวข้องกับ TimeSlots ของสนามนี้ก่อน
        await prisma.reservation.deleteMany({
            where: {
                timeSlot: {
                    courtId: Number(courtId)
                }
            }
        });

        // 2. ลบ TimeSlots ที่เกี่ยวข้องกับสนาม
        await prisma.timeSlot.deleteMany({
            where: { courtId: Number(courtId) }
        });

        // 3. ลบสนาม
        const deletedCourt = await prisma.court.delete({
            where: { id: Number(courtId) }
        });

        res.json({ message: "ลบสนามเรียบร้อยแล้ว", court: deletedCourt });
    } catch (error) {
        console.error("Error deleting court:", error);
        res.status(500).json({ error: "ไม่สามารถลบสนามได้" });
    }
});
router.post("/", async (req, res) => {
  try {
    const { name, price, detail } = req.body;
    if (!name) {
      return res.status(400).json({ error: "กรุณาระบุชื่อสนาม" });
    }

    // สร้างสนามใหม่
    const newCourt = await prisma.court.create({
      data: { 
        name,
        price: price ? parseFloat(price) : 0,
        detail: detail || "",
        status: "active"
      }
    });

    // สร้าง timeslots สำหรับ 7 วันข้างหน้า
    const today = new Date();
    const timeSlots = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // สร้าง timeslots สำหรับแต่ละช่วงเวลา
      const times = [
        { start: "15:00", end: "16:00" },
        { start: "16:00", end: "17:00" },
        { start: "17:00", end: "18:00" },
        { start: "18:00", end: "19:00" },
        { start: "19:00", end: "20:00" },
        { start: "20:00", end: "21:00" },
        { start: "21:00", end: "22:00" },
        { start: "22:00", end: "23:00" }
      ];

      for (const time of times) {
        timeSlots.push({
          courtId: newCourt.id,
          start_time: new Date(`${date.toISOString().split('T')[0]}T${time.start}:00`),
          end_time: new Date(`${date.toISOString().split('T')[0]}T${time.end}:00`),
          statusId: 4 // 4 = ว่าง
        });
      }
    }

    // บันทึก timeslots ทั้งหมด
    await prisma.timeSlot.createMany({
      data: timeSlots
    });

    // ดึงข้อมูลสนามพร้อม timeslots กลับไป
    const courtWithSlots = await prisma.court.findUnique({
      where: { id: newCourt.id },
      include: { 
        timeSlots: {
          orderBy: {
            start_time: 'asc'
          }
        } 
      }
    });

    res.json(courtWithSlots);
  } catch (error) {
    console.error("Error creating court:", error);
    res.status(500).json({ error: "ไม่สามารถสร้างสนามได้" });
  }
});
module.exports = router;


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createReservations = async (req, res) => {
  const { userId, selectedTimeSlots } = req.body;
  const file = req.file;

  console.log("File uploaded:", req.file);
  console.log("Body data:", req.body);

  try {
    // ตรวจสอบว่ามีไฟล์แนบหรือไม่
    if (!file) {
      return res.status(400).json({ error: 'กรุณาแนบสลิปการโอนเงิน' });
    }

    // ตรวจสอบว่า selectedTimeSlots อยู่ในรูปแบบที่ถูกต้อง
    let timeSlots = [];
    if (typeof selectedTimeSlots === 'string') {
      timeSlots = JSON.parse(selectedTimeSlots); 
    } else if (Array.isArray(selectedTimeSlots)) {
      timeSlots = selectedTimeSlots;
    }

    // ตรวจสอบว่า timeSlots มีข้อมูลหรือไม่
    if (!timeSlots || timeSlots.length === 0) {
      return res.status(400).json({ error: 'กรุณาเลือกช่วงเวลาที่ต้องการจอง' });
    }

    console.log('Parsed timeSlots:', timeSlots);

    // ดึง timeSlotId ทั้งหมดสำหรับการตรวจสอบ
    const timeSlotIds = timeSlots.map(slot => slot.timeSlotId);

    // ตรวจสอบว่า TimeSlot ทั้งหมดว่างอยู่หรือไม่
    const availableTimeSlots = await prisma.timeSlot.findMany({
      where: { id: { in: timeSlotIds } },
    });

    if (availableTimeSlots.length !== timeSlotIds.length) {
      return res.status(404).json({ error: 'TimeSlot บางรายการไม่พบ' });
    }

    const unavailableSlots = availableTimeSlots.filter((slot) => slot.statusId !== 4); // 4 = ว่าง
    if (unavailableSlots.length > 0) {
      return res.status(400).json({
        error: 'TimeSlot บางรายการไม่ว่างให้จอง',
        unavailableSlots: unavailableSlots.map((slot) => slot.id),
      });
    }

    // วนลูปสร้าง Reservation สำหรับแต่ละ TimeSlot
    const reservations = [];
    for (const { timeSlotId, courtId } of timeSlots) {
      console.log('Creating reservation for:', { timeSlotId, courtId });

      const reservation = await prisma.reservation.create({
        data: {
          userId: parseInt(userId, 10),
          courtId: parseInt(courtId, 10),
          timeSlotId: parseInt(timeSlotId, 10),
          statusId: 2, // 2 = รอดำเนินการ
          attachment: file.filename,
        },
      });

      // อัพเดตสถานะของ TimeSlot เป็น "รอดำเนินการ" (statusId = 2)
      await prisma.timeSlot.update({
        where: { id: timeSlotId },
        data: {
          statusId: 2,
        },
      });

      reservations.push(reservation);
    }

    res.status(201).json({
      message: 'การจองทั้งหมดอยู่ในสถานะรอดำเนินการ',
      reservations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการจองสนาม' });
  }
};


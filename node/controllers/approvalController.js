const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ฟังก์ชันดึงข้อมูลการจองที่รอดำเนินการ
exports.getPendingReservations = async (req, res) => {
  try {
    const pendingReservations = await prisma.reservation.findMany({
      where: { statusId: 2 }, // 2 = รอดำเนินการ
      include: {
        user: true, // ดึงข้อมูลผู้ใช้
        court: true, // ดึงข้อมูลสนาม
        timeSlot: true, // ดึงข้อมูล TimeSlot
      },
    });

    // รวมข้อมูลตาม userId และ courtId
    const groupedReservations = pendingReservations.reduce(
      (acc, reservation) => {
        const userId = reservation.userId;
        const courtId = reservation.courtId;

        const startTime = new Date(reservation.timeSlot.start_time);
        const endTime = new Date(reservation.timeSlot.end_time);
        const hours = (endTime - startTime) / (1000 * 60 * 60); // คำนวณชั่วโมง

        // สร้าง key สำหรับ grouping (รวมตาม userId และ courtId)
        const key = `${userId}-${courtId}`;

        if (!acc[key]) {
          acc[key] = {
            reservationId: reservation.id,
            user: {
              fname: reservation.user.fname,
              lname: reservation.user.lname,
              phone: reservation.user.phone,
            },
            court: reservation.court,
            totalPrice: parseFloat(reservation.court.price) * hours,
            totalHours: hours,
            totalCourtsNames: [reservation.court.name],
            start_time: reservation.timeSlot.start_time,
            end_time: reservation.timeSlot.end_time,
            attachment: reservation.attachment,
            timeSlotIds: [reservation.timeSlot.id], // ใช้ timeSlotIds เป็นอาร์เรย์
          };
        } else {
          acc[key].totalPrice += parseFloat(reservation.court.price) * hours;
          acc[key].totalHours += hours;
          acc[key].start_time = new Date(
            Math.min(new Date(acc[key].start_time), startTime)
          ).toISOString();
          acc[key].end_time = new Date(
            Math.max(new Date(acc[key].end_time), endTime)
          ).toISOString();
          acc[key].timeSlotIds.push(reservation.timeSlot.id); // เพิ่ม timeSlotId ในอาร์เรย์
        }

        return acc;
      },
      {}
    );

    const result = Object.values(groupedReservations);
    res.status(200).json({ groupedReservations: result });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "ไม่สามารถดึงข้อมูลการจองที่รอดำเนินการได้" });
  }
};

// ฟังก์ชันอนุมัติการจอง
exports.approveReservation = async (req, res) => {
  const { reservationId, timeSlotIds } = req.body; // รับ timeSlotIds จาก request body

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการจอง" });
    }

    // อัปเดตสถานะการจอง
    const updatedReservation = await prisma.reservation.updateMany({
      where: {
        userId: reservation.userId,
        courtId: reservation.courtId,
        statusId: 2,
      },
      data: { statusId: 3 }, // 3 = อนุมัติ
    });

    // อัปเดตทุก timeSlot ที่ได้รับมา
    await Promise.all(
      timeSlotIds.map(async (timeSlotId) => {
        await prisma.timeSlot.update({
          where: { id: timeSlotId },
          data: {
            status: {
              connect: { id: 5 }, // 5 = ไม่ว่าง
            },
          },
        });
      })
    );

    res.status(200).json({
      message: "การจองได้รับการอนุมัติเรียบร้อยแล้ว",
      reservation: {
        id: updatedReservation.id,
        status: "อนุมัติ",
        user: reservation.user.fname + " " + reservation.user.lname,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ไม่สามารถอนุมัติการจองได้" });
  }
};

// ฟังก์ชันปฏิเสธการจอง
exports.rejectReservation = async (req, res) => {
  const { reservationId, timeSlotIds } = req.body;

  if (!reservationId) {
    return res.status(400).json({ error: "กรุณาส่ง reservationId" });
  }

  try {
    // ดึง reservation ตัวแรกเพื่อใช้ข้อมูลพื้นฐาน
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { 
        user: true, 
        timeSlot: { select: { id: true, start_time: true, end_time: true } },
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการจอง" });
    }

    // ดึงวันที่จาก timeSlot เพื่อจำกัดขอบเขตในวันเดียวกัน
    const baseTimeSlot = reservation.timeSlot;
    const startOfDay = new Date(baseTimeSlot.start_time);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    // ดึง timeSlots ทั้งหมดในวันนั้นสำหรับ court และ user นี้
    const allTimeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: reservation.courtId,
        start_time: {
          gte: startOfDay,
          lte: endOfDay,
        },
        reservations: {
          some: {
            userId: reservation.userId,
            statusId: 2, // เฉพาะที่รอการอนุมัติ
          },
        },
      },
      select: { id: true, start_time: true, end_time: true },
      orderBy: { start_time: 'asc' },
    });

    // ถ้ามี timeSlotIds ส่งมา ใช้แทน
    let slotIds = allTimeSlots.map(slot => slot.id);
    if (timeSlotIds && timeSlotIds.length) {
      slotIds = timeSlotIds;
      const invalidSlots = timeSlotIds.filter(id => !allTimeSlots.some(slot => slot.id === id));
      if (invalidSlots.length > 0) {
        return res.status(400).json({
          error: "timeSlotIds บางตัวไม่เกี่ยวข้องกับการจองนี้",
          invalid: invalidSlots,
        });
      }
    }

    // ดึง reservations ที่เกี่ยวข้องทั้งหมด
    const relatedReservations = await prisma.reservation.findMany({
      where: {
        courtId: reservation.courtId,
        userId: reservation.userId,
        timeSlotId: { in: slotIds },
        statusId: 2,
      },
      select: { id: true, timeSlotId: true },
    });

    if (relatedReservations.length === 0) {
      return res.status(404).json({ error: "ไม่พบการจองที่รอการอนุมัติเพิ่มเติม" });
    }

    // อัปเดตทุก reservation ที่เกี่ยวข้อง
    const updatedReservations = await prisma.reservation.updateMany({
      where: {
        id: { in: relatedReservations.map(r => r.id) },
      },
      data: { statusId: 1 }, // 1 = ปฏิเสธ
    });

    // อัปเดตทุก timeSlot ที่เกี่ยวข้อง
    await Promise.all(
      relatedReservations.map(async (reservation) => {
        await prisma.timeSlot.update({
          where: { id: reservation.timeSlotId },
          data: {
            status: {
              connect: { id: 4 }, // 4 = ว่าง
            },
          },
        });
      })
    );

    res.status(200).json({
      message: "การจองถูกปฏิเสธเรียบร้อยแล้ว",
      updatedCount: updatedReservations.count,
      timeSlotIds: relatedReservations.map(r => r.timeSlotId),
      totalTimeSlots: allTimeSlots.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "ไม่สามารถปฏิเสธการจองได้",
      details: error.message,
    });
  }
};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios"); // เพิ่ม import axios
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

exports.createReservations = async (req, res) => {
  const {
    userId,
    selectedTimeSlots,
    promotionCode,
    promotionId: clientPromoId,
  } = req.body; // เพิ่มการรับ promotionId จาก client
  const file = req.file;

  console.log("File uploaded:", req.file);
  console.log("Body data:", req.body);
  console.log("Promotion data from client:", { promotionCode, clientPromoId });

  try {
    // ตรวจสอบว่ามีไฟล์แนบหรือไม่
    if (!file) {
      return res.status(400).json({ error: "กรุณาแนบสลิปการโอนเงิน" });
    }

    // ตรวจสอบว่า selectedTimeSlots อยู่ในรูปแบบที่ถูกต้อง
    let timeSlots = [];
    if (typeof selectedTimeSlots === "string") {
      timeSlots = JSON.parse(selectedTimeSlots);
    } else if (Array.isArray(selectedTimeSlots)) {
      timeSlots = selectedTimeSlots;
    }

    // ตรวจสอบว่า timeSlots มีข้อมูลหรือไม่
    if (!timeSlots || timeSlots.length === 0) {
      return res.status(400).json({ error: "กรุณาเลือกช่วงเวลาที่ต้องการจอง" });
    }

    // เพิ่มส่วนนี้: ตรวจสอบและใช้โค้ดโปรโมชั่น (ถ้ามี)
    let promotionId = null;

    // ตรวจสอบว่า clientPromoId มีค่าและเป็นตัวเลขหรือไม่
    if (clientPromoId) {
      const parsedId = parseInt(clientPromoId, 10);
      if (!isNaN(parsedId) && parsedId > 0) {
        // ตรวจสอบว่า promotionId มีอยู่จริงในฐานข้อมูลหรือไม่
        try {
          const promotion = await prisma.promotion.findUnique({
            where: { id: parsedId },
          });

          if (promotion) {
            promotionId = parsedId;
            console.log("ใช้ promotionId จาก client:", promotionId);
            console.log("พบข้อมูลโปรโมชั่น:", promotion.title);
          } else {
            console.log("ไม่พบ promotionId ในฐานข้อมูล:", parsedId);
          }
        } catch (error) {
          console.error("เกิดข้อผิดพลาดในการตรวจสอบ promotionId:", error);
        }
      } else {
        console.log("clientPromoId ไม่ใช่ตัวเลขที่ถูกต้อง:", clientPromoId);
      }
    }
    // ถ้ามี promotionCode ให้ตรวจสอบและใช้โค้ดโปรโมชั่น
    else if (promotionCode) {
      try {
        // ตรวจสอบความถูกต้องของโค้ดโปรโมชั่น
        const validateResponse = await axios.get(
          `${API_URL}/promotions/validate/${promotionCode}`
        );

        if (validateResponse.data.valid) {
          // เพิ่มจำนวนการใช้งานโค้ดโปรโมชั่น
          const useResponse = await axios.post(
            `${API_URL}/promotions/use/${promotionCode}`
          );
          promotionId = useResponse.data.id;
          console.log("ใช้ promotionId จากการตรวจสอบโค้ด:", promotionId);
        }
      } catch (error) {
        console.error("Error processing promotion code:", error.message);
        // ไม่ต้อง return error ออกไป เพราะการจองยังสามารถดำเนินต่อได้แม้ไม่มีโปรโมชั่น
      }
    }

    console.log("Parsed timeSlots:", timeSlots);
    console.log("Final promotionId to be used:", promotionId);

    // ดึง timeSlotId ทั้งหมดสำหรับการตรวจสอบ
    const timeSlotIds = timeSlots.map((slot) => slot.timeSlotId);

    // ตรวจสอบว่า TimeSlot ทั้งหมดว่างอยู่หรือไม่
    const availableTimeSlots = await prisma.timeSlot.findMany({
      where: { id: { in: timeSlotIds } },
      include: {
        reservations: {
          include: {
            user: {
              select: {
                fname: true,
                id: true,
              },
            },
          },
        },
      },
    });

    if (availableTimeSlots.length !== timeSlotIds.length) {
      return res.status(404).json({ error: "TimeSlot บางรายการไม่พบ" });
    }

    const unavailableSlots = availableTimeSlots.filter(
      (slot) => slot.statusId !== 4
    ); // 4 = ว่าง
    if (unavailableSlots.length > 0) {
      return res.status(400).json({
        error: "TimeSlot บางรายการไม่ว่างให้จอง",
        unavailableSlots: unavailableSlots.map((slot) => slot.id),
      });
    }

    // วนลูปสร้าง Reservation สำหรับแต่ละ TimeSlot
    // const reservations = [];
    // for (const { timeSlotId, courtId } of timeSlots) {
    //   console.log('Creating reservation for:', { timeSlotId, courtId });

    //   const reservation = await prisma.reservation.create({
    //     data: {
    //       userId: parseInt(userId, 10),
    //       courtId: parseInt(courtId, 10),
    //       timeSlotId: parseInt(timeSlotId, 10),
    //       statusId: 2, // 2 = รอดำเนินการ
    //       attachment: file.filename,
    //       promotionId: promotionId, // เพิ่ม promotionId ในการสร้าง reservation
    //     },
    //   });

    const reservations = [];
    for (const { timeSlotId, courtId } of timeSlots) {
      console.log("Creating reservation for:", { timeSlotId, courtId });

      // สร้างข้อมูลสำหรับการบันทึก
      const reservationData = {
        userId: parseInt(userId, 10),
        courtId: parseInt(courtId, 10),
        timeSlotId: parseInt(timeSlotId, 10),
        statusId: 2, // 2 = รอดำเนินการ
        attachment: file.filename,
      };

      // เพิ่ม promotionId เฉพาะเมื่อมีค่าและเป็นตัวเลขที่ถูกต้อง
      if (promotionId) {
        reservationData.promotionId = promotionId;
        console.log("บันทึกการจองพร้อม promotionId:", promotionId);
      }

      const reservation = await prisma.reservation.create({
        data: reservationData,
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
      message: "การจองทั้งหมดอยู่ในสถานะรอดำเนินการ",
      reservations,
      usedPromotion: promotionId ? true : false, // เพิ่มข้อมูลว่าใช้โปรโมชั่นหรือไม่
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการจองสนาม" });
  }
};

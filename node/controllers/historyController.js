const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET_KEY;

const getReservations = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // Fix the query to remove invalid includes
    const reservations = await prisma.reservation.findMany({
      where: { userId: userId },
      include: {
        timeSlot: true,
        status: true,
        court: true,
        promotion: true,
      },
      orderBy: [{ courtId: "asc" }, { timeSlot: { start_time: "asc" } }],
    });

    // Group reservations by courtId and date
    const groupedReservations = reservations.reduce((acc, reservation) => {
      const startTime = new Date(reservation.timeSlot.start_time);
      const endTime = new Date(reservation.timeSlot.end_time);

      // Use the date without time for grouping
      const dateKey = startTime.toISOString().split("T")[0];
      const key = `${reservation.courtId}_${dateKey}`;

      // คำนวณชั่วโมง
      const hours = (endTime - startTime) / (1000 * 60 * 60);

      // คำนวณราคาปกติ
      const regularPrice = parseFloat(reservation.court.price) * hours;

      // ตรวจสอบและคำนวณส่วนลด
      let discountAmount = 0;
      let promotionCode = null;
      let promotionId = null;

      if (reservation.promotion) {
        promotionCode = reservation.promotion.code;
        promotionId = reservation.promotion.id;

        // ใช้ discount แทน discountValue ตามโครงสร้างข้อมูลจริง
        const discountValue = parseFloat(reservation.promotion.discount);

        if (!isNaN(discountValue)) {
          // ตรวจสอบว่ามีฟิลด์ discountType หรือไม่ ถ้าไม่มีให้ถือว่าเป็นเปอร์เซ็นต์
          const discountType =
            reservation.promotion.discountType || "percentage";

          if (discountType === "percentage") {
            // ส่วนลดเป็นเปอร์เซ็นต์
            discountAmount = (regularPrice * discountValue) / 100;
          } else {
            // ส่วนลดเป็นจำนวนเงิน
            discountAmount = discountValue;
          }
        }
      }

      // คำนวณราคาหลังส่วนลด
      const discountedPrice = Math.max(0, regularPrice - discountAmount);

      if (!acc[key]) {
        acc[key] = {
          id: reservation.id,
          userId: reservation.userId,
          court: {
            ...reservation.court,
            name: reservation.court.name,
            detail: reservation.court.detail ,
            price: reservation.court.price || 0,
            courtType: reservation.court.courtType || null,
          },
          status: reservation.status,
          totalHours: hours,
          totalPrice: regularPrice,
          discountAmount: discountAmount,
          discountedPrice: discountedPrice,
          promotionCode: promotionCode,
          promotionId: promotionId,
          timeSlot: {
            start_time: reservation.timeSlot.start_time,
            end_time: reservation.timeSlot.end_time,
          },
        };
      } else {
        acc[key].totalHours += hours;
        acc[key].totalPrice += regularPrice;

        // ถ้ามีโปรโมชั่นและยังไม่ได้ตั้งค่า
        if (promotionCode && !acc[key].promotionCode) {
          acc[key].promotionCode = promotionCode;
          acc[key].promotionId = promotionId;
          acc[key].discountAmount = discountAmount;
        } else if (promotionCode && acc[key].promotionCode === promotionCode) {
          // ถ้ามีโปรโมชั่นเดียวกัน ให้คำนวณส่วนลดใหม่ตามราคารวม
          const discountValue = parseFloat(reservation.promotion.discount);

          if (!isNaN(discountValue)) {
            const discountType =
              reservation.promotion.discountType || "percentage";

            if (discountType === "percentage") {
              acc[key].discountAmount =
                (acc[key].totalPrice * discountValue) / 100;
            } else {
              // ถ้าเป็นส่วนลดแบบจำนวนเงิน ใช้ค่าเดิม
              acc[key].discountAmount = discountValue;
            }
          }
        }

        // อัปเดตราคาหลังส่วนลด
        acc[key].discountedPrice = Math.max(
          0,
          acc[key].totalPrice - acc[key].discountAmount
        );

        // Update end time if current reservation ends later
        if (endTime > new Date(acc[key].timeSlot.end_time)) {
          acc[key].timeSlot.end_time = reservation.timeSlot.end_time;
        }
      }
      return acc;
    }, {});

    const mergedReservations = Object.values(groupedReservations);

    console.log(
      "Merged reservations with discounts:",
      mergedReservations.map((r) => ({
        id: r.id,
        totalPrice: r.totalPrice,
        discountAmount: r.discountAmount,
        discountedPrice: r.discountedPrice,
        promotionCode: r.promotionCode,
      }))
    );

    res.status(200).json(mergedReservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reservations" });
  }
};

// Helper function removed as it's not being used

module.exports = { getReservations };

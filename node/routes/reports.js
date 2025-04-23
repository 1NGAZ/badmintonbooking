const express = require('express');
const router = express.Router();
const { authenticateUser, isAdmin } = require('../middlewares/authmiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/income', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateCondition = {};
    if (startDate && endDate) {
      dateCondition = {
        timeSlot: {
          start_time: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      };
    } else if (startDate) {
      dateCondition = {
        timeSlot: {
          start_time: {
            gte: new Date(startDate)
          }
        }
      };
    } else if (endDate) {
      dateCondition = {
        timeSlot: {
          start_time: {
            lte: new Date(endDate)
          }
        }
      };
    }

    console.log('Query Params:', { startDate, endDate });
    console.log('Date Condition:', dateCondition);

    // Update the promotion include section to use the correct field names
    const bookings = await prisma.reservation.findMany({
      where: {
        statusId: 3,
        ...dateCondition
      },
      include: {
        user: {
          select: {
            id: true,
            fname: true,
            lname: true
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        timeSlot: {
          select: {
            id: true,
            start_time: true,
            end_time: true
          }
        },
        // Fix the promotion fields to match your schema
        promotion: {
          select: {
            id: true,
            code: true,
            // Replace with your actual field names
            discount: true,  // Instead of discountValue
            title: true,
            description: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    console.log('Bookings:', bookings);

    // จัดกลุ่มการจองตามผู้ใช้และสนาม
    const bookingGroups = {};
    
    bookings.forEach(booking => {
      const userId = booking.user?.id;
      const courtId = booking.court?.id;
      const key = `${userId}-${courtId}`;
      
      if (!bookingGroups[key]) {
        bookingGroups[key] = {
          bookings: [],
          totalAmount: 0,
          discountedAmount: 0,
          earliestStartTime: booking.timeSlot?.start_time,
          latestEndTime: booking.timeSlot?.end_time
        };
      } else {
        // ตรวจสอบและอัปเดตเวลาเริ่มต้นที่เร็วที่สุด
        if (new Date(booking.timeSlot?.start_time) < new Date(bookingGroups[key].earliestStartTime)) {
          bookingGroups[key].earliestStartTime = booking.timeSlot?.start_time;
        }
        // ตรวจสอบและอัปเดตเวลาสิ้นสุดที่ช้าที่สุด
        if (new Date(booking.timeSlot?.end_time) > new Date(bookingGroups[key].latestEndTime)) {
          bookingGroups[key].latestEndTime = booking.timeSlot?.end_time;
        }
      }
      
      bookingGroups[key].bookings.push(booking);
      
      // คำนวณราคาปกติ
      const regularPrice = Number(booking.court.price);
      bookingGroups[key].totalAmount += regularPrice;
      
      // คำนวณราคาหลังส่วนลด (ถ้ามีโปรโมชัน)
      let finalPrice = regularPrice;
      if (booking.promotion) {
        // Check if the promotion has a discount
        if (booking.promotion.discount) {
          // Assuming discount is stored as a percentage value
          const discountPercentage = Number(booking.promotion.discount);
          finalPrice = regularPrice * (1 - discountPercentage / 100);
        }
      }
      bookingGroups[key].discountedAmount += finalPrice;
    });
    
    // สร้าง transactions จากกลุ่มการจอง
    const transactions = Object.values(bookingGroups).map(group => {
      const firstBooking = group.bookings[0];
      return {
        id: firstBooking.id,
        reservationId: firstBooking.id,
        type: 'income',
        category: 'booking',
        amount: group.totalAmount, // ราคาปกติ
        discountedAmount: group.discountedAmount, // ราคาหลังส่วนลด
        description: `การจองสนาม ${firstBooking.court?.name || ''} (${group.bookings.length} รายการ)`,
        status: 'อนุมัติ',
        createdAt: firstBooking.timeSlot?.start_time || new Date(),
        user: firstBooking.user,
        court: firstBooking.court,
        timeSlot: {
          start_time: group.earliestStartTime,
          end_time: group.latestEndTime
        },
        utcDate: firstBooking.timeSlot?.start_time,
        // เพิ่มข้อมูลโปรโมชัน (ถ้ามี)
        promotion: firstBooking.promotion
      };
    });

    console.log('Transactions:', transactions);

    return res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching income data:', error);
    return res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายรับรายจ่าย'
    });
  }
});

module.exports = router;
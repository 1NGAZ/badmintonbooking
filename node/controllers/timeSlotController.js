const { createTimeSlotsForDate } = require("../models/timeSlotModel");
const { getTimeSlotsOnDate } = require("../services/timeSlotService");
const { getCourtIdsFromDatabase } = require("../models/databasemodel");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ฟังก์ชันสำหรับ POST เพื่อสร้าง TimeSlots
// const createTimeSlotsForDateController = async () => {
//   try {
//     const currentDate = new Date();
//     const courtIds = await getCourtIdsFromDatabase();

//     for (let i = 0; i < 7; i++) {
//       const date = new Date(currentDate);
//       date.setDate(currentDate.getDate() + i);
//       const formattedDate = formatDate(date); // สร้างรูปแบบวันที่ YYYY-MM-DD

//       for (let courtId of courtIds) {
//         // ตรวจสอบจำนวน time slots ที่มีอยู่แล้วในวันนั้นสำหรับสนามนั้น
//         const startOfDay = new Date(date);
//         startOfDay.setHours(0, 0, 0, 0);
        
//         const endOfDay = new Date(date);
//         endOfDay.setHours(23, 59, 59, 999);
        
//         const count = await prisma.timeSlot.count({
//           where: {
//             start_time: {
//               gte: startOfDay,
//               lte: endOfDay,
//             },
//             courtId: courtId,
//           },
//         });

//         // ถ้าไม่มี time slot ในวันนี้สำหรับสนามนี้ จึงสร้างใหม่
//         if (count === 0) {
//           await createTimeSlotsForDate(date, courtId);
//           console.log(`สร้าง time slots สำหรับวันที่ ${formattedDate} สนาม ${courtId} เรียบร้อยแล้ว`);
//         } else {
//           console.log(`มี time slots อยู่แล้วสำหรับวันที่ ${formattedDate} สนาม ${courtId} (${count} รายการ)`);
//         }
//       }
//     }

//     console.log("วันที่และเวลาของทุกสนามถูกสร้างเรียบร้อย.");
//     return { message: "วันที่และเวลาของทุกสนามถูกสร้างเรียบร้อย." };
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

const createTimeSlotsForDateController = async () => {
  try {
    // สร้างวันที่ปัจจุบันในโซนเวลาไทย
    const currentDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
    const courtIds = await getCourtIdsFromDatabase();

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(new Date(currentDate).getDate() + i);
      const formattedDate = formatDate(date);

      for (let courtId of courtIds) {
        // ตั้งค่าเวลาเริ่มต้นของวันในโซนเวลาไทย
        const startOfDay = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        startOfDay.setHours(0, 0, 0, 0);
        
        // ตั้งค่าเวลาสิ้นสุดของวันในโซนเวลาไทย
        const endOfDay = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        endOfDay.setHours(23, 59, 59, 999);
        
        const count = await prisma.timeSlot.count({
          where: {
            start_time: {
              gte: startOfDay,
              lte: endOfDay,
            },
            courtId: courtId,
          },
        });

        if (count === 0) {
          // ส่งวันที่ในรูปแบบ Asia/Bangkok ไปยังฟังก์ชันสร้าง time slots
          await createTimeSlotsForDate(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }), courtId);
          console.log(`สร้าง time slots สำหรับวันที่ ${formattedDate} สนาม ${courtId} เรียบร้อยแล้ว`);
        } else {
          console.log(`มี time slots อยู่แล้วสำหรับวันที่ ${formattedDate} สนาม ${courtId} (${count} รายการ)`);
        }
      }
    }

    console.log("วันที่และเวลาของทุกสนามถูกสร้างเรียบร้อย.");
    return { message: "วันที่และเวลาของทุกสนามถูกสร้างเรียบร้อย." };
  } catch (error) {
    console.error(error);
    throw error;
  }
};






// ฟังก์ชันช่วยจัดรูปแบบวันที่เป็น YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ฟังก์ชันสำหรับ GET เพื่อดึง TimeSlots ตามวันที่
// const getTimeSlotsByDateController = async (req, res) => {
//   const { date } = req.query; // รับวันที่จาก query parameter
//   console.log(date);
//   try {
//     const timeSlots = await getTimeSlotsOnDate(date);
//     res.status(200).json(timeSlots);
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while fetching time slots." });
//   }
// };

// ฟังก์ชันสำหรับ GET เพื่อดึง TimeSlots ตามวันที่
const getTimeSlotsByDateController = async (req, res) => {
  const { date } = req.query; // รับวันที่จาก query parameter
  console.log("Received date from frontend:", date);
  
  try {
    const timeSlots = await getTimeSlotsOnDate(date);
    console.log(`Retrieved ${timeSlots.length} time slots for date ${date}`);
    res.status(200).json(timeSlots);
  } catch (error) {
    console.error("Error in getTimeSlotsByDateController:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching time slots." });
  }
};

module.exports = {
  createTimeSlotsForDateController,
  getTimeSlotsByDateController,
};
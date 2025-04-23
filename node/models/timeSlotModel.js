const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// const createTimeSlotsForDate = async (date, courtId) => {
//   const timeSlots = [];
//   const startHour = 15; // เวลาเริ่มต้น (15:00)
//   const endHour = 23; // เวลาสิ้นสุด (23:00)
//   const duration = 1; // ระยะเวลา 1 ชั่วโมง

//   // ตั้งค่า baseDate เป็นเวลาเริ่มต้นของวันที่ส่งเข้ามา (ไม่ต้องบวกเพิ่ม 1 วัน)
//   const baseDate = new Date(date);
//   baseDate.setHours(0, 0, 0, 0);
  
//   // สร้าง TimeSlot ตั้งแต่เวลา 15:00 ถึง 23:00
//   for (let hour = startHour; hour < endHour; hour += duration) {
//     const start_time = new Date(baseDate);
//     start_time.setHours(hour, 0, 0, 0); // ตั้งเวลาเริ่มต้นเป็นไม่ใช่ UTC

//     const end_time = new Date(baseDate);
//     // ถ้าเป็นช่วงสุดท้าย ให้เวลาสิ้นสุดเป็น 23:00
//     if (hour + duration >= endHour) {
//       end_time.setHours(endHour, 0, 0, 0);
//     } else {
//       end_time.setHours(hour + duration, 0, 0, 0);
//     }

//     // เพิ่ม TimeSlot เข้าไปในรายการ
//     timeSlots.push({
//       start_time,
//       end_time,
//       courtId,
//       statusId: 4, // สถานะเริ่มต้นเป็น "ว่าง"
//     });
//   }

//   console.log('TimeSlots to be inserted:', timeSlots);

//   try {
//     const result = await prisma.timeSlot.createMany({
//       data: timeSlots,
//       skipDuplicates: true,
//     });
//     console.log('Insert result:', result);
//   } catch (error) {
//     console.error('Error during database insertion:', error);
//   }
// };

const createTimeSlotsForDate = async (date, courtId) => {
  const timeSlots = [];
  const startHour = 15; // เวลาเริ่มต้น (15:00)
  const endHour = 23; // เวลาสิ้นสุด (23:00)
  const duration = 1; // ระยะเวลา 1 ชั่วโมง

  // ตั้งค่า baseDate เป็นเวลาเริ่มต้นของวันที่ส่งเข้ามาในโซนเวลาไทย
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);
  
  // สร้าง TimeSlot ตั้งแต่เวลา 15:00 ถึง 23:00
  for (let hour = startHour; hour < endHour; hour += duration) {
    // สร้างเวลาเริ่มต้นในโซนเวลาไทย
    const start_time = new Date(baseDate);
    start_time.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
    start_time.setHours(hour);

    // สร้างเวลาสิ้นสุดในโซนเวลาไทย
    const end_time = new Date(baseDate);
    end_time.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
    
    // ถ้าเป็นช่วงสุดท้าย ให้เวลาสิ้นสุดเป็น 23:00
    if (hour + duration >= endHour) {
      end_time.setHours(endHour);
    } else {
      end_time.setHours(hour + duration);
    }

    // เพิ่ม TimeSlot เข้าไปในรายการ
    timeSlots.push({
      start_time: new Date(start_time.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })),
      end_time: new Date(end_time.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })),
      courtId,
      statusId: 4,
    });
  }

  // แสดงข้อมูลเวลาในรูปแบบที่อ่านง่าย
  console.log('TimeSlots to be inserted:', timeSlots.map(slot => ({
    ...slot,
    start_time_local: new Date(slot.start_time).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' }),
    end_time_local: new Date(slot.end_time).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })
  })));

  try {
    const result = await prisma.timeSlot.createMany({
      data: timeSlots,
      skipDuplicates: true,
    });
    console.log('Insert result:', result);
  } catch (error) {
    console.error('Error during database insertion:', error);
  }
};


module.exports = {
  createTimeSlotsForDate,
};

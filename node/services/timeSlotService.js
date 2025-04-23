// services/timeSlotService.js
const { createTimeSlotsForDate } = require("../models/timeSlotModel");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getTimeSlotsOnDate = async (date) => {
  // สร้าง Date object จากวันที่ที่ได้รับ
  // const inputDate = new Date(date);
  const inputDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(inputDate);
  startOfDay.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCHours(23, 59, 59, 999); // End of the day in UTC
  // Query courts with filtered timeSlots
  // const courts = await prisma.court.findMany({
  //   where: {
  //     timeSlots: {
  //       some: {
  //         start_time: {
  //           gte: startOfDay,
  //           lte: endOfDay,
  //         },
  //       },
  //     },
  //   },
  //   include: {
  //     timeSlots: {
  //       where: {
  //         start_time: {
  //           gte: startOfDay,
  //           lte: endOfDay,
  //         },
  //       },
  //     },
  //   },
  // });
  const courts = await prisma.court.findMany({
    where: {
      timeSlots: {
        some: {
          start_time: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
    },
    include: {
      timeSlots: {
        where: {
          start_time: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          reservations: {
            include: {
              user: {
                select: {
                  fname: true,
                },
              },
            },
          },
        },
      },
    },
  });
  
  return courts;
};


module.exports = {
  getTimeSlotsOnDate,
};

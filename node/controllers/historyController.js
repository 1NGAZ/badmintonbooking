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

    // ดึงข้อมูลการจอง
    const reservations = await prisma.reservation.findMany({
      where: { userId: userId },
      include: {
        timeSlot: true,
        status: true,
        court: true
      },
      orderBy: [
        { courtId: "asc" },
        { timeSlot: { start_time: "asc" } }
      ]
    });

    console.log("Raw reservations from DB:", reservations.map(r => ({
      id: r.id,
      start: r.timeSlot.start_time,
      end: r.timeSlot.end_time,
      courtId: r.courtId
    })));

    // Group reservations by courtId and date
    const groupedReservations = reservations.reduce((acc, reservation) => {
      const startTime = new Date(reservation.timeSlot.start_time);
      const endTime = new Date(reservation.timeSlot.end_time);
      
      // Use the date without time for grouping
      const dateKey = startTime.toISOString().split('T')[0];
      const key = `${reservation.courtId}_${dateKey}`;

      if (!acc[key]) {
        acc[key] = {
          id: reservation.id,
          userId: reservation.userId,
          court: reservation.court,
          status: reservation.status,
          totalHours: 1,
          totalPrice: parseFloat(reservation.court.price),
          timeSlot: {
            // Keep original times without modification
            start_time: reservation.timeSlot.start_time,
            end_time: reservation.timeSlot.end_time
          }
        };
      } else {
        acc[key].totalHours += 1;
        acc[key].totalPrice += parseFloat(reservation.court.price);
        // Update end time if current reservation ends later
        if (endTime > new Date(acc[key].timeSlot.end_time)) {
          acc[key].timeSlot.end_time = reservation.timeSlot.end_time;
        }
      }
      return acc;
    }, {});

    const mergedReservations = Object.values(groupedReservations);
    
    console.log("Merged reservations:", mergedReservations.map(r => ({
      id: r.id,
      start: r.timeSlot.start_time,
      end: r.timeSlot.end_time,
      totalHours: r.totalHours
    })));

    res.status(200).json(mergedReservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reservations" });
  }
};

// Helper function
function createMergedReservation(group) {
  const first = group[0];
  const last = group[group.length - 1];
  
  return {
    id: first.id,
    userId: first.userId,
    courtId: first.courtId,
    statusId: first.statusId,
    status: first.status,
    court: {
      ...first.court,
      location: first.court.detail || first.court.location,
      detail: first.court.detail
    },
    totalHours: group.length,
    totalPrice: group.length * first.court.price,
    startTimeSlot: first.timeSlot,
    endTimeSlot: last.timeSlot,
    timeSlot: first.timeSlot
  };
}

module.exports = { getReservations };

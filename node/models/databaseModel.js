const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ฟังก์ชันดึง courtIds จากฐานข้อมูล
const getCourtIdsFromDatabase = async () => {
  try {
    const courts = await prisma.court.findMany({
      select: {
        id: true
      }
    });

    if (!courts || courts.length === 0) {
      throw new Error('ไม่พบข้อมูลสนามในฐานข้อมูล');
    }

    return courts.map(court => court.id);
  } catch (error) {
    console.error('Error fetching court IDs:', error);
    throw new Error('ไม่สามารถดึงข้อมูล courtId จากฐานข้อมูลได้');
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  getCourtIdsFromDatabase
};

const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// แก้ไขชื่อสนาม
router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'ต้องระบุชื่อสนาม' });
      }
      
      // Check your Prisma model name - it might be "court" (singular) instead of "courts"
      const updatedCourt = await prisma.court.update({
        where: { id: parseInt(id) },
        data: { name }
      });
      
      if (!updatedCourt) {
        return res.status(404).json({ message: 'ไม่พบสนามที่ต้องการแก้ไข' });
      }
      
      res.status(200).json({ message: 'อัปเดตชื่อสนามเรียบร้อยแล้ว', court: updatedCourt });
    } catch (error) {
      console.error('Error updating court name:', error);
      
      // Handle Prisma specific errors
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'ไม่พบสนามที่ต้องการแก้ไข' });
      }
      
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตชื่อสนาม' });
    }
  });

module.exports = router;
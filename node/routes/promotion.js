const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET - ดึงข้อมูลโปรโมชั่นทั้งหมด
router.get('/', async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: {
        id: 'desc'
      }
    });
    res.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

// GET - ค้นหาโปรโมชั่นตามคำค้นหา
router.get('/search', async (req, res) => {
  const { term } = req.query;
  
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
        OR: [
          { title: { contains: term } },
          { description: { contains: term } },
          { code: { contains: term } }
        ]
      },
      orderBy: {
        id: 'desc'
      }
    });
    res.json(promotions);
  } catch (error) {
    console.error('Error searching promotions:', error);
    res.status(500).json({ error: 'Failed to search promotions' });
  }
});

// GET - ดึงข้อมูลโปรโมชั่นตาม ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: Number(id) }
    });
    
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    
    res.json(promotion);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ error: 'Failed to fetch promotion' });
  }
});

// POST - สร้างโปรโมชั่นใหม่
router.post('/', async (req, res) => {
  const { title, description, discount, code, startDate, endDate, status, maxUses } = req.body;
  
  try {
    // ตรวจสอบว่ารหัสโปรโมชั่นซ้ำหรือไม่
    const existingPromo = await prisma.promotion.findUnique({
      where: { code }
    });
    
    if (existingPromo) {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }
    
    const newPromotion = await prisma.promotion.create({
      data: {
        title,
        description,
        discount: parseFloat(discount),
        code,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        maxUses: maxUses ? parseInt(maxUses) : 0,
        usedCount: 0
      }
    });
    
    res.status(201).json(newPromotion);
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

// PUT - อัปเดตโปรโมชั่น
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, discount, code, startDate, endDate, status, maxUses } = req.body;
  
  try {
    // ตรวจสอบว่ารหัสโปรโมชั่นซ้ำหรือไม่ (ยกเว้นโปรโมชั่นปัจจุบัน)
    const existingPromo = await prisma.promotion.findFirst({
      where: {
        code,
        NOT: { id: Number(id) }
      }
    });
    
    if (existingPromo) {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }
    
    const updatedPromotion = await prisma.promotion.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        discount: parseFloat(discount),
        code,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        maxUses: maxUses ? parseInt(maxUses) : 0
      }
    });
    
    res.json(updatedPromotion);
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

// GET - ตรวจสอบความถูกต้องของรหัสโปรโมชั่น
router.get('/validate/:code', async (req, res) => {
  const { code } = req.params;
  
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { code }
    });
    
    if (!promotion) {
      return res.status(404).json({ valid: false, error: 'Invalid promotion code' });
    }
    
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    // ตรวจสอบว่าโปรโมชั่นยังใช้งานได้หรือไม่
    if (promotion.status !== 'active' || now < startDate || now > endDate) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Promotion is not active or has expired',
        promotion
      });
    }
    
    // ตรวจสอบจำนวนการใช้งานคูปอง
    if (promotion.maxUses > 0 && promotion.usedCount >= promotion.maxUses) {
      return res.status(400).json({
        valid: false,
        error: 'Promotion usage limit reached',
        promotion
      });
    }
    
    res.json({ valid: true, promotion });
  } catch (error) {
    console.error('Error validating promotion code:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate promotion code' });
  }
});

// POST - เพิ่มการใช้งานคูปอง (เรียกเมื่อมีการใช้คูปองในการจอง)
router.post('/use/:code', async (req, res) => {
  const { code } = req.params;
  
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { code }
    });
    
    if (!promotion) {
      return res.status(404).json({ error: 'Invalid promotion code' });
    }
    
    // ตรวจสอบว่าคูปองยังใช้งานได้หรือไม่
    const now = new Date();
    if (promotion.status !== 'active' || 
        now < new Date(promotion.startDate) || 
        now > new Date(promotion.endDate) ||
        (promotion.maxUses > 0 && promotion.usedCount >= promotion.maxUses)) {
      return res.status(400).json({ error: 'โปรโมชั่นนี้ถูกใช้งานครบตามจำนวนที่กำหนดแล้ว' });
    }
    
    // เพิ่มจำนวนการใช้งาน
    const updatedPromotion = await prisma.promotion.update({
      where: { id: promotion.id },
      data: {
        usedCount: {
          increment: 1
        }
      }
    });
    
    res.json(updatedPromotion);
  } catch (error) {
    console.error('Error using promotion:', error);
    res.status(500).json({ error: 'Failed to use promotion' });
  }
});

// DELETE - ลบโปรโมชั่น
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // ตรวจสอบว่าโปรโมชั่นนี้ถูกใช้ในการจองหรือไม่
    const reservationsWithPromo = await prisma.reservation.findMany({
      where: { promotionId: Number(id) }
    });
    
    if (reservationsWithPromo.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete promotion that is being used in reservations',
        count: reservationsWithPromo.length
      });
    }
    
    await prisma.promotion.delete({
      where: { id: Number(id) }
    });
    
    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

module.exports = router;
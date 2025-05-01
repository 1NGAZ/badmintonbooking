const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' }); // อัปโหลดชั่วคราว

// POST news - สร้างข่าวใหม่
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { detail } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const base64Image = fs.readFileSync(file.path, 'base64');
    const mimeType = file.mimetype;
    const base64WithPrefix = `data:${mimeType};base64,${base64Image}`;

    fs.unlinkSync(file.path); // ลบไฟล์ชั่วคราว

    const news = await prisma.news.create({
      data: {
        detail,
        image: base64WithPrefix,
      },
    });

    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET news - ดึงข่าวทั้งหมด
router.get('/', async (req, res) => {
  try {
    const newsList = await prisma.news.findMany(
      {
        orderBy: {
          id: 'desc',
        }, 
      }
    );
    res.json(newsList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT news - แก้ไขข่าว
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
      const { id } = req.params;
      const { detail } = req.body;
      const file = req.file;
  
      let updatedData = { detail };
  
      // ถ้ามีอัปโหลดรูปใหม่
      if (file) {
        const base64Image = fs.readFileSync(file.path, 'base64');
        const mimeType = file.mimetype;
        const base64WithPrefix = `data:${mimeType};base64,${base64Image}`;
  
        fs.unlinkSync(file.path); // ลบไฟล์ชั่วคราว
  
        updatedData.image = base64WithPrefix;
      }
  
      const updatedNews = await prisma.news.update({
        where: { id: parseInt(id) },
        data: updatedData,
      });
  
      res.json(updatedNews);
    } catch (err) {
      console.error(err);
      if (err.code === 'P2025') {
        res.status(404).json({ error: 'News not found' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });
  

module.exports = router;

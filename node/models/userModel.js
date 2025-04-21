// models/userModel.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // สร้าง instance ของ Prisma Client
const jwt = require("jsonwebtoken");
const getUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fname: true,
      lname: true,
      email: true,
      phone: true,
    },
  });
};






module.exports = { getUserById};

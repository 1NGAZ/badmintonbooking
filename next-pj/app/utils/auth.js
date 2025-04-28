"use client";

import { Phone } from 'lucide-react';

/**
 * ฟังก์ชันสำหรับแกะข้อมูลจาก JWT token
 * @returns {Object|null} ข้อมูลผู้ใช้หรือ null ถ้าไม่มี token
 */
export const getUserDataFromToken = () => {
  try {
    // ตรวจสอบว่าอยู่ใน browser environment หรือไม่
    if (typeof window === 'undefined') {
      return null;
    }

    // ดึง token จาก sessionStorage
    const token = window.sessionStorage.getItem("authToken");
    
    // ถ้าไม่มี token ให้ return null
    if (!token) {
      console.log("ไม่พบ token ในระบบ");
      return null;
    }
    
    // แกะข้อมูลจาก token
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log("รูปแบบ token ไม่ถูกต้อง");
      return null;
    }
    
    // แปลง base64 ส่วนที่ 2 (payload) เป็น JSON
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // ตรวจสอบว่า token หมดอายุหรือไม่
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.log("Token หมดอายุแล้ว");
      window.sessionStorage.removeItem("authToken");
      window.sessionStorage.removeItem("userData");
      return null;
    }
    
    // สร้างข้อมูลผู้ใช้จาก payload
    const userData = {
      id: payload.userId,
      email: payload.email,
      fname: payload.fname || "",
      lname: payload.lname || "",
      phone: payload.phone || "",
      userRoles: [{ roleId: payload.roleId }]
    };
    
    // เก็บข้อมูลผู้ใช้ลงใน sessionStorage
    window.sessionStorage.setItem("userData", JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    console.log("Error parsing token:", error);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem("authToken");
      window.sessionStorage.removeItem("userData");
    }
    return null;
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้จาก sessionStorage หรือ token
 * @returns {Object|null} ข้อมูลผู้ใช้หรือ null ถ้าไม่มีข้อมูล
 */
export const getUserData = () => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    
    // ลองดึงข้อมูลจาก sessionStorage ก่อน
    const userDataStr = window.sessionStorage.getItem("userData");
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }
    
    // ถ้าไม่มีข้อมูลใน sessionStorage ให้ลองแกะจาก token
    return getUserDataFromToken();
  } catch (error) {
    console.log("Error getting user data:", error);
    return null;
  }
};

/**
 * ฟังก์ชันสำหรับตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
 * @returns {boolean} true ถ้าเป็น admin, false ถ้าไม่ใช่
 */
export const isAdmin = () => {
  const userData = getUserData();
  return userData?.userRoles?.some(userRole => userRole.roleId === 1) || false;
};

/**
 * ฟังก์ชันสำหรับออกจากระบบ
 * @param {Function} callback ฟังก์ชันที่จะเรียกหลังจากออกจากระบบสำเร็จ
 */
export const logout = async (callback) => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    // ล้าง token และข้อมูลผู้ใช้จาก sessionStorage
    window.sessionStorage.removeItem("authToken");
    window.sessionStorage.removeItem("userData");
    
    // เรียก API logout (ถ้ามี)
    if (API_URL) {
      try {
        const axios = (await import('axios')).default;
        await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      } catch (error) {
        console.error("Error during API logout:", error);
      }
    }
    
    // เรียก callback ถ้ามี
    if (typeof callback === 'function') {
      callback();
    } else {
      // ถ้าไม่มี callback ให้ redirect ไปหน้า login
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("Error during logout:", error);
  }
};
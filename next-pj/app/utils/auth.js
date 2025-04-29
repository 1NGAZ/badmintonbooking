"use client";

import { Phone } from 'lucide-react';

/**
 * ฟังก์ชันสำหรับแกะข้อมูลจาก JWT token
 * @returns {Object|null} ข้อมูลผู้ใช้หรือ null ถ้าไม่มี token
 */
export const getUserDataFromToken = () => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = window.sessionStorage.getItem("authToken");

    if (!token) {
      console.log("ไม่พบ token ในระบบ");
      return null;
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log("รูปแบบ token ไม่ถูกต้อง");
      return null;
    }

    // ฟังก์ชัน decode base64 ให้เป็น UTF-8
    const decodeBase64Utf8 = (base64) => {
      return decodeURIComponent(
        Array.prototype.map
          .call(atob(base64), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
    };

    const payload = JSON.parse(decodeBase64Utf8(tokenParts[1]));

    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.log("Token หมดอายุแล้ว");
      window.sessionStorage.removeItem("authToken");
      window.sessionStorage.removeItem("userData");
      return null;
    }

    const userData = {
      id: payload.userId,
      email: payload.email,
      fname: payload.fname || "",
      lname: payload.lname || "",
      phone: payload.phone || "",
      userRoles: [{ roleId: payload.roleId }]
    };

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
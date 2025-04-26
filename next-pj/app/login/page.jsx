'use client'; 
import React, { useState } from 'react';
import axios from "axios";
import Cookies from 'js-cookie';
const API_URL = process.env.PUBLIC_NEXT_API_URL; 

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
 



  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // ล้างข้อความข้อผิดพลาดก่อน
  
    // ตรวจสอบว่า formData มีค่าอีเมลและรหัสผ่านหรือไม่
    if (!formData.email || !formData.password) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
  
    console.log("Form Data:", formData.email); // ตรวจสอบค่าของ formData ก่อนส่ง
    console.log("Form Data:", formData.password); // ตรวจสอบค่าของ formData ก่อนส่ง
  
    try {
      // ส่งคำขอเข้าสู่ระบบไปที่ API
      const response = await axios.post(`${API_URL}/auth/login`, formData, { withCredentials: true });
      console.log(response);
  
      if (!response) {
        throw new Error("เกิดข้อผิดพลาดในระบบ");
      } 
  
      sessionStorage.setItem("authToken", response.data.token); // เก็บ token ใน sessionStorage
      window.location.href = "/Reservation"; // เปลี่ยนหน้าไปที่ Reservation
    } catch (error) {
      console.error("Login Failed:", error);
  
      // ตรวจสอบข้อผิดพลาดจาก API
      if (error.response) {
        // กรณีที่เป็นข้อผิดพลาดจาก API response
        if (error.response.status === 401) {
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        } else {
          setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
      } else if (error.request) {
        setError("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
      } else {
        setError("เกิดข้อผิดพลาดในการส่งคำขอ");
      }
    }
  };
  


  return (
    <div className="font-[sans-serif]">
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="grid md:grid-cols-2 items-center gap-4 max-md:gap-8 max-w-6xl max-md:max-w-lg w-full p-4 m-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.3)] rounded-md">
          <div className="md:max-w-md w-full px-4 py-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-12">
                <h3 className="text-gray-800 text-3xl font-extrabold">เข้าสู่ระบบ</h3>
                <p className="text-sm mt-4 text-gray-800">
                คุณยังไม่มีบัญชีใช่ไหม ?{" "}
                  <a
                    href="/register"
                    className="text-blue-600 font-semibold hover:underline ml-1 whitespace-nowrap"
                  >
                    สมัครสมาชิก
                  </a>
                </p>
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <div>
                <label className="text-gray-800 text-xs block mb-2">Email</label>
                <div className="relative flex items-center">
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full text-gray-800 text-sm border-b border-gray-300 focus:border-blue-600 px-2 py-3 outline-none"
                    placeholder="อีเมล"
                  />
                </div>
              </div>

              <div className="mt-8">
                <label className="text-gray-800 text-xs block mb-2">Password</label>
                <div className="relative flex items-center">
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full text-gray-800 text-sm border-b border-gray-300 focus:border-blue-600 px-2 py-3 outline-none"
                    placeholder="รหัสผ่าน"
                  />
                </div>
              </div>

              <div className="mt-12">
                <button
                  type="submit"
                  className="w-full shadow-xl py-2.5 px-4 text-sm tracking-wide rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>

          <div className="md:h-full bg-[#000842] rounded-xl lg:p-12 p-8">
            <img
              src="https://readymadeui.com/signin-image.webp"
              className="w-full h-full object-contain"
              alt="login-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

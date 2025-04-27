"use client";
import React, { useState } from "react";
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Page() {
  const [formData, setFormData] = useState({
    email: "",
    firstname: "",
    lastname: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    // ตรวจสอบความยาวของรหัสผ่าน
    if (formData.password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    // เพิ่มการตรวจสอบความถูกต้องของข้อมูล
    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    // ตรวจสอบรูปแบบเบอร์โทรศัพท์
    const cleanedPhone = formData.phone.trim().replace(/[- .]/g, "");
    if (!/^\d{10}$/.test(cleanedPhone)) {
      setError("รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง กรุณากรอกเบอร์โทรศัพท์ 10 หลัก");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fname: formData.firstname,
        lname: formData.lastname,
        phone: cleanedPhone,
      });

      setSuccess("สมัครสมาชิกสำเร็จ!!!");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาดในระบบ");
    }
  };

  return (
    <div className="font-[sans-serif]">
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="grid md:grid-cols-2 items-center gap-4 max-md:gap-8 max-w-6xl max-md:max-w-lg w-full p-4 m-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.3)] rounded-md">
          <div className="md:max-w-md w-full px-4 py-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <h3 className="text-gray-800 text-3xl font-extrabold">
                  สมัครสมาชิก
                </h3>
                <p className="text-sm mt-4 text-gray-800">
                  มีบัญชีอยู่แล้วใช่ไหม?{" "}
                  <a
                    href="/login"
                    className="text-blue-600 font-semibold hover:underline ml-1 whitespace-nowrap"
                  >
                    เข้าสู่ระบบ
                  </a>
                </p>
              </div>

              {error && <div className="text-red-500 mb-4">{error}</div>}
              {success && <div className="text-green-500 mb-4">{success}</div>}

              <div>
                <label className="text-gray-800 text-xs block mb-2">
                  Email
                </label>
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

              <div>
                <label className="text-gray-800 text-xs block mb-2">
                  Firstname
                </label>
                <div className="relative flex items-center">
                  <input
                    name="firstname"
                    type="text"
                    required
                    value={formData.firstname}
                    onChange={handleChange}
                    className="w-full text-gray-800 text-sm border-b border-gray-300 focus:border-blue-600 px-2 py-3 outline-none"
                    placeholder="ชื่อ"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-800 text-xs block mb-2">
                  Lastname
                </label>
                <div className="relative flex items-center">
                  <input
                    name="lastname"
                    type="text"
                    required
                    value={formData.lastname}
                    onChange={handleChange}
                    className="w-full text-gray-800 text-sm border-b border-gray-300 focus:border-blue-600 px-2 py-3 outline-none"
                    placeholder="นามสกุล"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-800 text-xs block mb-2">
                  Phone
                </label>
                <div className="relative flex items-center">
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full text-gray-800 text-sm border-b border-gray-300 focus:border-blue-600 px-2 py-3 outline-none"
                    placeholder="เบอร์โทรศัพท์"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-gray-800 text-xs block mb-2">
                  Password
                </label>
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

              <div className="mt-4">
                <label className="text-gray-800 text-xs block mb-2">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full text-gray-800 text-sm border-b border-gray-300 focus:border-blue-600 px-2 py-3 outline-none"
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  className="w-full shadow-xl py-2.5 px-4 text-sm tracking-wide rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  สมัครสมาชิก
                </button>
              </div>
            </form>
          </div>

          <div className="md:h-full bg-[#000842] rounded-xl lg:p-12 p-8">
            <img
              src="https://readymadeui.com/signin-image.webp"
              className="w-full h-full object-contain"
              alt="register-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

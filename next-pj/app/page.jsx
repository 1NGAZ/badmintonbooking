"use client";
import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Image from "next/image";
import Link from "next/link";
import Footer from "./components/footer";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Page() {
  // State สำหรับควบคุมการแสดง popup
  const [showPopup, setShowPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [popupImage, setPopupImage] = useState("/S28270597.jpg");
  const [popupDetail, setPopupDetail] = useState("");
  const [tempDetail, setTempDetail] = useState("");
  const [tempImageFile, setTempImageFile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // ดึงข้อมูล popup (image + detail) จาก API
  useEffect(() => {
    setShowPopup(true);

    const fetchPopupData = async () => {
      try {
        const res = await axios.get(`${API_URL}/news/1`);
        if (res.data) {
          setPopupImage(res.data.image || "/S28270597.jpg");
          setPopupDetail(res.data.detail || "");
        }
      } catch (err) {
        console.error("Error fetching popup data:", err);
        setPopupImage("/S28270597.jpg");
        setPopupDetail("");
      }
    };
    fetchPopupData();

    // ตรวจสอบสถานะ admin จาก JWT Token
    try {
      const token = sessionStorage.getItem("authToken");
      if (token) {
        const payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));
        setIsAdmin(decodedPayload.roleId === 1);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  }, []);

  // ฟังก์ชันปิด popup
  const closePopup = () => {
    setShowPopup(false);
  };

  // ฟังก์ชันเปิด popup แก้ไขรูปภาพ
  const openEditPopup = () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setNotification({
        show: true,
        message: "กรุณาเข้าสู่ระบบก่อนแก้ไขรูปภาพ",
        type: "error",
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      return;
    }
    if (!isAdmin) {
      setNotification({
        show: true,
        message: "คุณไม่มีสิทธิ์แก้ไขรูปภาพ เฉพาะแอดมินเท่านั้น",
        type: "error",
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      return;
    }
    setTempDetail(popupDetail);
    setTempImageFile(null);
    setShowEditPopup(true);
  };

  // ฟังก์ชันปิด popup แก้ไขรูปภาพ
  const closeEditPopup = () => {
    setShowEditPopup(false);
    setNotification({ show: false, message: "", type: "" });
  };

  // ฟังก์ชันบันทึกการแก้ไขรูปภาพ
  const saveImageEdit = async () => {
    if (!tempDetail.trim()) {
      setNotification({
        show: true,
        message: "กรุณากรอกข้อความโปรโมชัน",
        type: "error",
      });
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("detail", tempDetail);

      // If we have a new file, append it to FormData
      if (tempImageFile) {
        formData.append("image", tempImageFile);
      }

      // Send the FormData to the API
      await axios.put(`${API_URL}/news/1`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh popup data
      const res = await axios.get(`${API_URL}/news/1`);
      setPopupImage(res.data.image || "/S28270597.jpg");
      setPopupDetail(res.data.detail || "");
      setShowEditPopup(false);
      setNotification({
        show: true,
        message: "บันทึกข้อมูลเรียบร้อยแล้ว",
        type: "success",
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (err) {
      console.error("Error saving data:", err);
      setNotification({
        show: true,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        type: "error",
      });
    }
    setIsLoading(false);
  };

  // แยกข้อความ detail เป็นหัวข้อและเนื้อหา
  const splitDetail = (detail) => {
    if (!detail)
      return { title: "ยินดีต้อนรับสู่เว็บไซต์จองสนามแบดมินตัน", content: "" };

    const lines = detail.split("\n");
    const title = lines[0] || "ยินดีต้อนรับสู่เว็บไซต์จองสนามแบดมินตัน";
    const content = lines.length > 1 ? lines.slice(1).join("\n") : "";

    return { title, content };
  };

  const { title, content } = splitDetail(popupDetail);

  return (
    <div className="bg-white flex flex-col items-center min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <div className="relative w-full h-screen bg-gradient-to-r from-red-500 to-orange-400 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/badmintonbg.jpg"
            alt="Badminton Court"
            layout="fill"
            objectFit="cover"
            className="opacity-50"
            priority
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            เว็บแอพพลิเคชั่นจองสนามแบดมินตัน
          </h1>
          <h2 className="text-2xl md:text-3xl text-white mb-8 drop-shadow-md">
            THE BADMINTON COURT RESERVATION WEB APPLICATION
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href="/Reservation">
              <button className="px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg">
                จองสนามเลย
              </button>
            </Link>
            <Link href="/Reservation#court-showcase">
              <button className="px-8 py-3 bg-white text-gray-800 text-lg font-semibold rounded-lg hover:bg-gray-100 hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg">
                ดูรายละเอียดสนาม
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* บริการของเรา */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            บริการของเรา
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* บริการที่ 1 */}
            <div className="flex flex-col items-center p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">
                จองง่าย สะดวก
              </h3>
              <p className="text-gray-600 text-center">
                จองสนามออนไลน์ได้ตลอด 24 ชั่วโมง ไม่ต้องโทรจอง
              </p>
            </div>

            {/* บริการที่ 2 */}
            <div className="flex flex-col items-center p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">
                สนามคุณภาพ
              </h3>
              <p className="text-gray-600 text-center">
                สนามได้มาตรฐาน พื้นกันลื่น แสงสว่างเพียงพอ
              </p>
            </div>

            {/* บริการที่ 3 */}
            <div className="flex flex-col items-center p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">
                ราคาเป็นมิตร
              </h3>
              <p className="text-gray-600 text-center">
                อัตราค่าบริการที่คุ้มค่า มีโปรโมชั่นพิเศษสำหรับสมาชิก
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 ">
          <div className="bg-white rounded-xl overflow-hidden max-w-lg w-full relative">
            {/* ปุ่มปิด */}
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition-colors z-10"
            >
              ✕
            </button>
            {/* ปุ่มแก้ไขสำหรับแอดมินเท่านั้น */}
            {isAdmin && (
              <button
                onClick={openEditPopup}
                className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 transition-colors z-10"
                title="แก้ไขรูปภาพ"
              >
                ✎
              </button>
            )}
            {/* รูปภาพประชาสัมพันธ์ */}
            <div className="relative w-full h-96 md:h-[30rem]">
              <Image
                src={popupImage}
                alt="Welcome Promotion"
                layout="fill"
                objectFit="contain"
                className="p-2"
                key={popupImage}
              />
            </div>
            {/* การแจ้งเตือน */}
            {notification.show && (
              <div
                className={`absolute top-12 right-2 ${
                  notification.type === "success"
                    ? "bg-green-500"
                    : "bg-red-500"
                } text-white px-4 py-2 rounded shadow-lg`}
              >
                {notification.message}
              </div>
            )}
            {/* ข้อความและปุ่ม */}
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
              {content && (
                <p
                  className="text-gray-600 mb-4"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {content}
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={closePopup}
                  className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ปิด
                </button>
                <Link href="/Reservation">
                  <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    จองเลย
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Popup แก้ไขรูปภาพ */}
      {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl overflow-hidden max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">แก้ไขรูปภาพประชาสัมพันธ์</h3>
            {notification.show && notification.type === "error" && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {notification.message}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                เลือกรูปภาพใหม่ (jpg, png)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                      setNotification({
                        show: true,
                        message:
                          "ไฟล์มีขนาดใหญ่เกินไป กรุณาอัพโหลดไฟล์ขนาดไม่เกิน 2MB",
                        type: "error",
                      });
                      setTimeout(() => {
                        setNotification({ show: false, message: "", type: "" });
                      }, 3000);
                      return;
                    }
                    setTempImageFile(file);
                  }
                }}
                className="block w-full text-sm text-gray-700"
              />
            </div>
            {/* textarea สำหรับแก้ไข detail */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                ข้อความโปรโมชัน (บรรทัดแรกจะเป็นหัวข้อ
                บรรทัดถัดไปจะเป็นรายละเอียด)
              </label>
              <textarea
                value={tempDetail}
                onChange={(e) => setTempDetail(e.target.value)}
                rows={4}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder={`ยินดีต้อนรับสู่เว็บไซต์จองสนามแบดมินตัน\nฉลองเปิดบริการ ใส่โค้ด DAY1ST รับส่วนลด 20%`}
              />
            </div>

            {/* ตัวอย่างการแสดงผลข้อความ */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                ตัวอย่างการแสดงผลข้อความ:
              </p>
              <div className="border border-gray-300 rounded p-4 bg-gray-50">
                {(() => {
                  const { title, content } = splitDetail(tempDetail);
                  return (
                    <>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {title}
                      </h3>
                      {content && (
                        <p
                          className="text-sm text-gray-600"
                          style={{ whiteSpace: "pre-line" }}
                        >
                          {content}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeEditPopup}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <button
                onClick={saveImageEdit}
                className={`px-4 py-2 ${
                  isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                } text-white rounded-lg transition-colors flex items-center`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึก"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

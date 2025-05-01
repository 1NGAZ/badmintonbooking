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
  // State สำหรับควบคุมการแสดง popup แก้ไขรูปภาพ
  const [showEditPopup, setShowEditPopup] = useState(false);
  // State สำหรับเก็บ URL ของรูปภาพ
  const [popupImage, setPopupImage] = useState();
  // State สำหรับเก็บ detail (หัวข้อ+รายละเอียด)
  const [popupDetail, setPopupDetail] = useState("");
  // State สำหรับเก็บ detail ชั่วคราวระหว่างการแก้ไข
  const [tempDetail, setTempDetail] = useState(""); // <<== เพิ่มบรรทัดนี้
  // State สำหรับตรวจสอบว่าเป็น admin หรือไม่
  const [isAdmin, setIsAdmin] = useState(true);
  // State สำหรับแสดงสถานะการโหลด
  const [isLoading, setIsLoading] = useState(false);
  // State สำหรับแสดงข้อความแจ้งเตือน
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
    setTempImageUrl(popupImage);
    setTempImageFile(null); // reset file
    setTempDetail(popupDetail);
    setShowEditPopup(true);
  };

  // ฟังก์ชันปิด popup แก้ไขรูปภาพ
  const closeEditPopup = () => {
    setShowEditPopup(false);
    setNotification({ show: false, message: "", type: "" });
  };

  // ฟังก์ชันตรวจสอบว่า URL เป็นรูปภาพที่ถูกต้องหรือไม่
  const isValidImageUrl = (url) => {
    return url && (url.startsWith("/") || url.startsWith("http"));
  };

  // ฟังก์ชันบันทึกการแก้ไขรูปภาพ (ตัวอย่างนี้ยังไม่เชื่อม API PUT)
  const saveImageEdit = async () => {
    if (!isValidImageUrl(tempImageUrl)) {
      setNotification({
        show: true,
        message: "กรุณาใส่ URL รูปภาพที่ถูกต้อง",
        type: "error",
      });
      return;
    }
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
      // เรียก PUT API news/1 (หรือ id ที่ต้องการ)
      await axios.put(`${API_URL}/news/1`, {
        detail: tempDetail,
        image: tempImageUrl,
      });
      // รีเฟรชข้อมูล popup
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
      setNotification({
        show: true,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        type: "error",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white flex flex-col items-center min-h-screen">
      <Navbar />

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
              {(() => {
                const lines = popupDetail.split("\n");
                return (
                  <>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {lines[0] || "ยินดีต้อนรับสู่เว็บไซต์จองสนามแบดมินตัน"}
                    </h3>
                    {lines[1] && (
                      <p className="text-gray-600 mb-4">
                        {lines.slice(1).join("\n")}
                      </p>
                    )}
                  </>
                );
              })()}
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
                URL รูปภาพ
              </label>
              <input
                type="text"
                value={tempImageUrl}
                onChange={(e) => setTempImageUrl(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="ใส่ URL รูปภาพ เช่น /image.jpg หรือ https://example.com/image.jpg"
              />
            </div>
            {/* textarea สำหรับแก้ไข detail */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                ข้อความโปรโมชัน (ขึ้นบรรทัดใหม่ด้วย Enter)
              </label>
              <textarea
                value={tempDetail}
                onChange={(e) => setTempDetail(e.target.value)}
                rows={4}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder={`ยินดีต้อนรับสู่เว็บไซต์จองสนามแบดมินตัน\nฉลองเปิดบริการ ใส่โค้ด DAY1ST รับส่วนลด 20%`}
              />
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">ตัวอย่างรูปภาพ:</p>
              <div className="relative w-full h-48 border border-gray-300 rounded">
                {tempImageUrl && isValidImageUrl(tempImageUrl) ? (
                  <Image
                    src={tempImageUrl}
                    alt="Preview"
                    layout="fill"
                    objectFit="contain"
                    onError={() => {
                      setNotification({
                        show: true,
                        message: "ไม่สามารถโหลดรูปภาพได้ กรุณาตรวจสอบ URL",
                        type: "error",
                      });
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    ไม่มีตัวอย่างรูปภาพ
                  </div>
                )}
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

      {/* Hero Section with Overlay */}
      {/* ... ส่วนอื่นๆ ของไฟล์ ... */}
      <Footer />
    </div>
  );
}

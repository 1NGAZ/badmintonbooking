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

      
      <Footer />
    </div>
  );
}

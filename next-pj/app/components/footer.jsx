"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const Footer = () => {
  const [aboutData, setAboutData] = useState({
    about: "ให้บริการสนามแบดมินตันคุณภาพ พร้อมสิ่งอำนวยความสะดวกครบครัน เพื่อประสบการณ์การเล่นที่ดีที่สุด",
    phone: "098-765-4321",
    email: "info@badminton.com",
    location: "บ้านออฟ",
    normalday: "จันทร์ - ศุกร์: 15:00 - 23:00",
    weekend: "เสาร์ - อาทิตย์: 15:00 - 23:00"
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // ดึงข้อมูลจาก API
    const fetchAboutData = async () => {
      try {
        const response = await axios.get(`${API_URL}/aboutme`);
        if (response.data && response.data.length > 0) {
          setAboutData(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
      }
    };

    // ตรวจสอบสถานะ admin จาก JWT Token
    const checkAdminStatus = () => {
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
    };

    fetchAboutData();
    checkAdminStatus();
  }, []);

  const handleEditClick = () => {
    setEditData({ ...aboutData });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleSave = async () => {
    // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    if (!editData.about || !editData.phone || !editData.email || 
        !editData.location || !editData.normalday || !editData.weekend) {
      setNotification({
        show: true,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.put(`${API_URL}/aboutme/${aboutData.id}`, editData);
      setAboutData(response.data.data);
      setIsEditing(false);
      setNotification({
        show: true,
        message: "บันทึกข้อมูลเรียบร้อยแล้ว",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error updating about data:", error);
      setNotification({
        show: true,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNotification({ show: false, message: "", type: "" });
  };

  return (
    <footer className="w-full bg-gray-900 text-white py-12 px-4 relative">
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
          notification.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}>
          {notification.message}
        </div>
      )}

      {isAdmin && !isEditing && (
        <button
          onClick={handleEditClick}
          className="absolute top-4 right-4 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 transition-colors"
          title="แก้ไขข้อมูล"
        >
          ✎
        </button>
      )}

      {isEditing ? (
        <div className="max-w-7xl mx-auto bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">แก้ไขข้อมูลเกี่ยวกับเรา</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">เกี่ยวกับเรา</label>
              <textarea
                name="about"
                value={editData.about || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-gray-800 rounded-lg"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">ที่อยู่</label>
              <textarea
                name="location"
                value={editData.location || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-gray-800 rounded-lg"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                name="phone"
                value={editData.phone || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-gray-800 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">อีเมล</label>
              <input
                type="email"
                name="email"
                value={editData.email || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-gray-800 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">เวลาทำการ (วันธรรมดา)</label>
              <input
                type="text"
                name="normalday"
                value={editData.normalday || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-gray-800 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">เวลาทำการ (วันหยุด)</label>
              <input
                type="text"
                name="weekend"
                value={editData.weekend || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-gray-800 rounded-lg"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 ${
                isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } rounded-lg transition-colors flex items-center`}
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
      ) : (
        <>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">เกี่ยวกับเรา</h3>
              <p className="text-gray-300">
                {aboutData.about}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">ติดต่อเรา</h3>
              <p className="text-gray-300 mb-2">โทร: {aboutData.phone}</p>
              <p className="text-gray-300 mb-2">อีเมล: {aboutData.email}</p>
              <p className="text-gray-300">
                ที่อยู่: {aboutData.location}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">เวลาทำการ</h3>
              <p className="text-gray-300 mb-2">{aboutData.normalday}</p>
              <p className="text-gray-300 mb-2">{aboutData.weekend}</p>
              <p className="text-gray-300">วันหยุดนักขัตฤกษ์: 09:00 - 22:00</p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2023 สนามแบดมินตัน. สงวนลิขสิทธิ์ทั้งหมด.</p>
          </div>
        </>
      )}
    </footer>
  );
};

export default Footer;
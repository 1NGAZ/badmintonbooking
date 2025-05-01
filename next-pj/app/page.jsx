"use client";
import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Image from "next/image";
import Link from "next/link";
import Footer from "./components/footer";

export default function Page() {
  // State สำหรับควบคุมการแสดง popup
  const [showPopup, setShowPopup] = useState(false);
  // State สำหรับควบคุมการแสดง popup แก้ไขรูปภาพ
  const [showEditPopup, setShowEditPopup] = useState(false);
  // State สำหรับเก็บ URL ของรูปภาพ
  const [popupImage, setPopupImage] = useState("/S28270597.jpg");
  // State สำหรับเก็บ URL ชั่วคราวระหว่างการแก้ไข
  const [tempImageUrl, setTempImageUrl] = useState("");
  // State สำหรับตรวจสอบว่าเป็น admin หรือไม่
  const [isAdmin, setIsAdmin] = useState(true);
  // State สำหรับแสดงสถานะการโหลด
  const [isLoading, setIsLoading] = useState(false);
  // State สำหรับแสดงข้อความแจ้งเตือน
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // แสดง popup เมื่อโหลดหน้าเว็บเสร็จ
  useEffect(() => {
    // แสดง popup ทุกครั้งที่เข้าหน้าเว็บ
    setShowPopup(true);
    
    const savedImage = localStorage.getItem('popupImage');
    if (savedImage) {
      setPopupImage(savedImage);
    }
    
    // ตรวจสอบสถานะ admin จาก JWT Token
    try {
      const token = sessionStorage.getItem("authToken");
      console.log('Token:', token);
      
      if (token) {
        // แยกส่วน payload จาก JWT token (ส่วนที่ 2 หลังจากแยกด้วย .)
        const payload = token.split('.')[1];
        // Decode base64 เป็น JSON string และแปลงเป็น object
        const decodedPayload = JSON.parse(atob(payload));
        console.log('Decoded token payload:', decodedPayload);
        
        // ตรวจสอบว่า roleId เป็น 1 หรือไม่
        setIsAdmin(decodedPayload.roleId === 1);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      setIsAdmin(false);
    }
  }, []);

  // ฟังก์ชันปิด popup
  const closePopup = () => {
    setShowPopup(false);
  };

  // ฟังก์ชันเปิด popup แก้ไขรูปภาพ
  const openEditPopup = () => {
    // ตรวจสอบว่ามี token หรือไม่
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setNotification({
        show: true,
        message: "กรุณาเข้าสู่ระบบก่อนแก้ไขรูปภาพ",
        type: "error"
      });
      
      // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      
      return;
    }
    
    console.log(isAdmin);
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (!isAdmin) {
      setNotification({
        show: true,
        message: "คุณไม่มีสิทธิ์แก้ไขรูปภาพ เฉพาะแอดมินเท่านั้น",
        type: "error"
      });
      // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      
      return;
    }
    
    setTempImageUrl(popupImage);
    setShowEditPopup(true);
  };

  // ฟังก์ชันปิด popup แก้ไขรูปภาพ
  const closeEditPopup = () => {
    setShowEditPopup(false);
    setNotification({ show: false, message: "", type: "" });
  };

  // ฟังก์ชันตรวจสอบว่า URL เป็นรูปภาพที่ถูกต้องหรือไม่
  const isValidImageUrl = (url) => {
    return url && (url.startsWith('/') || url.startsWith('http'));
  };

  // ฟังก์ชันบันทึกการแก้ไขรูปภาพ
  const saveImageEdit = () => {
    if (!isValidImageUrl(tempImageUrl)) {
      setNotification({
        show: true,
        message: "กรุณาใส่ URL รูปภาพที่ถูกต้อง",
        type: "error"
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setPopupImage(tempImageUrl);
      
      // บันทึกรูปภาพลงใน localStorage เพื่อให้ยังคงอยู่หลังจากรีเฟรช
      localStorage.setItem('popupImage', tempImageUrl);
      
      setIsLoading(false);
      setShowEditPopup(false);
      
      // แสดงการแจ้งเตือนว่าบันทึกสำเร็จ
      setNotification({
        show: true,
        message: "บันทึกรูปภาพเรียบร้อยแล้ว",
        type: "success"
      });
      
      // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      
    }, 1000); 
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
              <div className={`absolute top-12 right-2 ${
                notification.type === "success" ? "bg-green-500" : "bg-red-500"
              } text-white px-4 py-2 rounded shadow-lg`}>
                {notification.message}
              </div>
            )}
            
            {/* ข้อความและปุ่ม */}
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                ยินดีต้อนรับสู่เว็บไซต์จองสนามแบดมินตัน
              </h3>
              <p className="text-gray-600 mb-4">
              ฉลองเปิดบริการ ใส่โค้ด <span className='text-black'>DAY1ST</span> รับส่วนลด 20% 
              </p>
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
                        type: "error"
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
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      <div className="relative w-full h-[700px] overflow-hidden ">
        <Image
          src={"/badmintonbg.jpg"}
          alt="background homepage"
          layout="fill"
          objectFit="cover"
          priority
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">
            {" "}
            เว็บแอพพลิเคชั่นจองสนามแบดมินตัน
          </h1>
          <p className="text-xl md:text-2xl text-center mb-8 max-w-3xl">
            THE BADMINTON COURT RESERVATION WEB APPLICATION
          </p>

          {/* ส่วนที่เหลือของโค้ดยังคงกมัง */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/Reservation">
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
                จองสนามเลย
              </button>
            </Link>
            <Link href="/Reservation#court-showcase">
              <button className="bg-transparent hover:bg-white hover:text-red-600 text-white font-bold py-3 px-8 border-2 border-white rounded-lg transition duration-300">
                ดูรายละเอียดสนาม
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            บริการของเรา
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-600"
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
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                จองง่าย สะดวก
              </h3>
              <p className="text-gray-600">
                จองสนามออนไลน์ได้ตลอด 24 ชั่วโมง ไม่ต้องโทรจอง
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-600"
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
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                สนามคุณภาพ
              </h3>
              <p className="text-gray-600">
                สนามได้มาตรฐาน พื้นกันลื่น แสงสว่างเพียงพอ
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-600"
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
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                ราคาเป็นมิตร
              </h3>
              <p className="text-gray-600">
                อัตราค่าบริการที่คุ้มค่า มีโปรโมชั่นพิเศษสำหรับสมาชิก
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Court Showcase */}
      <div className="w-full py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            สนามของเรา
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={"/Court2.png"}
                alt="Court Image"
                layout="fill"
                objectFit="cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">สนามแบดมินตัน A</h3>
                <p>เหมาะสำหรับการเล่นทั้งมือสมัครเล่นและมืออาชีพ</p>
              </div>
            </div>

            <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={"/badhome.png"}
                alt="Court Image"
                layout="fill"
                objectFit="cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">สนามแบดมินตัน B</h3>
                <p>พื้นที่กว้างขวาง เหมาะสำหรับการแข่งขัน</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/Reservation">
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
                ดูสนามทั้งหมด
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
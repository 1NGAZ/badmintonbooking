"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const Page = () => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: 0,
    code: "",
    startDate: "",
    endDate: "",
    status: "active",
    maxUses: 0,
  });

  // ตรวจสอบสถานะการเข้าสู่ระบุและสิทธิ์แอดมิน
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (typeof window !== "undefined") {
          const token = sessionStorage.getItem("authToken");
          // ลบ console.log ที่ไม่จำเป็น
          if (!token) {
            router.push("/login");
            return;
          }
          // ดึงข้อมูลผู้ใช้เพื่อตรวจสอบบทบาท
          const userResponse = await axios.get(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // ตรวจสอบว่าเป็นแอดมิน (roleId = 1) หรือไม่
          const isAdmin = userResponse.data?.roles?.some(
            (role) => role.id === 1
          );

          if (!isAdmin) {
            setError(
              "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (ต้องเป็นผู้ดูแลระบบเท่านั้น)"
            );
            setTimeout(() => router.push("/"), 2000);
            return;
          }

          setIsAdmin(true);
          setIsLoading(false);
          fetchPromotions();
        }
      } catch (err) {
        console.error("Error checking authentication status:", err);
        if (typeof window !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาเข้าสู่ระบบใหม่",
            confirmButtonColor: "#ef4444",
          }).then(() => {
            sessionStorage.removeItem("authToken");
            router.push("/login");
          });
        }
      }
    };

    checkAuthStatus();
  }, [router]);

  // ดึงข้อมูลโปรโมชั่นทั้งหมด
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      if (typeof window !== "undefined") {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(`${API_URL}/promotions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPromotions(response.data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setError("ไม่สามารถดึงข้อมูลโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาโปรโมชั่น
  const searchPromotions = async () => {
    if (!searchTerm.trim()) {
      fetchPromotions();
      return;
    }

    try {
      setLoading(true);
      if (typeof window !== "undefined") {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(
          `${API_URL}/promotions/search?term=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPromotions(response.data);
        setError(null);
      }
    } catch (err) {
      console.error("Error searching promotions:", err);
      setError("ไม่สามารถค้นหาโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาเมื่อมีการเปลี่ยนแปลี่ยน
  useEffect(() => {
    if (isAdmin) {
      const delaySearch = setTimeout(() => {
        searchPromotions();
      }, 500);

      return () => clearTimeout(delaySearch);
    }
  }, [searchTerm, isAdmin]);

  // เปิดโมดัลเพิ่มโปรโมชั่นใหม่
  const openAddModal = () => {
    setEditMode(false);
    setCurrentId(null);
    setFormData({
      title: "",
      description: "",
      discount: 0,
      code: "",
      startDate: "",
      endDate: "",
      status: "active",
      maxUses: 0,
    });
    setShowModal(true);
  };

  // เปิดโหมดแก้ไข
  // เปิดโหมดแก้ไข
  const handleEdit = async (id) => {
    try {
      if (typeof window !== "undefined") {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(`${API_URL}/promotions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const promo = response.data;

        // แปลงวันที่ให้อยู่ในรูปแบบที่ input type="date" รองรับ
        const formatDate = (dateString) => {
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        setFormData({
          title: promo.title,
          description: promo.description || "",
          discount: promo.discount,
          code: promo.code,
          startDate: formatDate(promo.startDate),
          endDate: formatDate(promo.endDate),
          status: promo.status,
          maxUses: promo.maxUses || 0,
        });

        setEditMode(true);
        setCurrentId(id);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error fetching promotion details:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // ลบโปรโมชั่น
  const handleDelete = async (id) => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบโปรโมชั่นนี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (typeof window !== "undefined") {
            const token = sessionStorage.getItem("authToken");
            await axios.delete(`${API_URL}/promotions/${id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            fetchPromotions();
            Swal.fire({
              icon: "success",
              title: "ลบสำเร็จ!",
              text: "ลบโปรโมชั่นเรียบร้อยแล้ว",
              confirmButtonColor: "#ef4444",
            });
          }
        } catch (err) {
          console.error("Error deleting promotion:", err);
          if (err.response && err.response.status === 400) {
            Swal.fire({
              icon: "error",
              title: "เกิดข้อผิดพลาด",
              text: `ไม่สามารถลบโปรโมชั่นได้: ${err.response.data.error}`,
              confirmButtonColor: "#ef4444",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "เกิดข้อผิดพลาด",
              text: "ไม่สามารถลบโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง",
              confirmButtonColor: "#ef4444",
            });
          }
        }
      }
    });
  };

  // จัดการการส่งฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();

    // เพิ่มการตรวจสอบความถูกต้องของข้อมูล
    if (!formData.title.trim()) {
      Swal.fire({
        icon: "error",
        title: "กรุณากรอกชื่อโปรโมชั่น",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (!formData.code.trim()) {
      Swal.fire({
        icon: "error",
        title: "กรุณากรอกรหัสโปรโมชั่น",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (formData.discount <= 0 || formData.discount > 100) {
      Swal.fire({
        icon: "error",
        title: "ส่วนลดต้องมีค่าระหว่าง 1-100",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      Swal.fire({
        icon: "error",
        title: "กรุณากำหนดวันเริ่มต้นและวันสิ้นสุด",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    // ตรวจสอบว่าวันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      Swal.fire({
        icon: "error",
        title: "วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    try {
      if (typeof window !== "undefined") {
        const token = sessionStorage.getItem("authToken");

        // แสดง loading indicator
        Swal.fire({
          title: "กำลังดำเนินการ",
          text: "โปรดรอสักครู่...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        if (editMode) {
          // อัปเดตโปรโมชั่น
          await axios.put(`${API_URL}/promotions/${currentId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          Swal.fire({
            icon: "success",
            title: "อัปเดตสำเร็จ!",
            text: "อัปเดตโปรโมชั่นเรียบร้อยแล้ว",
            confirmButtonColor: "#ef4444",
          });
        } else {
          // สร้างโปรโมชั่นใหม่
          await axios.post(`${API_URL}/promotions`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          Swal.fire({
            icon: "success",
            title: "เพิ่มสำเร็จ!",
            text: "เพิ่มโปรโมชั่นเรียบร้อยแล้ว",
            confirmButtonColor: "#ef4444",
          });
        }

        // รีเฟรชข้อมูล
        fetchPromotions();

        // ปิดโมดัลและรีเซ็ทฟอร์ม
        setShowModal(false);
        setEditMode(false);
        setCurrentId(null);
        setFormData({
          title: "",
          description: "",
          discount: 0,
          code: "",
          startDate: "",
          endDate: "",
          status: "active",
          maxUses: 0,
        });
      }
    } catch (err) {
      console.error("Error saving promotion:", err);
      if (err.response && err.response.status === 400) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: `ไม่สามารถบันทึกโปรโมชั่นได้: ${err.response.data.error}`,
          confirmButtonColor: "#ef4444",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถบันทึกโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  // สร้างรหัสโปรโมชั่นแบบสุ่ม 6 หลัก
  const generatePromoCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    setFormData({ ...formData, code: result });
  };

  // จัดการการเปลี่ยนแปลี่ยนข้อมูลในฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 sm:w-8 sm:h-8 mr-2 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.45.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.781.929l.15-.894Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            ระบบจัดการโปรโมชั่น
          </h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-red-600">
                  หน้าหลัก
                </Link>
              </li>
              <li className="text-red-600 font-medium">จัดการโปรโมชั่น</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - ไม่มีการเปลี่ยนแปลี่ยนข้อมูล */}
          {/* Sidebar */}
          <aside className="w-full lg:w-64 bg-white shadow-sm rounded-xl border border-gray-100 p-6 flex-shrink-0 h-fit mb-6 lg:mb-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
              เมนูแอดมิน
            </h2>

            <ul className="space-y-1">
              <li>
                <Link
                  href="/adminedit"
                  className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                  จัดการสิทธิ์ผู้ใช้งาน
                </Link>
              </li>
              <li>
                <Link
                  href="/adminmenu"
                  className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                    />
                  </svg>
                  คำขอที่รออนุมัติ
                </Link>
              </li>
              <li>
                <Link
                  href="/Income"
                  className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                  รายงาน
                </Link>
              </li>
              <li>
                <Link
                  href="/promotion"
                  className="flex items-center p-3 rounded-lg bg-red-50 text-red-600 font-medium transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6h.008v.008H6V6Z"
                    />
                  </svg>
                  จัดการโปรโมชั่น
                </Link>
              </li>
            </ul>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 sm:p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  รายการโปรโมชั่น
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Search Box */}
                  <div className="relative w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 w-full sm:w-64"
                      placeholder="ค้นหาโปรโมชั่น..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Add Promotion Button */}
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                    onClick={openAddModal}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    เพิ่มโปรโมชั่น
                  </button>
                </div>
              </div>

              {/* แสดงข้อความโหลดข้อมูล */}
              {loading && (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                  <p className="mt-3 text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              )}

              {/* แสดงข้อความเมื่อเกิดข้อผิดพลาด */}
              {error && !loading && (
                <div className="text-center py-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 mx-auto text-red-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    เกิดข้อผิดพลาด
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{error}</p>
                  <button
                    onClick={fetchPromotions}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                </div>
              )}

              {/* Promotions Table - แสดงเมื่อไม่มีการโหลดและไม่มีข้อผิดพลาด */}
              {!loading && !error && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          ชื่อโปรโมชั่น
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          รายละเอียด
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          ส่วนลด
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          วันที่
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          รหัสโปรโมชั่น
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          จำนวนใช้งาน
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          สถานะ
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {promotions.length > 0 ? (
                        promotions.map((promotion) => (
                          <tr key={promotion.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {promotion.title}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {promotion.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {promotion.discount}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  promotion.startDate
                                ).toLocaleDateString("th-TH")}{" "}
                                -{" "}
                                {new Date(promotion.endDate).toLocaleDateString(
                                  "th-TH"
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded-md inline-block">
                                {promotion.code}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {promotion.usedCount || 0} /{" "}
                                {promotion.maxUses > 0
                                  ? promotion.maxUses
                                  : "∞"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  promotion.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {promotion.status === "active"
                                  ? "ใช้งาน"
                                  : "ไม่ใช้งาน"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  className="text-indigo-600 hover:text-indigo-900"
                                  onClick={() => handleEdit(promotion.id)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                    />
                                  </svg>
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={() => handleDelete(promotion.id)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0c.34-.059.68-.114 1.022-.165m0 0c.34-.059.68-.114 1.022-.165m0 0c.34-.059.68-.114 1.022-.165m0 0c.34-.059.68-.114 1.022-.165M20.226 10.02a8.25 8.25 0 00-1.021-.22m-1.022.165a8.25 8.25 0 00-.177-.022m-1.022.022a8.25 8.25 0 00-.177-.022m-1.022.022a8.25 8.25 0 00-.177-.022M4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center">
                            <div className="text-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-12 h-12 mx-auto text-gray-400"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 6h.008v.008H6V6Z"
                                />
                              </svg>
                              <h3 className="mt-2 text-sm font-medium text-gray-900">
                                ไม่พบโปรโมชั่น
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                ยังไม่มีโปรโมชั่นในระบบ
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Modal สำหรับเพิ่มโปรโมชั่น */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editMode ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่นใหม่"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded-full"
                  aria-label="ปิด"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      ชื่อโปรโมชั่น <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      รายละเอียด
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    ></textarea>
                  </div>
                             {/* เพิ่มส่วนกำหนดจำนวนการใช้งานสูงสุด */}
                             <div>
                    <label
                      htmlFor="maxUses"
                      className="block text-sm font-medium text-gray-700"
                    >
                      จำนวนการใช้งานสูงสุด
                      <span className="text-xs text-gray-500 ml-1">(0 = ไม่จำกัด)</span>
                    </label>
                    <input
                      type="number"
                      id="maxUses"
                      name="maxUses"
                      min="0"
                      value={formData.maxUses}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
                  <div>
                    <label
                      htmlFor="discount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      ส่วนลด (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="discount"
                      name="discount"
                      min="1"
                      max="100"
                      value={formData.discount}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="code"
                      className="block text-sm font-medium text-gray-700"
                    >
                      รหัสโปรโมชั่น <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={generatePromoCode}
                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100 focus:outline-none"
                      >
                        สร้างรหัส
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="startDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        วันที่เริ่มต้น <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="endDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        วันที่สิ้นสุด <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700"
                    >
                      สถานะ
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="active">ใช้งาน</option>
                      <option value="inactive">ไม่ใช้งาน</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {editMode ? "อัปเดต" : "เพิ่ม"}โปรโมชั่น
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;

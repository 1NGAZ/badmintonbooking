"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DatePickerWithRange } from "../components/DateRangePicker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "../components/Overview";
import { RecentSales } from "../components/RecentSales";
import Swal from "sweetalert2";
import "animate.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const Page = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  // เพิ่ม state สำหรับการแบ่งหน้า
  const [currentPage, setCurrentPage] = useState(1);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netIncome: 0,
    totalBookings: 0,
  });
  const [chartData, setChartData] = useState({
    income: [],
    expense: [],
    dates: [],
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const router = useRouter();

  // กำหนดจำนวนรายการต่อหน้า
  const itemsPerPage = 10;

  useEffect(() => {
    const checkLoginAndFetchData = async () => {
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
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          // ตรวจสอบว่าเป็น admin (roleId === 1) หรือไม่
          const isAdmin = userResponse.data?.roles?.some(
            (role) => role.id === 1
          );

          if (!isAdmin) {
            Swal.fire({
              title: "ไม่มีสิทธิ์เข้าถึง",
              text: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (ต้องเป็นผู้ดูแลระบบเท่านั้น)",
              icon: "error",
              confirmButtonText: "กลับไปหน้าหลัก",
            });
            setTimeout(() => router.push("/"), 2000);
            return;
          }

          // สร้าง headers object แยกเพื่อให้แน่ใจว่าถูกต้อง
          const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          };

          const response = await axios.get(`${API_URL}/reports/income`, {
            headers: headers,
            params: {
              startDate: dateRange.from
                ? new Date(dateRange.from).toISOString().split("T")[0]
                : undefined,
              endDate: dateRange.to
                ? new Date(dateRange.to).toISOString().split("T")[0]
                : undefined,
            },
          });

          if (response.data.error) {
            throw new Error(response.data.error);
          }

          setTransactions(response.data.transactions || []);

          // คำนวณสรุปข้อมูล
          const totalIncome = response.data.transactions
            .filter((item) => item.type === "income")
            .reduce((sum, item) => {
              // ใช้ discountedAmount ถ้ามี หรือใช้ amount ถ้าไม่มี
              const finalAmount =
                item.discountedAmount !== undefined &&
                item.discountedAmount !== null
                  ? parseFloat(item.discountedAmount)
                  : parseFloat(item.amount || 0);
              return sum + finalAmount;
            }, 0);
          // กำหนดให้รายจ่ายเป็น 0
          const totalExpense = 0;

          const totalBookings = response.data.transactions.filter(
            (item) => item.type === "income" && item.category === "booking"
          ).length;

          setSummary({
            totalIncome,
            totalExpense,
            netIncome: totalIncome - totalExpense,
            totalBookings,
          });

          // สร้างข้อมูลสำหรับกราฟ
          processChartData(response.data.transactions);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (typeof window !== "undefined") {
          if (error?.response?.status === 401) {
            router.push("/login");
          } else {
            setError(
              error?.response?.data?.message ||
                error.message ||
                "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"
            );
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoginAndFetchData();
  }, [router, dateRange]);
  // ฟังก์ชันสำหรับประมวลผลข้อมูลกราฟ
  const processChartData = (transactions) => {
    // สร้างแผนที่วันที่
    const dateMap = new Map();

    // กรองเฉพาะรายการรายรับที่มีวันที่
    const validTransactions = transactions.filter(
      (t) => t.createdAt && t.type === "income"
    );

    // หากไม่มีข้อมูล ให้ return ออกไป
    if (validTransactions.length === 0) {
      setChartData({ income: [], expense: [], dates: [] });
      return;
    }

    // เรียงลำดับตามวันที่
    validTransactions.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    // สร้างชุดข้อมูลสำหรับแต่ละวัน
    validTransactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt).toISOString().split("T")[0];

      if (!dateMap.has(date)) {
        dateMap.set(date, { income: 0, expense: 0 });
      }

      const entry = dateMap.get(date);

      if (transaction.type === "income") {
        entry.income += parseFloat(transaction.amount || 0);
      }
      // ไม่ต้องคำนวณรายจ่าย เพราะต้องการให้เป็น 0
    });

    // แปลงข้อมูลเป็นรูปแบบที่ใช้กับกราฟ
    const dates = Array.from(dateMap.keys());
    const incomeData = dates.map((date) => dateMap.get(date).income);
    const expenseData = dates.map(() => 0); // กำหนดให้รายจ่ายเป็น 0 ทุกวัน

    // จัดรูปแบบวันที่ให้อ่านง่ายขึ้น
    const formattedDates = dates.map((date) => {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    setChartData({
      income: incomeData,
      expense: expenseData,
      dates: formattedDates,
    });
  };

  // กรองข้อมูลตามคำค้นหา
  // กรองข้อมูลตามคำค้นหาและรวมรายการที่มาจาก reservation เดียวกัน
  const filteredTransactions = useMemo(() => {
    // กรองตามคำค้นหาก่อน
    const filtered = transactions.filter(
      (item) =>
        // ค้นหาจากคำอธิบาย
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // ค้นหาจากชื่อผู้ใช้
        item.user?.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // ค้นหาจากประเภทรายการ
        item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // ค้นหาจากชื่อสนาม
        item.court?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // ค้นหาจากสถานที่
        item.court?.location
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        // ค้นหาจากจำนวนเงิน
        String(item.amount || "").includes(searchTerm) ||
        // ค้นหาจากสถานะ
        item.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // ค้นหาจากวันที่ (ในรูปแบบที่แสดงในตาราง)
        (item.createdAt &&
          formatDate(item.createdAt)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );

    // สร้าง Map เพื่อรวมรายการที่มี reservationId เดียวกัน
    const reservationMap = new Map();

    // ส่วนที่เหลือยยยังคงเหมือนเดิม
    filtered.forEach((item) => {
      // ใช้ discountedAmount ถ้ามี หรือใช้ amount ถ้าไม่มี
      const finalAmount =
        item.discountedAmount !== undefined && item.discountedAmount !== null
          ? parseFloat(item.discountedAmount)
          : parseFloat(item.amount || 0);

      if (item.reservationId) {
        if (!reservationMap.has(item.reservationId)) {
          reservationMap.set(item.reservationId, {
            ...item,
            // ใช้ราคาหลังหักส่วนลดเป็นยอดเงินที่แสดง
            totalAmount: finalAmount,
            // เก็บค่าเดิมไว้ด้วยเผื่อต้องใช้
            originalAmount: parseFloat(item.amount || 0),
          });
        } else {
          const existingItem = reservationMap.get(item.reservationId);
          existingItem.totalAmount += finalAmount;
          existingItem.originalAmount += parseFloat(item.amount || 0);
        }
      } else {
        // ถ้าไม่มี reservationId ให้ใช้ id ของรายการเป็น key
        reservationMap.set(item.id, {
          ...item,
          totalAmount: finalAmount,
          originalAmount: parseFloat(item.amount || 0),
        });
      }
    });

    return Array.from(reservationMap.values());
  }, [transactions, searchTerm]);
  // คำนวณข้อมูลสำหรับหน้าปัจจุบัน
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // ฟังก์ชั่นช่วยจัดรูปแบบวันที่
  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "-";
    // สร้าง Date object และใช้ UTC เพื่อให้ตรงกับข้อมูลในฐานข้อมูล
    const date = new Date(dateTimeString);
    const thaiYear = date.getUTCFullYear();
    return `${date.getUTCDate()} ${getThaiMonth(
      date.getUTCMonth()
    )} ${thaiYear}`;
  };

  // ฟังก์ชั่นช่วยแปลงเดือนเป็นภาษาไทย
  const getThaiMonth = (month) => {
    const thaiMonths = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    return thaiMonths[month];
  };

  // ฟังก์ชั่นช่วยจัดรูปแบบเงิน
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // สลับการแสดงผล sidebar บนมือถือ
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-8 mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-7 h-7 sm:w-8 sm:h-8 mr-2 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            รายงาน
          </h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-red-600">
                  หน้าหลัก
                </Link>
              </li>
              <li className="text-red-600 font-medium">รายงาน</li>
            </ul>
          </div>
        </div>

        <div className="md:flex md:gap-6">
          {/* Mobile sidebar toggle button */}
          <div className="md:hidden mb-4">
            <button
              onClick={toggleSidebar}
              className="flex items-center w-full px-4 py-2 bg-white shadow-sm rounded-lg border border-gray-100 text-gray-700 hover:bg-gray-50"
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
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
              {showSidebar ? "ซ่อนเมนู" : "แสดงเมนูแอดมิน"}
            </button>
          </div>

          {/* Sidebar for mobile - conditional rendering */}
          {showSidebar && (
            <aside className="w-full md:hidden bg-white shadow-sm rounded-xl border border-gray-100 p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
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
                        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                      />
                    </svg>
                    รายงาน
                  </Link>
                </li>
                <li>
                  <Link
                    href="/promotion"
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
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    จัดการโปรโมชั่น
                  </Link>
                </li>
              </ul>
            </aside>
          )}

          {/* Sidebar for desktop - always visible */}
          <aside className="hidden md:block w-64 bg-white shadow-sm rounded-xl border border-gray-100 p-6 flex-shrink-0 h-fit">
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
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                  รายงาน
                </Link>
              </li>
              <li>
                <Link
                  href="/promotion"
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
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  จัดการโปรโมชั่น
                </Link>
              </li>
            </ul>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-center justify-between space-y-2 mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                ภาพรวมการเงิน
              </h2>
              <div className="w-64">
                <DatePickerWithRange setDateRange={setDateRange} />
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
                <TabsTrigger value="transactions">รายการทั้งหมด</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        รายรับทั้งหมด
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-green-600"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary.totalIncome)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        จากการจอง {summary.totalBookings} รายการ
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        รายจ่ายทั้งหมด
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-red-600"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(summary.totalExpense)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ค่าใช้จ่ายในการดำเนินงาน
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        รายรับสุทธิ
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-blue-600"
                      >
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <path d="M2 10h20" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${
                          summary.netIncome >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(summary.netIncome)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {summary.netIncome >= 0 ? "กำไร" : "ขาดทุน"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        จำนวนการจอง
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-purple-600"
                      >
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summary.totalBookings}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        รายการจองทั้งหมด
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-4">
                    <CardHeader>
                      <CardTitle>ภาพรวมรายรับรายจ่าย</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <Overview chartData={chartData} />
                    </CardContent>
                  </Card>

                  <Card className="col-span-3">
                    <CardHeader>
                      <CardTitle>รายการล่าสุด</CardTitle>
                      <CardDescription>
                        รายการรายรับรายจ่ายล่าสุด{" "}
                        {transactions.slice(0, 5).length} รายการ
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RecentSales transactions={transactions.slice(0, 5)} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle>รายการทั้งหมด</CardTitle>
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
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 w-full"
                          placeholder="ค้นหารายการ..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p className="text-gray-500 mt-4">
                        ไม่พบรายการในช่วงเวลาที่เลือก
                        </p>
                      </div>
                    ) : filteredTransactions.length === 0 ? (
                      <div className="text-center py-20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto text-gray-400"
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
                        <p className="text-gray-500 mt-4">
                          ไม่พบรายการที่ตรงกับการค้นหา
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full text-sm text-left text-gray-700">
                            <thead className="text-xs uppercase bg-gray-50 text-gray-700 border-t border-b">
                              <tr>
                                <th className="px-4 py-3 w-12 text-center">
                                  #
                                </th>
                                <th className="px-4 py-3">วันที่</th>
                                <th className="hidden sm:table-cell px-4 py-3">
                                  เวลาเริ่ม
                                </th>
                                <th className="hidden sm:table-cell px-4 py-3">
                                  เวลาสิ้นสุด
                                </th>
                                <th className="px-4 py-3">ประเภท</th>
                                <th className="hidden md:table-cell px-4 py-3">
                                  สนาม
                                </th>
                                <th className="hidden md:table-cell px-4 py-3">
                                  ผู้ทำรายการ
                                </th>
                                <th className="px-4 py-3 text-right">
                                  จำนวนเงิน
                                </th>
                                <th className="px-4 py-3 text-center">สถานะ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems.map((item, index) => (
                                <tr
                                  key={index}
                                  className={`border-b hover:bg-gray-50 transition-colors duration-150 ${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  }`}
                                >
                                  <td className="px-4 py-3 text-center text-xs sm:text-sm font-medium">
                                    {indexOfFirstItem + index + 1}
                                  </td>
                                  <td className="px-4 py-3 text-xs sm:text-sm">
                                    {formatDate(
                                      item.createdAt ||
                                        item.timeSlot?.start_time
                                    )}
                                  </td>
                                  <td className="hidden sm:table-cell px-4 py-3 text-xs sm:text-sm">
                                    {item.timeSlot?.start_time
                                      ? new Date(
                                          item.timeSlot.start_time
                                        ).toLocaleTimeString("th-TH", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: false,
                                          timeZone: "Asia/Bangkok",
                                        })
                                      : "-"}
                                  </td>
                                  <td className="hidden sm:table-cell px-4 py-3 text-xs sm:text-sm">
                                    {item.timeSlot?.end_time
                                      ? new Date(
                                          item.timeSlot.end_time
                                        ).toLocaleTimeString("th-TH", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: false,
                                          timeZone: "Asia/Bangkok",
                                        })
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-xs sm:text-sm">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.type === "income"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {item.type === "income"
                                        ? "รายรับ"
                                        : "รายจ่าย"}
                                    </span>
                                  </td>
                                  <td className="hidden md:table-cell px-4 py-3 text-xs sm:text-sm">
                                    {item.court?.name || "-"}
                                  </td>
                                  <td className="hidden md:table-cell px-4 py-3 text-xs sm:text-sm">
                                    {item.user?.fname
                                      ? `${item.user.fname} ${
                                          item.user.lname || ""
                                        }`
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs sm:text-sm font-medium">
                                    <span
                                      className={
                                        item.type === "income"
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {formatCurrency(
                                        item.totalAmount || item.amount
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs sm:text-sm">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.status === "อนุมัติ"
                                          ? "bg-green-100 text-green-800"
                                          : item.status === "รอดำเนินการ"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {item.status === "อนุมัติ"
                                        ? "สำเร็จ"
                                        : item.status === "รอดำเนินการ"
                                        ? "รอดำเนินการ"
                                        : "ยกเลิก"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-medium text-gray-900 border-t border-b">
                              <tr>
                                <td
                                  colSpan="6"
                                  className="px-4 py-3 text-right text-xs sm:text-sm"
                                >
                                  รวมทั้งสิ้น:
                                </td>
                                <td className="px-4 py-3 text-right text-xs sm:text-sm">
                                  {new Intl.NumberFormat("th-TH", {
                                    style: "currency",
                                    currency: "THB",
                                  }).format(
                                    filteredTransactions.reduce(
                                      (sum, item) =>
                                        sum +
                                        parseFloat(
                                          item.totalAmount || item.amount || 0
                                        ),
                                      0
                                    )
                                  )}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="mt-6 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              หน้า {currentPage} จาก {totalPages} (รายการทั้งหมด{" "}
                              {filteredTransactions.length} รายการ)
                            </div>
                            <div className="flex gap-2">
                              {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                  key={i + 1}
                                  onClick={() => handlePageChange(i + 1)}
                                  className={`px-3 py-1 border border-gray-300 rounded-md ${
                                    currentPage === i + 1
                                      ? "bg-red-600 text-white"
                                      : "text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Page;

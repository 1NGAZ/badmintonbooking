"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import axios from "axios";
const Page = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          setNotification({
            type: "error",
            message: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }

        const response = await axios.get(
          "http://localhost:8000/history/history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        if (!response?.data) {
          throw new Error("ไม่พบข้อมูลการจอง");
        }

        // แปลงข้อมูลและเรียงลำดับตามวันที่จองล่าสุด
        const sortedReservations = response.data
          .map((res) => {
            // สร้าง Date object จากข้อมูลเวลาเริ่มต้น
            const startTime = new Date(res.timeSlot.start_time);
            
            return {
              ...res,
              timeSlot: {
                ...res.timeSlot,
                start_time: startTime.toISOString(),
                end_time: new Date(res.timeSlot.end_time).toISOString(),
              },
              court: {
                ...res.court,
                name: res.court?.name || "ไม่ระบุ",
                detail: res.court?.detail || "ไม่มีรายละเอียด",
                price: res.court?.price || 0,
              },
              status: res.status || { id: 0, name: "ไม่ระบุ" },
              // เพิ่ม sortDate เพื่อใช้ในการเรียงลำดับ
              sortDate: startTime.getTime()
            };
          })
          .sort((a, b) => {
            // เรียงจากวันที่จองล่าสุด (ใหม่ไปเก่า)
            return b.sortDate - a.sortDate;
          });

        console.log("Sorted reservations:", sortedReservations.slice(0, 3).map(r => ({
          id: r.id,
          date: new Date(r.timeSlot.start_time).toLocaleDateString(),
          time: new Date(r.timeSlot.start_time).toLocaleTimeString(),
          sortDate: r.sortDate
        })));

        setReservations(sortedReservations);
      } catch (err) {
        console.error("Reservation fetch error:", err);
        setNotification({
          type: "error",
          message: err.message || "ไม่สามารถโหลดข้อมูลได้",
        });
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [token]);

  // คำนวณข้อมูลสำหรับหน้าปัจจุบัน
  const filteredReservations = reservations.filter((reservation) => {
    const searchLower = searchTerm.toLowerCase();

    // ค้นหาจากชื่อสนาม, สถานที่, สถานะ
    const courtNameMatch = (reservation.court?.name || "")
      .toLowerCase()
      .includes(searchLower);
    const locationMatch = (reservation.court?.location || "")
      .toLowerCase()
      .includes(searchLower);
    const statusMatch = (reservation.status?.name || "")
      .toLowerCase()
      .includes(searchLower);

    // ค้นหาจากวันที่
    const startDate = new Date(reservation.timeSlot?.start_time);
    const dateString = startDate
      .toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
      .toLowerCase();
    const dateMatch = dateString.includes(searchLower);

    // ค้นหาจากราคา
    const price = String(
      reservation.totalPrice || reservation.court?.price || ""
    );
    const priceMatch = price.includes(searchTerm);

    // ค้นหาจากชั่วโมง
    const hours = String(reservation.totalHours || 1);
    const hoursMatch =
      hours.includes(searchTerm) ||
      (hours + " ชม.").includes(searchTerm) ||
      (hours + " ชั่วโมง").includes(searchTerm);

    return (
      courtNameMatch ||
      locationMatch ||
      statusMatch ||
      dateMatch ||
      priceMatch ||
      hoursMatch
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReservations = filteredReservations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : notification.type === "error"
              ? "bg-red-100 text-red-800 border-l-4 border-red-500"
              : "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "success" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {notification.type === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

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
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
              />
            </svg>
            ประวัติการจองสนาม
          </h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-red-600">
                  หน้าหลัก
                </Link>
              </li>
              <li className="text-red-600 font-medium">ประวัติการจอง</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
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
              เมนูสำหรับผู้ใช้
            </h2>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/edituser"
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
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                  แก้ไขข้อมูลส่วนตัว
                </Link>
              </li>
              <li>
                <Link
                  href="/reservationhistory"
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
                      d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
                    />
                  </svg>
                  ประวัติการจอง
                </Link>
              </li>
            </ul>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 sm:p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  รายการจองทั้งหมด
                </h2>

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
                    placeholder="ค้นหาการจอง..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              ) : filteredReservations.length === 0 ? (
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
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-500 mt-4">
                    ยังไม่มีข้อมูลประวัติการจองสนาม
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-700">
                        <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">#</th>
                            <th className="px-4 py-3">สนาม</th>
                            <th className="hidden md:table-cell px-4 py-3">
                              รายละเอียด
                            </th>
                            <th className="hidden sm:table-cell px-4 py-3">
                              ชั่วโมง
                            </th>
                            <th className="px-4 py-3">วันที่</th>
                            <th className="hidden sm:table-cell px-4 py-3">
                              เวลาเริ่ม
                            </th>
                            <th className="hidden sm:table-cell px-4 py-3">
                              สิ้นสุด
                            </th>
                            <th className="px-4 py-3">ราคา</th>
                            <th className="px-4 py-3">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {currentReservations.map((reservation, index) => (
                            <tr
                              key={reservation.id}
                              className={`hover:bg-gray-50 transition-colors duration-150 ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="px-4 py-3 text-center text-xs sm:text-sm font-medium">
                                {index + 1 + (currentPage - 1) * itemsPerPage}
                              </td>
                              <td className="px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">
                                {reservation.court.name}
                              </td>
                              <td className="hidden md:table-cell px-4 py-3 text-xs sm:text-sm">
                                {reservation.court.detail}
                              </td>
                              <td className="hidden sm:table-cell px-4 py-3 text-xs sm:text-sm">
                                {reservation.totalHours || 1} ชม.
                              </td>
                              <td className="px-4 py-3 text-xs sm:text-sm">
                                {new Date(reservation.timeSlot.start_time)
                                  .toLocaleDateString("th-TH", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    timeZone: "Asia/Bangkok",
                                  })
                                  .replace(/\d{4}/, (year) =>
                                    (parseInt(year) - 543).toString()
                                  )}
                              </td>
                              <td className="hidden sm:table-cell px-4 py-3 text-xs sm:text-sm">
                                {new Date(
                                  reservation.timeSlot.start_time
                                ).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: "Asia/Bangkok",
                                })}
                              </td>
                              <td className="hidden sm:table-cell px-4 py-3 text-xs sm:text-sm">
                                {new Date(
                                  reservation.timeSlot.end_time
                                ).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: "Asia/Bangkok",
                                })}
                              </td>
                              <td className="px-4 py-3 text-xs sm:text-sm font-medium">
  {reservation.discountAmount > 0 ? (
    <div>
      <span className="line-through text-gray-400 mr-1">
        {reservation.totalPrice.toFixed(0)} บาท
      </span>
      <span className="text-red-600">
        {reservation.discountedPrice.toFixed(0)} บาท
      </span>
      {reservation.promotionCode && (
        <div className="text-xs text-green-600 mt-1">
          โค้ด: {reservation.promotionCode}
        </div>
      )}
    </div>
  ) : (
    <span>{reservation.totalPrice.toFixed(0)} บาท</span>
  )}
</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    reservation.status.id === 3
                                      ? "bg-green-100 text-green-800"
                                      : reservation.status.id === 1
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {reservation.status.name}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                        หน้า {currentPage} จาก {totalPages} (รายการทั้งหมด{" "}
                        {filteredReservations.length} รายการ)
                      </div>
                      <div className="flex flex-wrap gap-2 order-1 sm:order-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md ${
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
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Page;

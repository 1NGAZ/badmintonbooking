"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const API_URL = process.env.PUBLIC_NEXT_API_URL || "http://localhost:8000"; 

const Page = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkLoginAndFetchData = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          router.push("/login");
          return;
        }

        // ดึงข้อมูลผู้ใช้เพื่อตรวจสอบบทบาท
        const userResponse = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const isAdmin = userResponse.data?.roles?.some((role) => role.id === 1);
        
        if (!isAdmin) {
          setError("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (ต้องเป็นผู้ดูแลระบบเท่านั้น)");
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        // ดึงข้อมูลหลังจากตรวจสอบสิทธิ์แล้ว
        try {
          const usersResponse = await axios.get(`${API_URL}/roles/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsers(usersResponse.data || []);
        } catch (error) {
          console.error("Users fetch error:", error.response?.data || error.message);
          if (error.response?.status === 403) {
            setError("คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้");
          }
        }
        
        // กำหนดค่า roles เริ่มต้น
        setRoles([
          { id: 1, name: "Admin" },
          { id: 2, name: "User" }
        ]);
      } catch (error) {
        if (error?.response?.status === 401) {
          router.push("/login");
        } else {
          setError(error?.response?.data?.message || error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoginAndFetchData();
  }, [router]);

  const handleRoleChange = async (userId, newRoleIds) => {
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
  
      // ตรวจสอบว่าผู้ใช้พยายามเปลี่ยนแปลงสิทธิ์ของตัวเองหรือไม่
      const profileResponse = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (parseInt(userId) === profileResponse.data.id) {
        throw new Error("ไม่สามารถเปลี่ยนแปลงสิทธิ์ของตัวเองได้");
      }
      
      setNotification({
        type: "loading",
        message: "กำลังอัพเดตสิทธิ์..."
      });
  
      // ส่งคำขอเปลี่ยนแปลง role แบบง่าย
      const response = await axios.post(
       `${API_URL}/roles/assign`,
        {
          userId: parseInt(userId),
          roleId: parseInt(newRoleIds[0])
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log("API Response:", response.data);
  
      // ดึงข้อมูลผู้ใช้ใหม่หลังจากอัพเดต
      const updatedUsersResponse = await axios.get(
        `${API_URL}/roles/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(updatedUsersResponse.data || []);
      
      setNotification({
        type: "success",
        message: "อัพเดตสิทธิ์เรียบร้อย"
      });
  
      setTimeout(() => {
        setNotification(null);
      }, 3000);
  
    } catch (error) {
      // console.error('Error:', error.response?.status, error.response?.data, error.message);
      
      let errorMessage = "ไม่สามารถเปลี่ยนแปลงสิทธิ์ได้";
      
      if (error.response?.status === 403) {
        errorMessage = "คุณไม่มีสิทธิ์ในการเปลี่ยนแปลงสิทธิ์ผู้ใช้";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNotification({
        type: "error",
        message: errorMessage
      });
  
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  // กรองผู้ใช้ตามคำค้นหา
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      
      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === "success" ? "bg-green-100 text-green-800 border-l-4 border-green-500" : 
          notification.type === "error" ? "bg-red-100 text-red-800 border-l-4 border-red-500" : 
          "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
        }`}>
          <div className="flex items-center">
            {notification.type === "success" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === "error" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === "loading" && (
              <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.45.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            ระบบจัดการสิทธิ์ผู้ใช้งาน
          </h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-red-600">
                  หน้าหลัก
                </Link>
              </li>
              <li className="text-red-600 font-medium">จัดการสิทธิ์ผู้ใช้งาน</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 bg-white shadow-sm rounded-xl border border-gray-100 p-6 flex-shrink-0 h-fit mb-6 lg:mb-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              เมนูแอดมิน
            </h2>
            
            <ul className="space-y-1">
              <li>
                <Link
                  href="/adminedit"
                  className="flex items-center p-3 rounded-lg bg-red-50 text-red-600 font-medium transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  จัดการสิทธิ์ผู้ใช้งาน
                </Link>
              </li>
              <li>
                <Link
                  href="/adminmenu"
                  className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                  </svg>
                  คำขอที่รออนุมัติ
                </Link>
              </li>
              <li>
                <Link
                  href="/Income"
                  className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  รายงาน
                </Link>
              </li>
              <li>
                <Link
                  href="/promotion"
                  className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">จัดการสิทธิ์ผู้ใช้งาน</h2>
                
                {/* Search Box */}
                <div className="relative w-full sm:w-auto">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 w-full sm:w-64"
                    placeholder="ค้นหาผู้ใช้..."
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 mt-4">ยังไม่มีข้อมูลผู้ใช้งาน</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 mt-4">ไม่พบผู้ใช้ที่ตรงกับการค้นหา</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-sm text-left text-gray-700">
                      <thead className="text-xs uppercase bg-gray-50 text-gray-700 border-t border-b">
                        <tr>
                          <th className="px-4 py-3 w-12 text-center">#</th>
                          <th className="px-4 py-3">อีเมล</th>
                          <th className="hidden sm:table-cell px-4 py-3">ชื่อ-นามสกุล</th>
                          <th className="hidden md:table-cell px-4 py-3">เบอร์โทร</th>
                          <th className="px-4 py-3 text-center">สิทธิ์การใช้งาน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user, index) => (
                          <tr
                            key={user.id}
                            className={`border-b hover:bg-gray-50 transition-colors duration-150 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-4 py-3 text-center font-medium">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{user.email}</div>
                            </td>
                            <td className="hidden sm:table-cell px-4 py-3">
                              {user.fname && user.lname ? `${user.fname} ${user.lname}` : "-"}
                            </td>
                            <td className="hidden md:table-cell px-4 py-3">{user.phone || "-"}</td>
                            <td className="px-4 py-3">
                              <Select
                                defaultValue={user.roles?.[0]?.id.toString() || "1"}
                                onValueChange={(value) => handleRoleChange(user.id, [parseInt(value)])}
                                className="w-full max-w-xs mx-auto"
                              >
                                <SelectTrigger className="w-full text-xs sm:text-sm">
                                  <SelectValue placeholder="เลือกสิทธิ์การใช้งาน" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>สิทธิ์การใช้งาน</SelectLabel>
                                    {roles.map(role => (
                                      <SelectItem key={role.id} value={role.id.toString()}>
                                        {role.name}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Page;

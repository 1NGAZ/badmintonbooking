"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Link from "next/link";
import axios from "axios";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Page = () => {
  const [userData, setUserData] = useState({
    fname: "",
    lname: "",
    id: "",
    email: "",
    phone: "",
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen1, setIsOpen1] = useState(false);

  const handleNameChange = (e) => setName(e.target.value);
  const handlePhoneChange = (e) => setPhone(e.target.value);

  const handleUpdateName = async () => {
    try {
      if (!name.trim()) {
        toast.error("กรุณากรอกชื่อ-นามสกุล");
        return;
      }

      const nameParts = name.trim().split(" ");
      if (nameParts.length !== 2) {
        toast.error("กรุณากรอกชื่อและนามสกุลให้ถูกต้อง");
        return;
      }

      const [fname, lname] = nameParts;
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const response = await axios.patch(
        "http://localhost:8000/user/users/profile",
        { fname, lname },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData({ ...userData, fname: response.data.user.fname, lname: response.data.user.lname });
      toast.success("อัพเดทชื่อสำเร็จ");
      setIsOpen(false);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาดในการอัพเดทชื่อ");
    }
  };

  const handleUpdatePhone = async () => {
    try {
      if (!phone.trim()) {
        toast.error("กรุณากรอกเบอร์โทรศัพท์");
        return;
      }

      const token = sessionStorage.getItem("authToken");
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const response = await axios.patch(
        "http://localhost:8000/user/users/profile",
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData({ ...userData, phone: response.data.user.phone });
      toast.success("อัพเดทเบอร์โทรศัพท์สำเร็จ");
      setIsOpen1(false);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาดในการอัพเดทเบอร์โทรศัพท์");
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/user/selectuserid", {
          withCredentials: true,
        });
        setUserData(response.data);
      } catch (error) {
        console.log({ message: error });
      }
    };
    fetchUserData();
  }, []);

  if (!userData) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center">
      <ToastContainer position="bottom-right" />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center mt-12 mb-6">
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
              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          ตั้งค่าสมาชิก
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 bg-white shadow-md rounded-xl p-6 flex-shrink-0 mb-6 lg:mb-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">เมนูสำหรับผู้ใช้</h2>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/edituser"
                  className="flex items-center text-gray-700 hover:text-red-600 transition-colors duration-200"
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
                  <span>แก้ไขข้อมูลส่วนตัว</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/reservationhistory"
                  className="flex items-center text-gray-700 hover:text-red-600 transition-colors duration-200"
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
                  <span>ประวัติการจอง</span>
                </Link>
              </li>
            </ul>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white shadow-md rounded-xl p-4 sm:p-6">
            <div className="flex items-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
                />
              </svg>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">แก้ไขข้อมูลส่วนตัว</h2>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">ชื่อบัญชี</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={`${userData.fname || ""} ${userData.lname || ""}`}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 text-sm sm:text-base"
                    disabled
                  />
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <button className="ml-2 p-2 text-gray-600 hover:text-yellow-600 transition-colors duration-200">
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
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                          />
                        </svg>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-w-[95vw] rounded-lg">
                      <DialogHeader>
                        <DialogTitle>แก้ไขชื่อ-นามสกุล</DialogTitle>
                        <DialogDescription>กรุณากรอกชื่อและนามสกุลใหม่</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <Label className="sm:w-24 sm:text-right">ชื่อ-นามสกุล</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="ชื่อ นามสกุล"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button onClick={handleUpdateName} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                          บันทึก
                        </Button>
                        <Button onClick={() => setIsOpen(false)} variant="outline" className="w-full sm:w-auto">
                          ยกเลิก
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* UID */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">UID</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={userData.id || ""}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 text-sm sm:text-base"
                    disabled
                  />
                  <button className="ml-2 p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
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
                        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">อีเมล</label>
                <input
                  type="email"
                  value={userData.email || ""}
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 text-sm sm:text-base"
                  disabled
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">เบอร์โทรศัพท์</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={userData.phone || ""}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 text-sm sm:text-base"
                    disabled
                  />
                  <Dialog open={isOpen1} onOpenChange={setIsOpen1}>
                    <DialogTrigger asChild>
                      <button className="ml-2 p-2 text-gray-600 hover:text-yellow-600 transition-colors duration-200">
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
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                          />
                        </svg>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-w-[95vw] rounded-lg">
                      <DialogHeader>
                        <DialogTitle>แก้ไขเบอร์โทรศัพท์</DialogTitle>
                        <DialogDescription>กรุณากรอกเบอร์โทรศัพท์ใหม่</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <Label className="sm:w-24 sm:text-right">เบอร์โทรศัพท์</Label>
                          <Input
                            id="phone"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="เบอร์โทรศัพท์"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button onClick={handleUpdatePhone} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                          บันทึก
                        </Button>
                        <Button onClick={() => setIsOpen1(false)} variant="outline" className="w-full sm:w-auto">
                          ยกเลิก
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Page;
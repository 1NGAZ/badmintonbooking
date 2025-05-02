"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SettingButton = ({ court, selectedDate }) => {
  const [courtName, setCourtName] = useState(court.name);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const leftColumn = timeSlots.slice(0, timeSlots.length / 2);
  const rightColumn = timeSlots.slice(timeSlots.length / 2);

  // ดึง timeSlots ตาม courtId และวันที่
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        // ปรับปรุงการจัดการวันที่ให้เรียบง่ายขึ้น
        const formattedDate = selectedDate?.from
          ? format(new Date(selectedDate.from), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd");

        const response = await axios.get(
          `${API_URL}/courts/${court.id}/timeslots?date=${formattedDate}`
        );

        // แปลงเวลาให้อยู่ในรูปแบบที่ต้องการ
        const fetchedSlots = response.data.map((slot) => {
          // const startTime = new Date(slot.start_time);
          // const endTime = new Date(slot.end_time);
          const startTime = new Date(
            new Date(slot.start_time).getTime() - 7 * 60 * 60 * 1000
          );
          const endTime = new Date(
            new Date(slot.end_time).getTime() - 7 * 60 * 60 * 1000
          );
          return {
            id: slot.id,
            start: format(startTime, "HH:mm"),
            end: format(endTime, "HH:mm"),
            statusId: slot.statusId,
            checked: slot.statusId === 4,
            rawStartTime: slot.start_time,
            rawEndTime: slot.end_time,
          };
        });
        // เรียงลำดับตามเวลาเริ่มต้น
        const sortedSlots = fetchedSlots.sort((a, b) => {
          return new Date(a.rawStartTime) - new Date(b.rawStartTime);
        });

        setTimeSlots(sortedSlots);
        // setTimeSlots(fetchedSlots);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching time slots:", error);
        setLoading(false);
      }
    };
    fetchTimeSlots();
  }, [court.id, selectedDate]);
  const handleToggleChange = (index) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index].checked = !updatedSlots[index].checked;
    setTimeSlots(updatedSlots);
  };

  const handleSave = async () => {
    try {
      const updatedTimeSlots = timeSlots.map((slot) => ({
        id: slot.id,
        statusId: slot.checked ? 4 : 1,
      }));

      const response = await axios.put(
        `${API_URL}/courts/${court.id}/timeslots`,
        { timeSlots: updatedTimeSlots }
      );
      console.log("บันทึกสถานะสำเร็จ:", response.data);

      if (courtName !== court.name) {
        await axios.put(`${API_URL}/courteditname/${court.id}`, {
          name: courtName,
        });
        console.log("บันทึกชื่อสนามสำเร็จ");
      }

      toast.success("บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึก:", error);

      let errorMessage = "เกิดข้อผิดพลาดในการบันทึก: ";
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        errorMessage +=
          error.response.data?.message ||
          error.response.statusText ||
          error.message;
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage += "ไม่ได้รับการตอบกลับจากเซิร์ฟเวอร์";
      } else {
        errorMessage += error.message;
      }

      // แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาดด้วย Toastify
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;

  return (
    <>
      <ToastContainer />
      <Sheet>
        <SheetTrigger asChild>
          <button className="setting-btn flex items-center justify-center">
            <span className="bar bar1" />
            <span className="bar bar2" />
            <span className="bar bar1" />
          </button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>จัดการสนาม</SheetTitle>
            <SheetDescription>
              แก้ไขชื่อสนาม เปิดปิดการใช้งานสนาม
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                ชื่อสนาม
              </Label>
              <Input
                id="name"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                {leftColumn.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <Label className="text-left w-16 flex flex-col items-center">
                      {slot.start}
                      <span className="text-center">-</span>
                      {slot.end}
                    </Label>
                    <label className="relative inline-flex items-center justify-center flex-grow cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.checked}
                        onChange={() => handleToggleChange(index)}
                        className="sr-only peer"
                      />
                      <div className="group peer ring-0 bg-rose-400 rounded-full outline-none duration-300 after:duration-300 w-24 h-12 shadow-md peer-checked:bg-emerald-500 peer-focus:outline-none after:content-['OFF'] after:rounded-full after:absolute after:bg-gray-50 after:outline-none after:h-10 after:w-10 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-checked:after:content-['ON'] peer-checked:after:translate-x-12 peer-hover:after:scale-95">
                        {/* SVG icons */}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                {rightColumn.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <Label className="text-left w-16 flex flex-col items-center">
                      {slot.start}
                      <span className="text-center">-</span>
                      {slot.end}
                    </Label>
                    <label className="relative inline-flex items-center justify-center flex-grow cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.checked}
                        onChange={() =>
                          handleToggleChange(index + leftColumn.length)
                        }
                        className="sr-only peer"
                      />
                      <div className="group peer ring-0 bg-rose-400 rounded-full outline-none duration-300 after:duration-300 w-24 h-12 shadow-md peer-checked:bg-emerald-500 peer-focus:outline-none after:content-['OFF'] after:rounded-full after:absolute after:bg-gray-50 after:outline-none after:h-10 after:w-10 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-checked:after:content-['ON'] peer-checked:after:translate-x-12 peer-hover:after:scale-95">
                        {/* SVG icons */}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit" onClick={handleSave}>
                Save changes
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SettingButton;

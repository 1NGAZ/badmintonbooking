"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
        const formattedDate = selectedDate?.from
          ? format(selectedDate.from, "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"); // ใช้ current date ถ้าไม่มีวันที่เลือก

        const response = await axios.get(
          `http://localhost:8000/courts/${court.id}/timeslots?date=${formattedDate}`
        );
        const fetchedSlots = response.data.map((slot) => ({
          id: slot.id,
          start: slot.start_time.split("T")[1].slice(0, 5), // แปลงเป็น HH:mm
          end: slot.end_time.split("T")[1].slice(0, 5), // แปลงเป็น HH:mm
          statusId: slot.statusId,
          checked: slot.statusId === 4, // เฉพาะ statusId 4 (ว่าง) เท่านั้นที่ถือว่าเปิด
        }));
        setTimeSlots(fetchedSlots);
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
      // บันทึกการเปลี่ยนแปลงสถานะ timeSlots ก่อน
      const updatedTimeSlots = timeSlots.map((slot) => ({
        id: slot.id,
        statusId: slot.checked ? 4 : 1,
      }));

      const response = await axios.put(
        `http://localhost:8000/courts/${court.id}/timeslots`,
        { timeSlots: updatedTimeSlots }
      );
      console.log("บันทึกสถานะสำเร็จ:", response.data);
      
      // เปิดใช้งานการอัปเดตชื่อสนาม
      if (courtName !== court.name) {
        await axios.put(
          `http://localhost:8000/courteditname/${court.id}`,
          { name: courtName }
        );
        console.log("บันทึกชื่อสนามสำเร็จ");
      }
      
      // แสดงการแจ้งเตือนเมื่อบันทึกสำเร็จด้วย Toastify
      toast.success('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึก:", error);
      
      let errorMessage = "เกิดข้อผิดพลาดในการบันทึก: ";
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        errorMessage += error.response.data?.message || error.response.statusText || error.message;
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
            <SheetDescription>แก้ไขชื่อสนาม เปิดปิดการใช้งานสนาม</SheetDescription>
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
                  <div key={slot.id} className="flex items-center justify-between gap-4">
                    <Label className="text-left w-16 flex flex-col items-center">
                      {slot.start}
                      <br />-<br />
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
                  <div key={slot.id} className="flex items-center justify-between gap-4">
                    <Label className="text-left w-16 flex flex-col items-center">
                      {slot.start}
                      <br />-<br />
                      {slot.end}
                    </Label>
                    <label className="relative inline-flex items-center justify-center flex-grow cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.checked}
                        onChange={() => handleToggleChange(index + leftColumn.length)}
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
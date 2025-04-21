"use client";

import { useState } from "react";
import { DatePickerDemo } from "./DatePickerDemo"; // ปรับ path ตามโครงสร้างโฟลเดอร์
import { SettingButton } from "./SettingButton"; // ปรับ path ตามโครงสร้างโฟลเดอร์

export default function ParentComponent() {
  const [reservationData, setReservationData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const court = { id: 1, name: "Court 1" }; // ข้อมูลสนามตัวอย่าง (อาจดึงจาก API ได้)

  return (
    <div>
      <DatePickerDemo
        setReservationData={setReservationData}
        setShowDate={setSelectedDate} // รับวันที่จาก DatePickerDemo
      />
      <SettingButton court={court} selectedDate={selectedDate} /> {/* ส่งไปยัง SettingButton */}
    </div>
  );
}
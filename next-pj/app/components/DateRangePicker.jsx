"use client";

import * as React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePickerWithRange({ className, setDateRange }) {
  // กำหนดวันแรกของเดือนปัจจุบัน - สร้างด้วยวิธีที่ไม่มีปัญหา timezone
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  // กำหนดวันสุดท้ายของเดือนปัจจุบัน
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const [date, setDate] = React.useState({
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  });

  React.useEffect(() => {
    // ส่งค่าวันที่ไปยัง parent component เมื่อ component โหลดหรือมีการเปลี่ยนแปลง
    if (date && date.from && date.to) {
      // แก้ไขการสร้างวันที่เพื่อป้องกันปัญหา timezone
      // ใช้ setUTCHours แทน setHours เพื่อให้แน่ใจว่าวันที่ไม่เปลี่ยนเมื่อแปลงเป็น ISO string
      const fromDate = new Date(Date.UTC(
        date.from.getFullYear(),
        date.from.getMonth(),
        date.from.getDate(),
        0, 0, 0, 0
      ));
      
      const toDate = new Date(Date.UTC(
        date.to.getFullYear(),
        date.to.getMonth(),
        date.to.getDate(),
        23, 59, 59, 999
      ));
      
      console.log("DateRangePicker - ส่งค่า dateRange (เวลาไทย):", {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0]
      });
      
      // ส่งค่าวันที่ที่ปรับแล้วไปยัง parent component
      setDateRange({ from: fromDate, to: toDate });
    }
  }, [date, setDateRange]);

  // ฟังก์ชันสำหรับสร้างวันที่ที่ถูกต้องสำหรับการแสดงผล
  const formatDateForDisplay = (dateObj) => {
    if (!dateObj) return null;
    // ใช้ date-fns format โดยตรงกับวัตถุวันที่ที่มีอยู่
    // date-fns จะจัดการเรื่อง timezone ให้ถูกต้อง
    return format(dateObj, "dd LLL yyyy", { locale: th });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {formatDateForDisplay(date.from)} -{" "}
                  {formatDateForDisplay(date.to)}
                </>
              ) : (
                formatDateForDisplay(date.from)
              )
            ) : (
              <span>เลือกช่วงวันที่</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate) => {
              // เมื่อมีการเลือกวันที่ใหม่
              if (newDate && newDate.from) {
                setDate(newDate);
              }
            }}
            numberOfMonths={2}
            locale={th}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
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
  // กำหนดวันแรกของเดือนปัจจุบันตามเวลาไทย
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  // กำหนดวันสุดท้ายของเดือนปัจจุบันตามเวลาไทย
  const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  const [date, setDate] = React.useState({
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  });

  React.useEffect(() => {
    // ส่งค่าวันที่ไปยัง parent component ทันทีเมื่อ component โหลด
    if (date && date.from && date.to) {
      // แก้ไขปัญหา timezone โดยการสร้างวันที่ใหม่และตั้งเวลาให้ตรงกับเวลาไทย
      const fromDate = new Date(date.from);
      // ปรับเวลาให้เป็น 00:00:00 ตามเวลาไทย
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(date.to);
      // ปรับเวลาให้เป็น 23:59:59 ตามเวลาไทย
      toDate.setHours(23, 59, 59, 999);
      
      console.log("DateRangePicker - ส่งค่า dateRange (เวลาไทย):", {
        from: fromDate,
        to: toDate
      });
      
      // ส่งค่าวันที่ที่ปรับแล้วไปยัง parent component
      setDateRange({ from: fromDate, to: toDate });
    }
  }, [date, setDateRange]);

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
                  {format(date.from, "dd LLL yyyy", { locale: th })} -{" "}
                  {format(date.to, "dd LLL yyyy", { locale: th })}
                </>
              ) : (
                format(date.from, "dd LLL yyyy", { locale: th })
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
            onSelect={setDate}
            numberOfMonths={2}
            locale={th}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
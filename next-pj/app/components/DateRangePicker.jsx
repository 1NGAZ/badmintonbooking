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
  // กำหนดวันแรกของเดือนปัจจุบัน
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  // กำหนดวันสุดท้ายของเดือนปัจจุบัน
  const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  const [date, setDate] = React.useState({
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  });

  React.useEffect(() => {
    setDateRange(date);
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
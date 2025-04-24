"use client";

import * as React from "react";
import { format, isBefore, startOfDay, addDays } from "date-fns";
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
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
const API_URL = process.env.PUBLIC_NEXT_API_URL || "http://localhost:8000"; 

export function DatePickerDemo({ className, setReservationData, setShowDate }) {
  const [date, setDate] = useState({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  useEffect(() => {
    setShowDate(date);
    // ตรวจสอบว่า date มีค่าหรือไม่
    if (date && (date.from || date.to)) {

      const selectedDate = date.from || date.to;
      const adjustedDate = new Date(selectedDate);
      adjustedDate.setHours(12, 0, 0, 0);
      const year = selectedDate.getUTCFullYear();
      const month = String(selectedDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getUTCDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log("Selected date object:", selectedDate);
      console.log("Formatted date for API:", formattedDate);

      const fetchData = async () => {
        try {
          const response = await axios.get(
            `${API_URL}/timeslot/gettimeslots?date=${formattedDate}`
          );
          setReservationData(response.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }
  }, [date, setReservationData, setShowDate]);
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[120px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(selectedDate) => {
              if (selectedDate?.from && !selectedDate?.to) {
                const maxDate = addDays(selectedDate.from, 7);
                if (isBefore(selectedDate.from, maxDate)) {
                  setDate(selectedDate);
                  setShowDate(selectedDate);
                }
              } else {
                setDate(selectedDate);
                setShowDate(selectedDate);
              }
            }}
            numberOfMonths={1}
            disabled={(currentDate) => {
              if (isBefore(startOfDay(currentDate), startOfDay(new Date()))) {
                return true;
              }

              if (date?.from) {
                const maxDate = addDays(date.from, 7);
                if (!isBefore(currentDate, maxDate)) {
                  return true;
                }
              }

              return false;
            }}
            classNames={{
              day_selected:
                "w-full bg-black rounded-md text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-blue-500 rounded-md text-white",
              day_outside: "text-gray-500 opacity-90",
              day_disabled: "text-gray-500 opacity-90",
              day_range_middle:
                "aria-selected:bg-zinc-300 aria-selected:text-zinc-700",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

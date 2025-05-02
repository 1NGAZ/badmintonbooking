"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getUserData } from "../utils/auth"; // Import the auth utility

const Linechat = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Use the same authentication check as the rest of your app
    const checkLoginStatus = async () => {
      const userData = await getUserData();
      setIsLoggedIn(!!userData?.id); // Check if user ID exists
    };
    
    checkLoginStatus();
  }, []);

  // Force re-check login status when dialog opens
  const handleOpenChange = (newOpen) => {
    if (newOpen) {
      // Re-check login status when opening the dialog
      const checkLoginStatus = async () => {
        const userData = await getUserData();
        setIsLoggedIn(!!userData?.id);
      };
      checkLoginStatus();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-8 right-3 rounded-full bg-green-500 hover:bg-green-600 shadow-lg z-50 w-14 h-14 flex items-center justify-center"
          aria-label="Line Chat"
        >
          <Image
            src="/line-icon.jpg"
            alt="Line"
            width={50}
            height={50}
            className="object-contain"
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {isLoggedIn ? "ติดต่อเจ้าหน้าที่" : "สแกนเพื่อติดต่อสอบถาม"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          {isLoggedIn ? (
            // QR Code สำหรับผู้ใช้ที่ล็อกอินแล้ว
            <div className="flex flex-col items-center">
              <Image
                src="/line-qr-member.png"
                alt="Line QR Code for Members"
                width={200}
                height={200}
                className="object-contain"
              />
              <p className="mt-4 text-center text-sm text-gray-600">
                สแกน QR Code นี้เพื่อติดต่อเจ้าหน้าที่โดยตรง
                <br />
                บริการสำหรับสมาชิกเท่านั้น
              </p>
            </div>
          ) : (
            // QR Code สำหรับผู้ใช้ทั่วไป
            <div className="flex flex-col items-center">
              <Image
                src="/line-qr-public.png"
                alt="Line QR Code for Public"
                width={200}
                height={200}
                className="object-contain"
              />
              <p className="mt-4 text-center text-sm text-gray-600">
                สแกน QR Code นี้เพื่อสอบถามข้อมูลทั่วไป
                <br />
                หรือ <a href="/login" className="text-blue-600 hover:underline">เข้าสู่ระบบ</a> เพื่อรับบริการพิเศษ
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Linechat;
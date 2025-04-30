"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerDemo } from "../components/DatePickerDemo";
import Image from "next/image";
import Swal from "sweetalert2";
import "animate.css";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";
import SettingButton from "../components/SettingButton";
import { jwtDecode } from "jwt-decode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReservationTable() {
  // เพิ่มหลังจาก state declarations
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservationData, setReservationData] = useState([]);
  const [showDate, setShowDate] = useState();
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [maxTimeSlots, setMaxTimeSlots] = useState(3);
  const [courtShowcaseImage, setCourtShowcaseImage] =
    useState("/courtdetail.png");
  const [isChangingShowcaseImage, setIsChangingShowcaseImage] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // เพิ่ม state สำหรับ popup กฎการใช้งาน
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  // เพิ่ม state สำหรับโหมดแก้ไขกฎ
  const [isEditingRules, setIsEditingRules] = useState(false);
  // เพิ่ม state สำหรับเก็บข้อมูลกฎต่างๆ
  const [rulesData, setRulesData] = useState({
    bookingRules: [
      "สามารถจองได้สูงสุด 3 ช่วงเวลาต่อวัน",
      "ไม่สามารถจองช่วงเวลาเดียวกันในคอร์ที่ต่างกันได้",
      "ต้องชำระเงินทันทีหลังจากทำการจอง",
      "หากไม่มาใช้บริการตามเวลาที่จอง จะถูกปรับ 100% ของค่าบริการ",
    ],
    paymentRules: [
      "ชำระผ่าน QR Code ที่แสดงในระบบ",
      "แนบสลิปการโอนเงินเพื่อยืนยันการจอง",
      "การจองจะสมบูรณ์เมื่อแอดมินตรวจสอบและยืนยันการชำระเงิน",
    ],
    statusRules: [
      "สีเหลือง - รอการยืนยัน",
      "สีแดง - จองแล้ว",
      "สีเทา - ปิดให้บริการ",
    ],
  });

  // ฟังก์ชันสำหรับบันทึกการแก้ไขกฎ
  const saveRulesEdit = () => {
    localStorage.setItem("rulesData", JSON.stringify(rulesData));
    setIsEditingRules(false);
    localStorage.setItem("maxTimeSlots", maxTimeSlots.toString());
    setIsEditingRules(false);
    Swal.fire({
      title: "บันทึกกฎการใช้งานเรียบร้อย",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // ฟังก์ชันสำหรับแก้ไขกฎในหมวดหมูต่างๆ
  const handleRuleChange = (category, index, value) => {
    setRulesData((prev) => {
      const newData = { ...prev };
      newData[category][index] = value;
      return newData;
    });
  };

  // ฟังก์ชันสำหรับเพิ่มกฎใหม่
  const addNewRule = (category) => {
    setRulesData((prev) => {
      const newData = { ...prev };
      newData[category].push("");
      return newData;
    });
  };

  // ฟังก์ชันสำหรับลบกฎ
  const removeRule = (category, index) => {
    setRulesData((prev) => {
      const newData = { ...prev };
      newData[category].splice(index, 1);
      return newData;
    });
  };

  const handleSubmitReservation = async () => {
    // ตรวจสอบข้อมูลผู้ใช้
    if (!userData) {
      setIsModalOpen(true);
      return;
    }

    // ตรวจสอบวันที่
    if (!showDate || !showDate.from) {
      Swal.fire({
        title: "กรุณาเลือกวันที่",
        icon: "warning",
      });
      return;
    }

    // ตรวจสอบช่วงเวลา
    if (selectedTimeSlots.length === 0) {
      Swal.fire({
        title: "กรุณาเลือกช่วงเวลา",
        text: "กรุณาเลือกช่วงเวลาที่ต้องการจองอย่างน้อย 1 ช่วงเวลา",
        icon: "warning",
      });
      return;
    }

    // ตรวจสอบไฟล์สลิป
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาแนบสลิปการโอนเงิน",
        text: "คุณต้องแนบสลิปการโอนเงินเพื่อยืนยันการจอง",
      });
      return;
    }

    try {
      const formData = new FormData();

      // แนบไฟล์
      formData.append("attachment", selectedFile);

      // แนบข้อมูลผู้ใช้
      formData.append("userId", userData.id);

      // แปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD
      const reservationDate = `${showDate.from.getFullYear()}-${String(
        showDate.from.getMonth() + 1
      ).padStart(2, "0")}-${String(showDate.from.getDate()).padStart(2, "0")}`;
      formData.append("reservationDate", reservationDate);

      // เพิ่มข้อมูลเวลาเริ่มต้นและสิ้นสุดในแต่ละช่วงเวลาที่เลือก
      console.log("Selected time slots before mapping:", selectedTimeSlots);
      console.log("Reservation data structure:", reservationData);
      // เพิ่มข้อมูลเวลาเริ่มต้นและสิ้นสุดในแต่ละช่วงเวลาที่เลือก
      const enhancedTimeSlots = selectedTimeSlots.map((slot) => {
        console.log(`Looking for court ID: ${slot.courtId}`);
        const court = reservationData.find(
          (c) => Number(c.id) === Number(slot.courtId)
        );
        console.log(`Court found:`, court);
        console.log(
          `Looking for timeSlot ID: ${slot.timeSlotId} in court:`,
          court?.name
        );
        const timeSlot = court?.timeSlots?.find(
          (ts) => Number(ts.id) === Number(slot.timeSlotId)
        );
        console.log(`TimeSlot found:`, timeSlot);
        // ตรวจสอบโครงสร้างของ timeSlot
        if (timeSlot) {
          console.log("TimeSlot properties:", Object.keys(timeSlot));
        }
        return {
          timeSlotId: slot.timeSlotId,
          courtId: slot.courtId,
          startTime: timeSlot?.start_time || null,
          endTime: timeSlot?.end_time || null,
        };
      });

      console.log("ช่วงเวลาที่เลือกพร้อมข้อมูลเวลา:", enhancedTimeSlots);
      formData.append("selectedTimeSlots", JSON.stringify(enhancedTimeSlots));

      // แนบ courtId (ใช้จากช่วงเวลาที่เลือก)
      formData.append("courtId", selectedTimeSlots[0].courtId);

      // แนบสถานะ (2 = รอดำเนินการ)
      formData.append("statusId", "2");

      // คำนวณราคาก่อนส่วนลด
      const originalPrice = calculateTotalPrice();
      formData.append("originalPrice", originalPrice);

      // แนบข้อมูลโปรโมชั่น - ปรับปรุงการตรวจสอบและส่งข้อมูล
      if (appliedPromotion) {
        // ตรวจสอบว่า appliedPromotion.id มีค่าและเป็นตัวเลขหรือไม่
        const promotionId = parseInt(appliedPromotion.id, 10);

        if (!isNaN(promotionId) && promotionId > 0) {
          console.log("ส่งข้อมูล promotionId:", promotionId);
          formData.append("promotionId", promotionId);

          // ส่งข้อมูลเพิ่มเติมเกี่ยวกับโปรโมชั่น
          if (appliedPromotion.code) {
            formData.append("promotionCode", appliedPromotion.code);
          }

          if (appliedPromotion.discount) {
            formData.append("discountPercent", appliedPromotion.discount);
          }

          // คำนวณราคาหลังหักส่วนลด
          const originalPrice = calculateTotalPrice(false); // เพิ่มพารามิเตอร์เพื่อคำนวณราคาก่อนส่วนลด
          const discountAmount =
            (originalPrice * Number(appliedPromotion.discount)) / 100;
          const finalPrice = Math.max(0, originalPrice - discountAmount);

          formData.append("originalPrice", originalPrice);
          formData.append("finalPrice", finalPrice);

          console.log("ข้อมูลโปรโมชั่นที่ส่งไป backend:", {
            id: promotionId,
            code: appliedPromotion.code,
            discount: appliedPromotion.discount,
            originalPrice: originalPrice,
            finalPrice: finalPrice,
          });
        } else {
          console.warn("ข้อมูล promotionId ไม่ถูกต้อง:", appliedPromotion.id);
          // ไม่ส่งข้อมูลโปรโมชั่นถ้า ID ไม่ถูกต้อง
        }
      } else {
        console.log("ไม่มีการใช้โปรโมชั่น");
        formData.append("originalPrice", calculateTotalPrice(false));
        formData.append("finalPrice", calculateTotalPrice(false));
      }

      console.log("ส่งข้อมูลการจอง:", {
        userId: userData.id,
        date: reservationDate,
        selectedTimeSlots: enhancedTimeSlots,
        courtId: selectedTimeSlots[0].courtId,
        promotionId: appliedPromotion?.id || null,
        promotionCode: appliedPromotion?.code || null,
        discountPercent: appliedPromotion?.discount || 0,
        originalPrice: originalPrice,
        finalPrice: appliedPromotion ? calculateTotalPrice() : originalPrice,
        statusId: 2,
      });

      // ส่งข้อมูลไปยัง API
      const response = await axios.post(
        `${API_URL}/reservation/reservations`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      // ถ้าสำเร็จ
      if (response.status >= 200 && response.status < 300) {
        setOpen(false);
        setSelectedTimeSlots([]);
        setSelectedFile(null);
        setPromotionCode("");
        setAppliedPromotion(null);

        Swal.fire({
          title: "จองสนามสำเร็จ",
          text: "กรุณารอการยืนยันจากแอดมิน",
          icon: "success",
        }).then(() => {
          // รีเฟรชหน้าเมื่อกดปุ่ม OK หรือปิด Swal
          window.location.reload();
        });

        // โหลดข้อมูลใหม่
        const adjustedDate = new Date(showDate.from);
        adjustedDate.setHours(12, 0, 0, 0);
        const formattedDate = `${adjustedDate.getFullYear()}-${String(
          adjustedDate.getMonth() + 1
        ).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`;

        const reservationResponse = await axios.get(
          `${API_URL}/timeslot/gettimeslots?date=${formattedDate}`,
          { withCredentials: true }
        );
        setReservationData(reservationResponse.data);
      }
    } catch (error) {
      let errorMessage = "ไม่สามารถทำการจองได้ กรุณาลองใหม่อีกครั้ง";

      if (error?.response?.data) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          errorMessage;
      }

      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: errorMessage,
        icon: "error",
      });
    }
  };

  const normalizeTime = (timeStr) => {
    if (!timeStr) return null;
    return timeStr.trim().slice(0, 5); // เหลือแค่ HH:MM
  };

  const getStartTimeBySlot = (courtId, timeSlotId) => {
    const court = reservationData.find((c) => Number(c.id) === Number(courtId));
    const slot = court?.timeSlots?.find(
      (ts) => Number(ts.id) === Number(timeSlotId)
    );
    return slot?.startTime || null;
  };

  const handleCheckboxChange = (timeSlotId, courtId) => {
    console.log("Checkbox clicked:", { timeSlotId, courtId });

    timeSlotId = Number(timeSlotId);
    courtId = Number(courtId);

    // Find the court and slot objects
    const court = reservationData.find((c) => Number(c.id) === courtId);
    const slot = court?.timeSlots?.find((ts) => Number(ts.id) === timeSlotId);

    // Log the slot object details
    console.log("Selected slot object:", slot);

    const timeSlotStartTime = getStartTimeBySlot(courtId, timeSlotId);
    const normalizedCurrentStartTime = normalizeTime(timeSlotStartTime);

    console.log("Normalized start time:", normalizedCurrentStartTime);

    const isSelected = selectedTimeSlots.some(
      (slot) =>
        Number(slot.timeSlotId) === timeSlotId &&
        Number(slot.courtId) === courtId
    );

    if (isSelected) {
      const newSelectedTimeSlots = selectedTimeSlots.filter(
        (slot) =>
          !(
            Number(slot.timeSlotId) === timeSlotId &&
            Number(slot.courtId) === courtId
          )
      );
      console.log("After removal:", newSelectedTimeSlots);
      setSelectedTimeSlots(newSelectedTimeSlots);
    } else {
      if (selectedTimeSlots.length >= maxTimeSlots) {
        Swal.fire({
          title: "ไม่สามารถเลือกได้",
          text: `คุณสามารถเลือกได้สูงสุด ${maxTimeSlots} ช่วงเวลาต่อวัน`,
          icon: "warning",
        });
        return;
      }

      // ตรวจสอบว่าเลือกช่วงเวลาเดียวกันในคอร์ทอื่นหรือไม่
      const hasSameTimeSlotInOtherCourt = selectedTimeSlots.some((slot) => {
        const existingTime = normalizeTime(
          getStartTimeBySlot(slot.courtId, slot.timeSlotId)
        );
        return (
          existingTime === normalizedCurrentStartTime &&
          Number(slot.courtId) !== courtId
        );
      });

      if (hasSameTimeSlotInOtherCourt) {
        Swal.fire({
          title: "ไม่สามารถเลือกได้",
          text: "ไม่สามารถจองช่วงเวลาเดียวกันในคอร์ทที่ต่างกันได้",
          icon: "warning",
        });
        return;
      }

      const newSelectedTimeSlots = [
        ...selectedTimeSlots,
        { timeSlotId, courtId },
      ];
      console.log("After addition:", newSelectedTimeSlots);
      setSelectedTimeSlots(newSelectedTimeSlots);
    }
  };

  useEffect(() => {
    console.log("showDate changed:", showDate);

    // แสดง popup กฎการใช้งานเมื่อโหลดหน้าเว็บเสร็จ
    setShowRulesPopup(true);

    // โหลดข้อมูลกฎจาก localStorage (ถ้ามี)
    const savedRules = localStorage.getItem("rulesData");
    if (savedRules) {
      setRulesData(JSON.parse(savedRules));
    }

    // เพิ่มการตรวจสอบว่า showDate มีค่าและมีวันที่ที่เลือกหรือไม่
    if (showDate && showDate.from) {
      console.log("เลือกวันที่ถูกต้อง:", showDate.from.toISOString());
      // ดึงข้อมูลการจองตามวันที่ที่เลือก
      const fetchReservationData = async () => {
        try {
          // สร้างวันที่ที่ปรับแล้วเพื่อหลีกเลี่ยงปัญหา timezone
          const adjustedDate = new Date(showDate.from);
          adjustedDate.setHours(12, 0, 0, 0);

          const year = adjustedDate.getFullYear();
          const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
          const day = String(adjustedDate.getDate()).padStart(2, "0");
          const formattedDate = `${year}-${month}-${day}`;

          console.log("ดึงข้อมูลด้วยวันที่ที่จัดรูปแบบแล้ว:", formattedDate);

          const response = await axios.get(
            `${API_URL}/timeslot/gettimeslots?date=${formattedDate}`,
            { withCredentials: true }
          );
          // setReservationData(response.data);

          //เรียงลำดับข้อมูลสนามโดยใช้ทั้งตัวเลขในชื่อและ ID
          // ดึงตัวเลขจากชื่อสนาม (เช่น "สนามแบดมินตัน 1" จะได้ 1)
          const sortedData = await [...response.data]
            .sort((a, b) => {
              const getCourtNumber = (name) => {
                const match = name.match(/\d+/);
                return match ? parseInt(match[0]) : -1;
              };

              const numA = getCourtNumber(a.name);
              const numB = getCourtNumber(b.name);
              console.log(numA);
              console.log(numB);

              // ถ้าทั้งคู่มีตัวเลขในชื่อ ให้เรียงตามตัวเลข
              if (numA >= 0 && numB >= 0) {
                return numA - numB;
              }
              // ถ้าอันใดอันหนึ่งไม่มีตัวเลข ให้เรียงตาม ID
              else {
                return Number(a.id) - Number(b.id);
              }
            })
            .map((court) => ({
              ...court,
              timeSlots: [...(court.timeSlots || [])].sort(
                (a, b) => Number(a.id) - Number(b.id)
              ),
            }));
          console.log("ข้อมูลสนามหลังเรียงลำดับ:", sortedData);

          setReservationData(sortedData);
        } catch (error) {
          console.error("เกิดข้อผิดพลาดในการดึงข้อมูลการจอง:", error);
        }
      };
      fetchReservationData();
    }
  }, [showDate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (typeof window === "undefined") return;

        const token = window.sessionStorage.getItem("authToken");
        if (!token) {
          setUserData(null);
          return;
        }
        const savedMaxTimeSlots = localStorage.getItem("maxTimeSlots");
        if (savedMaxTimeSlots) {
          setMaxTimeSlots(Number(savedMaxTimeSlots));
        }

        try {
          const decoded = jwtDecode(token);
          if (!decoded?.userId) {
            window.sessionStorage.removeItem("authToken");
            setUserData(null);
            return;
          }

          setUserData({
            id: decoded.userId,
            roleId: decoded.roleId || 1,
          });
        } catch (decodeError) {
          console.error("Token decode error:", decodeError.message);
          window.sessionStorage.removeItem("authToken");
          setUserData(null);
        }
      } catch (error) {
        console.error("User data fetch error:", error.message);
        window.sessionStorage.removeItem("authToken");
        setUserData(null);
      }
    };
    fetchUserData();

    const handleStorageChange = () => {
      fetchUserData();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  useEffect(() => {
    const savedImage = localStorage.getItem("courtShowcaseImage");
    if (savedImage) {
      setCourtShowcaseImage(savedImage);
    }
  }, []);

  // Add this function to handle showcase image change
  const handleShowcaseImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(`${API_URL}/upload-image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
      });

      const imageUrl = URL.createObjectURL(file);

      setCourtShowcaseImage(imageUrl);
      localStorage.setItem("courtShowcaseImage", imageUrl);

      Swal.fire({
        title: "อัพเดทรูปภาพสำเร็จ",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      setIsChangingShowcaseImage(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอัพโหลดรูปภาพได้",
        icon: "error",
      });
    }
  };

  const handleOpenDrawer = () => {
    if (!userData) {
      setIsModalOpen(true);
      return;
    }

    // ตรวจสอบว่ามีการเลือก TimeSlot หรือไม่
    if (selectedTimeSlots.length === 0) {
      Swal.fire({
        title: "กรุณาเลือกช่วงเวลา",
        text: "กรุณาเลือกช่วงเวลาที่ต้องการจองอย่างน้อย 1 ช่วงเวลา",
        icon: "warning",
        showClass: {
          popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
          `,
        },
        hideClass: {
          popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
          `,
        },
      });
      return;
    }

    setOpen(true);
  };

  // เพิ่ม state สำหรับ Dialog และชื่อสนาม
  const [isAddCourtOpen, setIsAddCourtOpen] = useState(false);
  const [newCourtName, setNewCourtName] = useState("");
  const [courtPrice, setCourtPrice] = useState("");
  const [courtDetail, setCourtDetail] = useState("");
  // เพิ่มฟังก์ชันสำหรับจัดการการเพิ่มสนาม
  const handleAddCourt = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/courts`,
        {
          name: newCourtName,
          price: courtPrice,
          detail: courtDetail,
          status: "active",
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        setNewCourtName("");
        setCourtPrice("");
        setCourtDetail("");
        setIsAddCourtOpen(false);

        // เปลี่ยนจาก alert เป็น Swal.fire
        Swal.fire({
          title: "เพิ่มสนามสำเร็จ",
          icon: "success",
          draggable: true,
          showClass: {
            popup: `
              animate__animated
              animate__fadeInUp
              animate__faster
            `,
          },
          hideClass: {
            popup: `
              animate__animated
              animate__fadeOutDown
              animate__faster
            `,
          },
        });
      }
    } catch (error) {
      console.error("Error adding court:", error);

      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเพิ่มสนามได้",
        icon: "error",
        draggable: true,
      });
    }
  };

  const handleDeleteCourt = async (courtId) => {
    try {
      const response = await axios.delete(`${API_URL}/courts/${courtId}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        setReservationData((prevData) =>
          prevData.filter((court) => court.id !== courtId)
        );

        Swal.fire({
          title: "ลบสนามสำเร็จ",
          icon: "success",
          draggable: true,
          showClass: {
            popup: `
              animate__animated
              animate__fadeInUp
              animate__faster
            `,
          },
          hideClass: {
            popup: `
              animate__animated
              animate__fadeOutDown
              animate__faster
            `,
          },
        });
      }
    } catch (error) {
      console.error("Error deleting court:", error);

      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถลบสนามได้",
        icon: "error",
        draggable: true,
      });
    }
  };

  const redirectToLogin = () => {
    window.location.href = "/login";
  };
  //role id =1 (แอดมิน)
  const isAdmin = userData?.roleId === 1 && !!userData?.id;
  const isLoggedIn = !!userData?.id;

  const calculateTotalPrice = (applyDiscount = true) => {
    let totalPrice = 0;

    selectedTimeSlots.forEach((slot) => {
      const court = reservationData.find(
        (c) => Number(c.id) === Number(slot.courtId)
      );

      // Ensure price is a valid number
      if (court?.price != null) {
        const price = Number(court.price);
        if (!isNaN(price)) {
          totalPrice += price;
        }
      }
    });

    console.log("Before discount:", totalPrice);

    // ถ้าต้องการคำนวณราคาหลังส่วนลด และมีโปรโมชั่นที่ใช้งานได้
    if (
      applyDiscount &&
      appliedPromotion &&
      appliedPromotion.discount != null
    ) {
      const discountAmount = Number(appliedPromotion.discount);
      if (!isNaN(discountAmount)) {
        const discount = (totalPrice * discountAmount) / 100;
        totalPrice = Math.max(0, totalPrice - discount); // Prevent negative prices
      }
    }

    return isNaN(totalPrice) ? "0" : totalPrice.toLocaleString();
  };

  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);

  const validatePromotionCode = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/promotions/validate/${promotionCode}`
      );

      console.log("Promotion response:", response.data);

      // ตรวจสอบข้อมูลโปรโมชั่น
      const promotion = response.data?.promotion || response.data;

      // ตรวจสอบว่าโปรโมชั่นมี id และเป็นตัวเลขที่ถูกต้อง
      if (!promotion.id || isNaN(parseInt(promotion.id, 10))) {
        throw new Error("ข้อมูลโปรโมชั่นไม่ถูกต้อง (ID ไม่ถูกต้อง)");
      }

      // ตรวจสอบว่าโปรโมชั่นยังใช้งานได้หรือไม่ (ไม่เกินจำนวนครั้งที่กำหนด)
      if (
        promotion &&
        promotion.maxUses > 0 &&
        promotion.usedCount >= promotion.maxUses
      ) {
        throw new Error("โปรโมชั่นนี้ถูกใช้งานครบตามจำนวนที่กำหนดแล้ว");
      }

      // ตรวจสอบว่า discount เป็นตัวเลขที่ถูกต้อง
      if (
        promotion &&
        promotion.discount != null &&
        !isNaN(Number(promotion.discount))
      ) {
        // เก็บข้อมูลโปรโมชั่นทั้งหมดที่จำเป็น
        setAppliedPromotion({
          id: promotion.id,
          code: promotion.code,
          discount: promotion.discount,
          maxUses: promotion.maxUses,
          usedCount: promotion.usedCount,
          title: promotion.title || "",
          description: promotion.description || "",
        });

        // คำนวณราคาใหม่หลังใช้โค้ดส่วนลด
        const originalPrice = calculateTotalPrice(false); // ราคาก่อนส่วนลด
        const discountAmount =
          (originalPrice * Number(promotion.discount)) / 100;
        const finalPrice = Math.max(0, originalPrice - discountAmount);

        console.log("โปรโมชั่นที่ใช้:", {
          id: promotion.id,
          code: promotion.code,
          discount: promotion.discount,
          maxUses: promotion.maxUses,
          usedCount: promotion.usedCount,
          remaining:
            promotion.maxUses > 0
              ? promotion.maxUses - promotion.usedCount
              : "ไม่จำกัด",
          originalPrice: originalPrice,
          discountAmount: discountAmount,
          finalPrice: finalPrice,
        });

        Swal.fire({
          icon: "success",
          title: "ใช้โค้ดสำเร็จ",
          text: `ส่วนลด ${promotion.discount}% (เหลือ ${
            promotion.maxUses > 0
              ? promotion.maxUses - promotion.usedCount
              : "ไม่จำกัด"
          } ครั้ง)`,
        });
      } else {
        throw new Error("ข้อมูลส่วนลดไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("Failed to apply promotion:", error);
      setAppliedPromotion(null);
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถใช้โค้ดได้",
        text:
          error.response?.data?.error ||
          error.message ||
          "รหัสโปรโมชั่นไม่ถูกต้องหรือหมดอายุ",
      });
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center">
      <Navbar />

      {/* Rules Popup */}
      {showRulesPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl overflow-hidden max-w-lg w-full relative mx-auto my-8">
            {/* ปุ่มปิด */}
            <button
              onClick={() => setShowRulesPopup(false)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition-colors z-10"
            >
              ✕
            </button>

            {/* ปุ่มแก้ไขสำหรับแอดมิน */}
            {isAdmin && !isEditingRules && (
              <button
                onClick={() => setIsEditingRules(true)}
                className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 transition-colors z-10"
                title="แก้ไขกฎการใช้งาน"
              >
                ✎
              </button>
            )}

            {/* หัวข้อและรายละเอียด */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[80vh]">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center">
                กฎการใช้งานและการจองสนาม
              </h3>

              {!isEditingRules ? (
                // โหมดแสดงกฎ
                <div className="space-y-3 text-gray-700 mb-6">
                  <p className="font-semibold text-lg text-red-600">
                    จำนวนช่วงเวลาสูงสุดที่จองได้:
                  </p>
                  <p className="pl-4">{maxTimeSlots} ช่วงเวลาต่อวัน</p>

                  <p className="font-semibold text-lg text-red-600">
                    กฎการจองสนาม:
                  </p>
                  <div className="pl-4 space-y-2">
                    {rulesData.bookingRules.map((rule, index) => (
                      <p key={`booking-${index}`}>
                        {index + 1}. {rule}
                      </p>
                    ))}
                  </div>

                  <p className="font-semibold text-lg text-red-600">
                    การชำระเงิน:
                  </p>
                  <div className="pl-4 space-y-2">
                    {rulesData.paymentRules.map((rule, index) => (
                      <p key={`payment-${index}`}>
                        {index + 1}. {rule}
                      </p>
                    ))}
                  </div>

                  <p className="font-semibold text-lg text-red-600">
                    สถานะการจอง:
                  </p>
                  <div className="pl-4 space-y-2">
                    {rulesData.statusRules.map((rule, index) => (
                      <p key={`status-${index}`}>
                        <span
                          className={`inline-block w-4 h-4 ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-red-500"
                              : "bg-gray-500"
                          } mr-2`}
                        ></span>
                        {rule}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                // โหมดแก้ไขกฎ
                <div className="space-y-4 text-gray-700 mb-6">
                  {/* เพิ่มส่วนนี้เป็นส่วนแรกในโหมดแก้ไข */}
                  <div className="mb-4">
                    <p className="font-semibold text-lg text-red-600">
                      จำนวนช่วงเวลาสูงสุดที่จองได้:
                    </p>
                    <div className="pl-4 mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={maxTimeSlots}
                        onChange={(e) =>
                          setMaxTimeSlots(Number(e.target.value))
                        }
                        className="border border-gray-300 rounded px-2 py-1 w-20"
                      />
                      <span className="text-gray-600">ช่วงเวลาต่อวัน</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-lg text-red-600">
                      กฎการจองสนาม:
                    </p>
                    <div className="pl-4 space-y-2 mt-2">
                      {rulesData.bookingRules.map((rule, index) => (
                        <div
                          key={`booking-edit-${index}`}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={rule}
                            onChange={(e) =>
                              handleRuleChange(
                                "bookingRules",
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 border border-gray-300 rounded px-2 py-1"
                          />
                          <button
                            onClick={() => removeRule("bookingRules", index)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addNewRule("bookingRules")}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        + เพิ่มกฎใหม่
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-lg text-red-600">
                      การชำระเงิน:
                    </p>
                    <div className="pl-4 space-y-2 mt-2">
                      {rulesData.paymentRules.map((rule, index) => (
                        <div
                          key={`payment-edit-${index}`}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={rule}
                            onChange={(e) =>
                              handleRuleChange(
                                "paymentRules",
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 border border-gray-300 rounded px-2 py-1"
                          />
                          <button
                            onClick={() => removeRule("paymentRules", index)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addNewRule("paymentRules")}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        + เพิ่มกฎใหม่
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-lg text-red-600">
                      สถานะการจอง:
                    </p>
                    <div className="pl-4 space-y-2 mt-2">
                      {rulesData.statusRules.map((rule, index) => (
                        <div
                          key={`status-edit-${index}`}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={`inline-block w-4 h-4 ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-red-500"
                                : "bg-gray-500"
                            } mr-2`}
                          ></span>
                          <input
                            type="text"
                            value={rule}
                            onChange={(e) =>
                              handleRuleChange(
                                "statusRules",
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 border border-gray-300 rounded px-2 py-1"
                          />
                          <button
                            onClick={() => removeRule("statusRules", index)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addNewRule("statusRules")}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        + เพิ่มกฎใหม่
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                {isEditingRules ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditingRules(false)}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={saveRulesEdit}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      บันทึก
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRulesPopup(false)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    เข้าใจแล้ว
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto mt-20 w-full">
        <table className="min-w-full border border-gray-300 text-center text-sm">
          <caption className="text-xl font-semibold mb-6 my-6">
            ตารางจองแบดมินตัน{" "}
            <span>
              {(showDate?.from || new Date()).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </caption>
          <thead>
            <tr>
              <th className="sticky left-0 bg-white border border-gray-300 py-2 px-2">
                <DatePickerDemo
                  setReservationData={setReservationData}
                  setShowDate={setShowDate}
                />
              </th>
              <th className="border border-gray-300 py-2 px-4">
                15:00
                <br />-<br />
                16:00
              </th>
              <th className="border border-gray-300 py-2 px-4">
                16:00
                <br />-<br />
                17:00
              </th>
              <th className="border border-gray-300 py-2 px-4">
                17:00
                <br />-<br />
                18:00
              </th>
              <th className="border border-gray-300 py-2 px-4">
                18:00
                <br />-<br />
                19:00
              </th>
              <th className="border border-gray-300 py-2 px-4">
                19:00
                <br />-<br />
                20:00
              </th>
              <th className="border border-gray-300 py-2 px-4">
                20:00
                <br />-<br />
                21:00
              </th>
              <th className="border border-gray-300 py-2 px-4">
                21:00
                <br />-<br />
                22:00
              </th>
              <th className="border border-gray-300 py-2 px-4">
                22:00
                <br />-<br />
                23:00
              </th>
            </tr>
          </thead>
          <tbody>
            {reservationData.map((court, rowIndex) => (
              <tr key={court.id}>
                <td className="flex items-center justify-around sticky left-0 bg-white border border-gray-300 py-2 px-4">
                  <span className="font-medium">{court.name}</span>
                  {isLoggedIn && isAdmin && (
                    <div className="flex gap-2 items-center">
                      <SettingButton court={court} selectedDate={showDate} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="group relative flex h-7 w-7 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-red-800 bg-red-400 hover:bg-red-600">
                            <svg
                              viewBox="0 0 1.625 1.625"
                              className="absolute -top-7 fill-white delay-100 group-hover:top-2 group-hover:animate-[spin_1.4s] group-hover:duration-1000"
                              height={12}
                              width={12}
                            >
                              <path d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195" />
                              <path d="M1.219.601h-.163A.1.1 0 0 1 .959.504V.341A.033.033 0 0 0 .926.309h-.26a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099v-.39a.033.033 0 0 0-.032-.033" />
                              <path d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016" />
                            </svg>
                            <svg
                              width={16}
                              fill="none"
                              viewBox="0 0 39 7"
                              className="origin-right duration-500 group-hover:rotate-90"
                            >
                              <line
                                strokeWidth={4}
                                stroke="white"
                                y2={5}
                                x2={39}
                                y1={5}
                              />
                              <line
                                strokeWidth={4}
                                stroke="white"
                                y2="1.5"
                                x2="26.0357"
                                y1="1.5"
                                x1={12}
                              />
                            </svg>
                            <svg
                              width={12}
                              fill="none"
                              viewBox="0 0 33 39"
                              className=""
                            >
                              <mask fill="white" id="path-1-inside-1_8_19">
                                <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
                              </mask>
                              <path
                                mask="url(#path-1-inside-1_8_19)"
                                fill="white"
                                d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                              />
                              <path
                                strokeWidth={4}
                                stroke="white"
                                d="M12 6L12 29"
                              />
                              <path
                                strokeWidth={4}
                                stroke="white"
                                d="M21 6V29"
                              />
                            </svg>
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการลบสนาม</AlertDialogTitle>
                            <AlertDialogDescription>
                              คุณแน่ใจหรือไม่ที่จะลบสนาม{" "}
                              <span className="font-bold text-black">
                                {court.name}{" "}
                              </span>
                              การดำเนินการนี้ไม่สามารถยกเลิกได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCourt(court.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              ลบสนาม
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </td>
                {court.timeSlots.map((slot, cellIndex) => (
                  <td
                    key={slot.id}
                    className={`border border-gray-300 py-2 px-4 ${
                      slot.statusId === 2
                        ? "bg-yellow-500 text-white"
                        : slot.statusId === 5
                        ? "bg-red-500 text-white"
                        : slot.statusId === 1
                        ? "bg-gray-500 text-white"
                        : "bg-white"
                    }`}
                  >
                    {slot.statusId !== 2 &&
                    slot.statusId !== 5 &&
                    slot.statusId !== 1 ? (
                      <Checkbox
                        id={`checkbox-${slot.id}`}
                        checked={selectedTimeSlots.some(
                          (selected) =>
                            selected.timeSlotId === slot.id &&
                            selected.courtId === court.id
                        )}
                        onCheckedChange={() =>
                          handleCheckboxChange(slot.id, court.id)
                        }
                        disabled={
                          slot.statusId === 2 ||
                          slot.statusId === 5 ||
                          slot.statusId === 1
                        }
                      />
                    ) : slot.statusId === 2 ? (
                      "Pending"
                    ) : slot.statusId === 1 ? (
                      "Close"
                    ) : // ✅ แสดงชื่อผู้จองอย่างถูกต้อง
                    slot.reservations &&
                      slot.reservations.length > 0 &&
                      slot.reservations[0]?.user?.fname ? (
                      slot.reservations[0].user.fname
                    ) : (
                      "Reserved"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <div className="flex flex-wrap gap-4 items-center justify-center mt-4">
          {isLoggedIn && isAdmin && (
            <AlertDialog open={isAddCourtOpen} onOpenChange={setIsAddCourtOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={() => setIsAddCourtOpen(true)}
                  className="bg-green-500 text-white"
                >
                  เพิ่มสนาม
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>เพิ่มสนามใหม่</AlertDialogTitle>
                  <AlertDialogDescription>
                    กรุณากรอกชื่อสนามที่ต้องการเพิ่ม
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-4">
                  <input
                    type="text"
                    value={newCourtName}
                    onChange={(e) => setNewCourtName(e.target.value)}
                    placeholder="ชื่อสนาม"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    value={courtPrice}
                    onChange={(e) => setCourtPrice(e.target.value)}
                    placeholder="ราคา"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <textarea
                    value={courtDetail}
                    onChange={(e) => setCourtDetail(e.target.value)}
                    placeholder="รายละเอียดสนาม"
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setNewCourtName("")}>
                    ยกเลิก
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAddCourt}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    เพิ่มสนาม
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenDrawer}
              className={`${
                selectedTimeSlots.length === 0 ? "bg-gray-400" : "bg-red-500"
              } text-white`}
            >
              จองสนาม{" "}
              {selectedTimeSlots.length > 0
                ? `(${
                    selectedTimeSlots.length
                  } ชั่วโมง - ${calculateTotalPrice()} บาท)`
                : ""}
            </Button>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="รหัสโปรโมชั่น"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 w-28"
              />
              <Button
                onClick={validatePromotionCode}
                disabled={!promotionCode}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-2 py-1"
              >
                ใช้โค้ด
              </Button>
            </div>
          </div>
        </div>
        {userData ? (
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-center">ชำระเงิน</DrawerTitle>
              <DrawerDescription className="text-center">
                เมื่อชำระเงินเสร็จแล้วกรุณาแนปสลิปการโอนเงิน
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex mt-2 justify-center">
              <div>
                <Image
                  src="/Qr.png"
                  alt="QR Code สำหรับชำระเงิน"
                  width={300}
                  height={200}
                  className="rounded-lg"
                />
              </div>
            </div>
            <DrawerFooter>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                <Button
                  onClick={handleSubmitReservation}
                  disabled={!selectedFile}
                  className={!selectedFile ? "bg-gray-400 w-full" : ""}
                >
                  ยืนยันการชำระเงิน
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    ยกเลิก
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        ) : null}
      </Drawer>

      <div
        id="court-showcase"
        className="mt-8 mb-12 flex flex-col items-center w-full"
      >
        <div className="relative">
          <img
            src={courtShowcaseImage}
            alt="Court Details"
            className="rounded-lg shadow-lg max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] hover:shadow-xl transition-shadow duration-300"
          />

          {isAdmin && (
            <button
              onClick={() =>
                setIsChangingShowcaseImage(!isChangingShowcaseImage)
              }
              className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 transition-colors"
              title="เปลี่ยนรูปภาพ"
            >
              ✎
            </button>
          )}
        </div>

        {isAdmin && isChangingShowcaseImage && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%]">
            <h3 className="text-lg font-semibold mb-2">เปลี่ยนรูปภาพสนาม</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleShowcaseImageChange}
              className="w-full mb-2"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsChangingShowcaseImage(false)}
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Modal แจ้งเตือน */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-1/3">
            <h2 className="text-lg font-bold text-red-600 text-center">
              กรุณาเข้าสู่ระบบ
            </h2>
            <p className="text-center mt-4">
              คุณต้องเข้าสู่ระบบก่อนทำการจองสนาม
            </p>
            <div className="flex justify-center mt-6 space-x-4">
              <button
                onClick={redirectToLogin}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                ไปยังหน้าล็อกอิน
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

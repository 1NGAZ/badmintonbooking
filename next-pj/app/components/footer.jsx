"use client";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">เกี่ยวกับเรา</h3>
          <p className="text-gray-300">
            ให้บริการสนามแบดมินตันคุณภาพ พร้อมสิ่งอำนวยความสะดวกครบครัน
            เพื่อประสบการณ์การเล่นที่ดีที่สุด
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">ติดต่อเรา</h3>
          <p className="text-gray-300 mb-2">โทร: 02-123-4567</p>
          <p className="text-gray-300 mb-2">อีเมล: info@badminton.com</p>
          <p className="text-gray-300">
            ที่อยู่: 123 ถนนกีฬา เขตบางกะปิ กรุงเทพฯ
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">เวลาทำการ</h3>
          <p className="text-gray-300 mb-2">จันทร์ - ศุกร์: 08:00 - 22:00</p>
          <p className="text-gray-300 mb-2">เสาร์ - อาทิตย์: 08:00 - 23:00</p>
          <p className="text-gray-300">วันหยุดนักขัตฤกษ์: 09:00 - 22:00</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
        <p>© 2023 สนามแบดมินตัน. สงวนลิขสิทธิ์ทั้งหมด.</p>
      </div>
    </footer>
  );
};

export default Footer;
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentSales({ transactions }) {
  // ฟังก์ชั่นช่วยจัดรูปแบบเงิน
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // ฟังก์ชั่นช่วยจัดรูปแบบวันที่และเวลา
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    // สร้าง Date object และใช้ UTC เพื่อให้ตรงกับข้อมูลในฐานข้อมูล
    const date = new Date(dateTimeString);
    const thaiYear = date.getUTCFullYear() ; 
    return `${date.getUTCDate()} ${getThaiMonth(date.getUTCMonth())} ${thaiYear}`;
  };

  // ฟังก์ชั่นช่วยแปลงเดือนเป็นภาษาไทย
  const getThaiMonth = (month) => {
    const thaiMonths = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", 
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    return thaiMonths[month];
  };

  // ฟังก์ชั่นสร้างตัวอักษรย่อจากชื่อ
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  return (
    <div className="space-y-8">
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">ไม่มีรายการล่าสุด</p>
        </div>
      ) : (
        transactions.map((transaction, index) => (
          <div key={index} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={transaction.user?.avatar} alt={transaction.user?.fname} />
              <AvatarFallback className={transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {getInitials(transaction.user?.fname)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">
                {transaction.user?.fname ? `${transaction.user.fname} ${transaction.user.lname || ""}` : "ผู้ใช้ไม่ระบุชื่อ"}
              </p>
              <p className="text-sm text-muted-foreground">
                {transaction.description || "การจองสนาม"}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(transaction.createdAt)}
              </p>
            </div>
            <div className={`ml-auto font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

export function Overview({ chartData }) {
  // สร้างข้อมูลสำหรับกราฟ
  const data = chartData.dates.map((date, index) => ({
    name: date,
    รายรับ: chartData.income[index],
    รายจ่าย: chartData.expense[index],
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `฿${value.toLocaleString()}`}
        />
        <Tooltip 
          formatter={(value) => [`฿${value.toLocaleString()}`, undefined]}
          labelFormatter={(label) => `วันที่: ${label}`}
        />
        <Legend />
        <Bar dataKey="รายรับ" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="รายจ่าย" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
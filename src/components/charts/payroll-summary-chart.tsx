"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", gross: 12200000, net: 9300000 },
  { month: "Feb", gross: 12800000, net: 9700000 },
  { month: "Mar", gross: 13100000, net: 9900000 },
  { month: "Apr", gross: 13700000, net: 10300000 },
];

export function PayrollSummaryChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer minHeight={1} minWidth={1}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${Number(value) / 1000000}m`} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString("en-TZ")} TZS`} />
          <Bar dataKey="gross" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="net" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PayrollSummaryChart;

"use client";

import dynamic from "next/dynamic";

export const PayrollSummaryChartClient = dynamic(
  () => import("@/components/charts/payroll-summary-chart").then((module) => module.PayrollSummaryChart),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full rounded-md border bg-muted/30" />,
  },
);

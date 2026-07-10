"use client";

import { DashboardHorizontalBarChart } from "@/components/dashboard/DashboardHorizontalBarChart";
import type { DashboardBarItem } from "@/lib/actions/dashboard";

interface DashboardBairroChartProps {
  title: string;
  items: DashboardBarItem[];
  emptyMessage?: string;
}

export function DashboardBairroChart({
  title,
  items,
  emptyMessage,
}: DashboardBairroChartProps) {
  return (
    <DashboardHorizontalBarChart
      title={title}
      items={items}
      emptyMessage={emptyMessage}
    />
  );
}

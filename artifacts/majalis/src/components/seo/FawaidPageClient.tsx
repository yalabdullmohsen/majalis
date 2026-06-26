"use client";

import FawaidPage from "@/views/FawaidPage";

export default function FawaidPageClient({
  initialFawaid,
}: {
  initialFawaid: any[];
}) {
  return <FawaidPage initialFawaid={initialFawaid} />;
}

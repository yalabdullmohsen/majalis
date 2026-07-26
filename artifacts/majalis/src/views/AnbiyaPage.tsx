import { useEffect } from "react";
import { useLocation } from "wouter";
import "@/styles/pages/anbiya.css";

export default function AnbiyaPage() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/prophets", { replace: true }); }, [setLocation]);
  return null;
}

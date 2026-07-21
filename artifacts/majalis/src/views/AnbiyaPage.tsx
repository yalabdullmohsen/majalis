import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AnbiyaPage() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/prophets", { replace: true }); }, [setLocation]);
  return null;
}

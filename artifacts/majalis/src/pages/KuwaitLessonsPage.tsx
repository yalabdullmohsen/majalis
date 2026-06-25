import { useEffect } from "react";
import { useLocation } from "wouter";

/** Redirect legacy /kuwait-lessons to unified /lessons page. */
export default function KuwaitLessonsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/lessons");
  }, [setLocation]);

  return null;
}

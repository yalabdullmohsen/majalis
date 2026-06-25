import { useEffect } from "react";
import { useLocation } from "wouter";

/** Redirect legacy /courses to unified /lessons?tab=courses. */
export default function CoursesPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/lessons?tab=courses");
  }, [setLocation]);

  return null;
}

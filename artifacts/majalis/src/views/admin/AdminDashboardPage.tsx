import { Redirect } from "wouter";

/** يُوجَّه إلى لوحة الإدارة الموحّدة */
export default function AdminDashboardPage() {
  return <Redirect to="/admin" />;
}

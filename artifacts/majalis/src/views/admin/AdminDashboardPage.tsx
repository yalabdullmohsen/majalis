import { Redirect } from "wouter";

/** يُوجَّه إلى خانة المراجعة — مركز القيادة الجديد */
export default function AdminDashboardPage() {
  return <Redirect to="/admin/review-hub" />;
}

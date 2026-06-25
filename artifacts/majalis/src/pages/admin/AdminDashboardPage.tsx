import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminGetDashboardStats } from "@/lib/supabase";
import { C } from "@/lib/theme";

interface Stats {
  totalUsers: number;
  totalLessons: number;
  totalBooks: number;
  totalBenefits: number;
  totalQA: number;
  pendingReports: number;
  todayViews: number;
  totalTranscriptions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetDashboardStats().then(({ stats: s, recentReports: reps }) => {
      setStats(s);
      setRecentReports(reps);
      setLoading(false);
    });
  }, []);

  const STAT_CARDS = stats
    ? [
        { label: "المستخدمون", value: stats.totalUsers, color: "bg-blue-50 border-blue-200", text: "text-blue-700" },
        { label: "الدروس", value: stats.totalLessons, color: "bg-green-50 border-green-200", text: "text-green-700" },
        { label: "الكتب", value: stats.totalBooks, color: "bg-amber-50 border-amber-200", text: "text-amber-700" },
        { label: "الفوائد", value: stats.totalBenefits, color: "bg-purple-50 border-purple-200", text: "text-purple-700" },
        { label: "الأسئلة", value: stats.totalQA, color: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
        { label: "التفريغات", value: stats.totalTranscriptions, color: "bg-teal-50 border-teal-200", text: "text-teal-700" },
        { label: "بلاغات معلّقة", value: stats.pendingReports, color: "bg-red-50 border-red-200", text: "text-red-700" },
        { label: "مشاهدات اليوم", value: stats.todayViews, color: "bg-slate-50 border-slate-200", text: "text-slate-700" },
      ]
    : [];

  if (loading) {
    return <div dir="rtl" className="p-8 text-center text-gray-500">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-green-800">لوحة التحكم المتقدمة</h1>
          <Link
            href="/admin"
            style={{ fontSize: "0.875rem", color: C.brassDeep, textDecoration: "none" }}
          >
            ← العودة إلى لوحة الإدارة
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((card, i) => (
            <div key={i} className={`${card.color} border rounded-2xl p-5`}>
              <div className={`text-3xl font-bold ${card.text}`}>{card.value.toLocaleString("ar")}</div>
              <div className="text-gray-600 text-sm mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {recentReports.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-red-700 mb-4">بلاغات تحتاج مراجعة</h2>
            <div className="space-y-3">
              {recentReports.map((rep) => (
                <div key={rep.id} className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-red-600 font-medium text-sm">{rep.report_type}</span>
                  <p className="text-gray-700 flex-1 text-sm">{rep.description}</p>
                  <span className="text-gray-400 text-xs">
                    {new Date(rep.created_at).toLocaleDateString("ar-KW")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

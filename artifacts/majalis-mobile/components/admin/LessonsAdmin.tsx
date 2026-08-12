import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  adminDeleteLesson,
  adminGetAllLessons,
  adminGetAllSheikhs,
  adminUpsertLesson,
} from "@/lib/supabase";
import { notifyLessonApproved } from "@/lib/notifications";

import {
  AdminFormModal,
  BADGE_COLORS,
  BADGE_LABELS,
  FieldInput,
  ItemCard,
  OptionRow,
  SectionHeader,
} from "./AdminFormModal";

const EMPTY = {
  id: "",
  title: "",
  sheikh_id: "",
  mosque: "",
  city: "",
  category: "",
  audience: "",
  delivery: "حضوري",
  schedule: "",
  lesson_time: "",
  description: "",
  status: "approved",
};

const STATUS_OPTIONS = [
  { value: "approved", label: "مقبول" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "rejected", label: "مرفوض" },
];
const DELIVERY_OPTIONS = [
  { value: "حضوري", label: "حضوري" },
  { value: "عن بُعد", label: "عن بُعد" },
  { value: "مختلط", label: "مختلط" },
];

export function LessonsAdmin() {
  const colors = useColors();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [sheikhPicker, setSheikhPicker] = useState(false);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["admin-lessons"],
    queryFn: async () => {
      const { data } = await adminGetAllLessons();
      return data;
    },
  });

  const { data: sheikhs = [] } = useQuery({
    queryKey: ["admin-sheikhs"],
    queryFn: async () => {
      const { data } = await adminGetAllSheikhs();
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const row: any = {
        title: form.title.trim(),
        sheikh_id: form.sheikh_id || null,
        mosque: form.mosque.trim(),
        city: form.city.trim(),
        category: form.category.trim(),
        audience: form.audience.trim(),
        delivery: form.delivery,
        schedule: form.schedule.trim(),
        lesson_time: form.lesson_time.trim(),
        description: form.description.trim(),
        status: form.status,
      };
      if (form.id) row.id = form.id;
      const { error } = await adminUpsertLesson(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      setModal(false);
      if (form.status === "approved") {
        notifyLessonApproved(form.title);
      }
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحفظ"),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحذف"),
  });

  const openAdd = () => { setForm(EMPTY); setModal(true); };
  const openEdit = (l: any) => { setForm({ ...EMPTY, ...l }); setModal(true); };
  const confirmDelete = (id: string, title: string) => {
    Alert.alert("حذف الدرس", `هل تريد حذف "${title}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => del.mutate(id) },
    ]);
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const selectedSheikh = sheikhs.find((s: any) => s.id === form.sheikh_id);

  return (
    <View style={{ flex: 1 }}>
      <SectionHeader title="الدروس" count={lessons.length} onAdd={openAdd} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {lessons.map((l: any) => (
            <ItemCard
              key={l.id}
              title={l.title}
              subtitle={l.sheikhs?.name || l.mosque}
              badge={BADGE_LABELS[l.status] || l.status}
              badgeBg={BADGE_COLORS[l.status]}
              onEdit={() => openEdit(l)}
              onDelete={() => confirmDelete(l.id, l.title)}
            />
          ))}
          {lessons.length === 0 && (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>
              لا يوجد دروس
            </Text>
          )}
        </ScrollView>
      )}

      {/* Sheikh picker modal */}
      <Modal visible={sheikhPicker} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setSheikhPicker(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>اختر الشيخ</Text>
            <Pressable onPress={() => setSheikhPicker(false)}>
              <Text style={{ color: colors.primary, fontSize: 15 }}>تم</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => { set("sheikh_id", ""); setSheikhPicker(false); }}
            style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.mutedForeground, textAlign: "right" }}>— بدون شيخ</Text>
          </Pressable>
          <ScrollView>
            {sheikhs.map((s: any) => (
              <Pressable
                key={s.id}
                onPress={() => { set("sheikh_id", s.id); setSheikhPicker(false); }}
                style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: form.sheikh_id === s.id ? colors.accent : "transparent" }}
              >
                <Text style={{ color: colors.foreground, textAlign: "right", fontWeight: form.sheikh_id === s.id ? "700" : "400" }}>{s.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <AdminFormModal
        visible={modal}
        title={form.id ? "تعديل الدرس" : "إضافة درس"}
        onClose={() => setModal(false)}
        onSave={() => upsert.mutate()}
        saving={upsert.isPending}
      >
        <FieldInput label="عنوان الدرس *" value={form.title} onChangeText={v => set("title", v)} />

        <View>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 6, textAlign: "right" }}>الشيخ</Text>
          <Pressable
            onPress={() => setSheikhPicker(true)}
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12 }}
          >
            <Text style={{ color: selectedSheikh ? colors.foreground : colors.mutedForeground, textAlign: "right" }}>
              {selectedSheikh ? selectedSheikh.name : "اختر الشيخ..."}
            </Text>
          </Pressable>
        </View>

        <FieldInput label="المسجد / مكان الدرس" value={form.mosque} onChangeText={v => set("mosque", v)} />
        <FieldInput label="المحافظة" value={form.city} onChangeText={v => set("city", v)} />
        <FieldInput label="التصنيف (مثل: فقه / عقيدة)" value={form.category} onChangeText={v => set("category", v)} />
        <FieldInput label="الفئة المستهدفة" value={form.audience} onChangeText={v => set("audience", v)} />
        <OptionRow label="طريقة الحضور" options={DELIVERY_OPTIONS} value={form.delivery} onChange={v => set("delivery", v)} />
        <FieldInput label="جدول الدرس (مثل: كل سبت)" value={form.schedule} onChangeText={v => set("schedule", v)} />
        <FieldInput label="وقت الدرس" value={form.lesson_time} onChangeText={v => set("lesson_time", v)} />
        <FieldInput label="وصف الدرس" value={form.description} onChangeText={v => set("description", v)} multiline />
        <OptionRow label="الحالة" options={STATUS_OPTIONS} value={form.status} onChange={v => set("status", v)} />
      </AdminFormModal>
    </View>
  );
}

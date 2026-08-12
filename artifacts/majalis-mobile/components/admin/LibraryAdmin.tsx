import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  adminDeleteLibraryItem,
  adminGetAllLibrary,
  adminUpsertLibraryItem,
} from "@/lib/supabase";

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
  type: "كتاب",
  category: "",
  sheikh_id: "",
  description: "",
  external_url: "",
  file_url: "",
  status: "approved",
};

const TYPE_OPTIONS = [
  { value: "كتاب", label: "كتاب" },
  { value: "تفريغ", label: "تفريغ" },
  { value: "مقال", label: "مقال" },
  { value: "صوتي", label: "صوتي" },
];
const STATUS_OPTIONS = [
  { value: "approved", label: "مقبول" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "rejected", label: "مرفوض" },
];

export function LibraryAdmin() {
  const colors = useColors();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-library"],
    queryFn: async () => {
      const { data } = await adminGetAllLibrary();
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const row: any = {
        title: form.title.trim(),
        type: form.type,
        category: form.category.trim(),
        sheikh_id: form.sheikh_id.trim() || null,
        description: form.description.trim(),
        external_url: form.external_url.trim() || null,
        file_url: form.file_url.trim() || null,
        status: form.status,
      };
      if (form.id) row.id = form.id;
      const { error } = await adminUpsertLibraryItem(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-library"] });
      qc.invalidateQueries({ queryKey: ["library"] });
      setModal(false);
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحفظ"),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteLibraryItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-library"] });
      qc.invalidateQueries({ queryKey: ["library"] });
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحذف"),
  });

  const openAdd = () => { setForm(EMPTY); setModal(true); };
  const openEdit = (item: any) => {
    setForm({ ...EMPTY, ...item, sheikh_id: item.sheikh_id || "" });
    setModal(true);
  };
  const confirmDelete = (id: string, title: string) => {
    Alert.alert("حذف العنصر", `هل تريد حذف "${title}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => del.mutate(id) },
    ]);
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <View style={{ flex: 1 }}>
      <SectionHeader title="المكتبة" count={items.length} onAdd={openAdd} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {items.map((item: any) => (
            <ItemCard
              key={item.id}
              title={item.title}
              subtitle={item.type + (item.category ? ` · ${item.category}` : "")}
              badge={BADGE_LABELS[item.status] || item.status}
              badgeBg={BADGE_COLORS[item.status]}
              onEdit={() => openEdit(item)}
              onDelete={() => confirmDelete(item.id, item.title)}
            />
          ))}
          {items.length === 0 && (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>
              لا يوجد عناصر في المكتبة
            </Text>
          )}
        </ScrollView>
      )}

      <AdminFormModal
        visible={modal}
        title={form.id ? "تعديل عنصر المكتبة" : "إضافة عنصر"}
        onClose={() => setModal(false)}
        onSave={() => upsert.mutate()}
        saving={upsert.isPending}
      >
        <FieldInput label="العنوان *" value={form.title} onChangeText={v => set("title", v)} />
        <OptionRow label="النوع" options={TYPE_OPTIONS} value={form.type} onChange={v => set("type", v)} />
        <FieldInput label="التصنيف" value={form.category} onChangeText={v => set("category", v)} />
        <FieldInput label="وصف المحتوى" value={form.description} onChangeText={v => set("description", v)} multiline />
        <FieldInput label="رابط خارجي (URL)" value={form.external_url} onChangeText={v => set("external_url", v)} keyboardType="url" />
        <FieldInput label="رابط الملف (URL)" value={form.file_url} onChangeText={v => set("file_url", v)} keyboardType="url" />
        <OptionRow label="الحالة" options={STATUS_OPTIONS} value={form.status} onChange={v => set("status", v)} />
      </AdminFormModal>
    </View>
  );
}

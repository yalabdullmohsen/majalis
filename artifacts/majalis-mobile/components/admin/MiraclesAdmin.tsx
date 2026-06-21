import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  adminDeleteMiracle,
  adminGetAllMiracles,
  adminUpsertMiracle,
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
  category: "",
  source_type: "قرآني",
  reference: "",
  body: "",
  scholarly_source: "",
  media_url: "",
  status: "approved",
};

const SOURCE_OPTIONS = [
  { value: "قرآني", label: "قرآني" },
  { value: "حديثي", label: "حديثي" },
  { value: "إشاري", label: "إشاري" },
];
const STATUS_OPTIONS = [
  { value: "approved", label: "مقبول" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "rejected", label: "مرفوض" },
];

export function MiraclesAdmin() {
  const colors = useColors();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-miracles"],
    queryFn: async () => {
      const { data } = await adminGetAllMiracles();
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const row: any = {
        title: form.title.trim(),
        category: form.category.trim(),
        source_type: form.source_type,
        reference: form.reference.trim(),
        body: form.body.trim(),
        scholarly_source: form.scholarly_source.trim(),
        media_url: form.media_url.trim() || null,
        status: form.status,
      };
      if (form.id) row.id = form.id;
      const { error } = await adminUpsertMiracle(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-miracles"] });
      qc.invalidateQueries({ queryKey: ["miracles"] });
      setModal(false);
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحفظ"),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteMiracle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-miracles"] });
      qc.invalidateQueries({ queryKey: ["miracles"] });
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحذف"),
  });

  const openAdd = () => { setForm(EMPTY); setModal(true); };
  const openEdit = (item: any) => { setForm({ ...EMPTY, ...item }); setModal(true); };
  const confirmDelete = (id: string, title: string) => {
    Alert.alert("حذف المقالة", `هل تريد حذف "${title}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => del.mutate(id) },
    ]);
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <View style={{ flex: 1 }}>
      <SectionHeader title="الإعجاز العلمي" count={items.length} onAdd={openAdd} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {items.map((item: any) => (
            <ItemCard
              key={item.id}
              title={item.title}
              subtitle={item.category + (item.source_type ? ` · ${item.source_type}` : "")}
              badge={BADGE_LABELS[item.status] || item.status}
              badgeBg={BADGE_COLORS[item.status]}
              onEdit={() => openEdit(item)}
              onDelete={() => confirmDelete(item.id, item.title)}
            />
          ))}
          {items.length === 0 && (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>
              لا يوجد مقالات
            </Text>
          )}
        </ScrollView>
      )}

      <AdminFormModal
        visible={modal}
        title={form.id ? "تعديل مقالة" : "إضافة مقالة"}
        onClose={() => setModal(false)}
        onSave={() => upsert.mutate()}
        saving={upsert.isPending}
      >
        <FieldInput label="العنوان *" value={form.title} onChangeText={v => set("title", v)} />
        <FieldInput label="التصنيف" value={form.category} onChangeText={v => set("category", v)} />
        <OptionRow label="نوع المصدر" options={SOURCE_OPTIONS} value={form.source_type} onChange={v => set("source_type", v)} />
        <FieldInput label="المرجع (الآية / الحديث)" value={form.reference} onChangeText={v => set("reference", v)} multiline />
        <FieldInput label="محتوى المقالة *" value={form.body} onChangeText={v => set("body", v)} multiline />
        <FieldInput label="المصدر العلمي" value={form.scholarly_source} onChangeText={v => set("scholarly_source", v)} />
        <FieldInput label="رابط صورة / وسائط" value={form.media_url} onChangeText={v => set("media_url", v)} keyboardType="url" />
        <OptionRow label="الحالة" options={STATUS_OPTIONS} value={form.status} onChange={v => set("status", v)} />
      </AdminFormModal>
    </View>
  );
}

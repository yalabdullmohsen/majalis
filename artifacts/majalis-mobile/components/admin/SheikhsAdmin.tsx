import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  adminDeleteSheikh,
  adminGetAllSheikhs,
  adminUpsertSheikh,
} from "@/lib/supabase";

import {
  AdminFormModal,
  FieldInput,
  ItemCard,
  OptionRow,
  SectionHeader,
} from "./AdminFormModal";

const EMPTY = {
  id: "",
  name: "",
  bio: "",
  biography: "",
  city: "",
  specialties: "",
  qualifications: "",
  ijazah: "",
  years_experience: "",
  photo_url: "",
  is_verified: false,
};

export function SheikhsAdmin() {
  const colors = useColors();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const { data: sheikhs = [], isLoading } = useQuery({
    queryKey: ["admin-sheikhs"],
    queryFn: async () => {
      const { data } = await adminGetAllSheikhs();
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const row: any = {
        name: form.name.trim(),
        bio: form.bio.trim(),
        biography: form.biography.trim(),
        city: form.city.trim(),
        specialties: form.specialties
          ? form.specialties.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        qualifications: form.qualifications
          ? form.qualifications.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        ijazah: form.ijazah.trim(),
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        photo_url: form.photo_url.trim(),
        is_verified: form.is_verified,
      };
      if (form.id) row.id = form.id;
      const { error } = await adminUpsertSheikh(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sheikhs"] });
      qc.invalidateQueries({ queryKey: ["sheikhs"] });
      setModal(false);
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحفظ"),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteSheikh(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sheikhs"] });
      qc.invalidateQueries({ queryKey: ["sheikhs"] });
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحذف"),
  });

  const openAdd = () => { setForm(EMPTY); setModal(true); };
  const openEdit = (s: any) => {
    setForm({
      ...s,
      specialties: (s.specialties || []).join(", "),
      qualifications: (s.qualifications || []).join(", "),
      years_experience: s.years_experience?.toString() || "",
    });
    setModal(true);
  };
  const confirmDelete = (id: string, name: string) => {
    Alert.alert("حذف الشيخ", `هل تريد حذف "${name}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => del.mutate(id) },
    ]);
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <View style={{ flex: 1 }}>
      <SectionHeader title="المشايخ" count={sheikhs.length} onAdd={openAdd} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {sheikhs.map((s: any) => (
            <ItemCard
              key={s.id}
              title={s.name}
              subtitle={s.city || s.bio}
              badge={s.is_verified ? "موثّق ✓" : undefined}
              badgeBg="#D1FAE5"
              onEdit={() => openEdit(s)}
              onDelete={() => confirmDelete(s.id, s.name)}
            />
          ))}
          {sheikhs.length === 0 && (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>
              لا يوجد مشايخ مسجّلون
            </Text>
          )}
        </ScrollView>
      )}

      <AdminFormModal
        visible={modal}
        title={form.id ? "تعديل الشيخ" : "إضافة شيخ"}
        onClose={() => setModal(false)}
        onSave={() => upsert.mutate()}
        saving={upsert.isPending}
      >
        <FieldInput label="الاسم *" value={form.name} onChangeText={v => set("name", v)} />
        <FieldInput label="نبذة مختصرة" value={form.bio} onChangeText={v => set("bio", v)} multiline />
        <FieldInput label="السيرة الذاتية" value={form.biography} onChangeText={v => set("biography", v)} multiline />
        <FieldInput label="المحافظة" value={form.city} onChangeText={v => set("city", v)} />
        <FieldInput label="التخصصات (مفصولة بفاصلة)" value={form.specialties} onChangeText={v => set("specialties", v)} />
        <FieldInput label="المؤهلات (مفصولة بفاصلة)" value={form.qualifications} onChangeText={v => set("qualifications", v)} />
        <FieldInput label="الإجازة العلمية" value={form.ijazah} onChangeText={v => set("ijazah", v)} />
        <FieldInput label="سنوات الخبرة" value={form.years_experience} onChangeText={v => set("years_experience", v)} keyboardType="numeric" />
        <FieldInput label="رابط الصورة" value={form.photo_url} onChangeText={v => set("photo_url", v)} />
        <OptionRow
          label="الحالة"
          options={[{ value: "true", label: "موثّق ✓" }, { value: "false", label: "غير موثّق" }]}
          value={form.is_verified ? "true" : "false"}
          onChange={v => set("is_verified", v === "true")}
        />
      </AdminFormModal>
    </View>
  );
}

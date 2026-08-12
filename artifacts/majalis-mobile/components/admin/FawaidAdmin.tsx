import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { adminDeleteFawaid, adminGetAllFawaid, moderateFawaid } from "@/lib/supabase";
import { notifyFawaidApproved } from "@/lib/notifications";

const STATUS_TABS = [
  { value: "", label: "الكل" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "مقبول" },
  { value: "rejected", label: "مرفوض" },
];

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  approved: { bg: "#D1FAE5", text: "#065F46", label: "مقبول" },
  pending:  { bg: "#FEF3C7", text: "#92400E", label: "قيد المراجعة" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", label: "مرفوض" },
};

export function FawaidAdmin() {
  const colors = useColors();
  const qc = useQueryClient();
  const [tab, setTab] = useState("");

  const { data: fawaid = [], isLoading } = useQuery({
    queryKey: ["admin-fawaid", tab],
    queryFn: () => adminGetAllFawaid(tab || undefined),
  });

  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => moderateFawaid(id, status),
    onSuccess: (_data, variables) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["admin-fawaid"] });
      qc.invalidateQueries({ queryKey: ["fawaid"] });
      qc.invalidateQueries({ queryKey: ["pending-fawaid"] });
      if (variables.status === "approved") {
        notifyFawaidApproved();
      }
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء التحديث"),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteFawaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fawaid"] });
      qc.invalidateQueries({ queryKey: ["fawaid"] });
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء الحذف"),
  });

  const confirmDelete = (id: string) => {
    Alert.alert("حذف الفائدة", "هل تريد حذف هذه الفائدة نهائيًا؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => del.mutate(id) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" }}>
          الفوائد ({fawaid.length})
        </Text>
      </View>

      {/* Status tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 14 }}>
        <View style={{ flexDirection: "row-reverse", gap: 8, paddingHorizontal: 2 }}>
          {STATUS_TABS.map(t => (
            <Pressable
              key={t.value}
              onPress={() => setTab(t.value)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: tab === t.value ? colors.primary : colors.border, backgroundColor: tab === t.value ? colors.primary : colors.card }}
            >
              <Text style={{ fontSize: 13, color: tab === t.value ? "#FFF" : colors.mutedForeground }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {fawaid.map((f: any) => {
            const badge = BADGE[f.status] || BADGE.pending;
            return (
              <View key={f.id} style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 }}>
                <Text style={{ fontSize: 15, color: colors.foreground, textAlign: "right", lineHeight: 24 }}>
                  {f.text}
                </Text>
                {f.author_name ? (
                  <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: "right", marginTop: 4, fontStyle: "italic" }}>
                    — {f.author_name}
                  </Text>
                ) : null}
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <View style={{ backgroundColor: badge.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: badge.text }}>{badge.label}</Text>
                  </View>
                  <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                    {f.status !== "approved" && (
                      <Pressable
                        onPress={() => moderate.mutate({ id: f.id, status: "approved" })}
                        disabled={moderate.isPending}
                        style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                      >
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                        <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700" }}>قبول</Text>
                      </Pressable>
                    )}
                    {f.status !== "rejected" && (
                      <Pressable
                        onPress={() => moderate.mutate({ id: f.id, status: "rejected" })}
                        disabled={moderate.isPending}
                        style={{ borderWidth: 1, borderColor: colors.destructive, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                      >
                        <Ionicons name="close" size={14} color={colors.destructive} />
                        <Text style={{ color: colors.destructive, fontSize: 13, fontWeight: "700" }}>رفض</Text>
                      </Pressable>
                    )}
                    {f.status !== "pending" && (
                      <Pressable
                        onPress={() => moderate.mutate({ id: f.id, status: "pending" })}
                        disabled={moderate.isPending}
                        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                      >
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>إعادة للانتظار</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => confirmDelete(f.id)}
                      style={{ padding: 7, backgroundColor: "#FEE2E2", borderRadius: 8 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
          {fawaid.length === 0 && (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>
              لا يوجد فوائد
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

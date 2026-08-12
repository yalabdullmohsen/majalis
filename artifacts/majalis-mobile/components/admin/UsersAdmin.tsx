import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { adminGetUsers, adminUpdateUserRole } from "@/lib/supabase";

const ROLE_OPTIONS = [
  { value: "user", label: "مستخدم", bg: "#F0E8D6", text: "#5B5446" },
  { value: "sheikh", label: "شيخ", bg: "#D1FAE5", text: "#065F46" },
  { value: "admin", label: "مشرف", bg: "#FEF3C7", text: "#92400E" },
];

const FILTER_TABS = [
  { value: "all", label: "الكل" },
  { value: "admin", label: "مشرفون" },
  { value: "sheikh", label: "مشايخ" },
  { value: "user", label: "مستخدمون" },
];

export function UsersAdmin() {
  const colors = useColors();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rolePicker, setRolePicker] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await adminGetUsers();
      return data;
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminUpdateUserRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setRolePicker(null);
    },
    onError: () => Alert.alert("خطأ", "حدث خطأ أثناء تحديث الدور"),
  });

  const filtered = users
    .filter((u: any) => filter === "all" || u.role === filter)
    .filter((u: any) =>
      !search.trim() ||
      (u.full_name || "").includes(search) ||
      (u.city || "").includes(search)
    );

  const counts: Record<string, number> = {
    all: users.length,
    admin: users.filter((u: any) => u.role === "admin").length,
    sheikh: users.filter((u: any) => u.role === "sheikh").length,
    user: users.filter((u: any) => u.role === "user").length,
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" }}>
          المستخدمون ({users.length})
        </Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="بحث بالاسم أو المحافظة..."
        placeholderTextColor={colors.mutedForeground}
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.foreground, textAlign: "right", fontSize: 14, marginBottom: 12 }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }}>
        <View style={{ flexDirection: "row-reverse", gap: 8, paddingHorizontal: 2 }}>
          {FILTER_TABS.map(t => (
            <Pressable
              key={t.value}
              onPress={() => setFilter(t.value)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: filter === t.value ? colors.primary : colors.border, backgroundColor: filter === t.value ? colors.primary : colors.card }}
            >
              <Text style={{ fontSize: 13, color: filter === t.value ? "#FFF" : colors.mutedForeground }}>
                {t.label} ({counts[t.value] ?? 0})
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {filtered.map((u: any) => {
            const roleInfo = ROLE_OPTIONS.find(r => r.value === u.role) || ROLE_OPTIONS[0];
            return (
              <View key={u.id} style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 }}>
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, textAlign: "right" }}>
                      {u.full_name || "بدون اسم"}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "right", marginTop: 2 }}>
                      {u.city || "—"} · نقاط: {u.points ?? 0} · المستوى {u.level ?? 1}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: "right", marginTop: 2 }}>
                      انضم: {new Date(u.created_at).toLocaleDateString("ar-KW")}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setRolePicker(u)}
                    style={{ marginRight: 10, backgroundColor: roleInfo.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ color: roleInfo.text, fontSize: 13, fontWeight: "700" }}>
                      {roleInfo.label}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {filtered.length === 0 && (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>
              لا يوجد مستخدمون
            </Text>
          )}
        </ScrollView>
      )}

      {/* Role picker modal */}
      <Modal
        visible={!!rolePicker}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setRolePicker(null)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, textAlign: "right" }}>
              تغيير دور: {rolePicker?.full_name || "بدون اسم"}
            </Text>
          </View>
          <View style={{ padding: 20, gap: 12 }}>
            {ROLE_OPTIONS.map(r => (
              <Pressable
                key={r.value}
                onPress={() => updateRole.mutate({ userId: rolePicker.id, role: r.value })}
                disabled={updateRole.isPending}
                style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 12, borderWidth: 2, borderColor: rolePicker?.role === r.value ? colors.primary : colors.border, backgroundColor: rolePicker?.role === r.value ? colors.accent : colors.card }}
              >
                <Text style={{ fontSize: 16, fontWeight: rolePicker?.role === r.value ? "700" : "400", color: colors.foreground }}>{r.label}</Text>
                {rolePicker?.role === r.value && (
                  <View style={{ backgroundColor: r.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: r.text, fontSize: 12 }}>الدور الحالي</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setRolePicker(null)} style={{ margin: 16, padding: 14, backgroundColor: colors.muted, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600" }}>إلغاء</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

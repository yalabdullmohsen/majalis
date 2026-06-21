import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getPendingFawaid, moderateFawaid } from "@/lib/supabase";

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pending, isLoading, refetch } = useQuery({
    queryKey: ["pending-fawaid"],
    queryFn: getPendingFawaid,
    enabled: !!user,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      moderateFawaid(id, status),
    onSuccess: (_, { status }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["pending-fawaid"] });
      queryClient.invalidateQueries({ queryKey: ["fawaid"] });
    },
    onError: () => {
      Alert.alert("خطأ", "حدث خطأ أثناء التحديث");
    },
  });

  const handleModerate = (id: string, status: "approved" | "rejected") => {
    Alert.alert(
      status === "approved" ? "قبول الفائدة" : "رفض الفائدة",
      status === "approved"
        ? "هل تريد قبول هذه الفائدة ونشرها؟"
        : "هل تريد رفض هذه الفائدة؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: status === "approved" ? "قبول" : "رفض",
          style: status === "approved" ? "default" : "destructive",
          onPress: () => moderateMutation.mutate({ id, status }),
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          يجب تسجيل الدخول للوصول إلى هذه الصفحة
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={pending || []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingTop: Platform.OS === "web" ? 67 + 12 : 12,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 40,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                فوائد في انتظار المراجعة ({(pending || []).length})
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={40} color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا توجد فوائد في الانتظار
              </Text>
            </View>
          )}
          renderItem={({ item }: { item: any }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardText, { color: colors.foreground }]}>
                {item.text}
              </Text>
              {item.author_name ? (
                <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]}>
                  — {item.author_name}
                </Text>
              ) : null}
              <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                بتاريخ: {new Date(item.created_at).toLocaleDateString("ar-KW")}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.rejectBtn, { borderColor: colors.destructive }]}
                  onPress={() => handleModerate(item.id, "rejected")}
                  disabled={moderateMutation.isPending}
                >
                  <Ionicons name="close" size={18} color={colors.destructive} />
                  <Text style={[styles.rejectBtnText, { color: colors.destructive }]}>رفض</Text>
                </Pressable>
                <Pressable
                  style={[styles.approveBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleModerate(item.id, "approved")}
                  disabled={moderateMutation.isPending}
                >
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={styles.approveBtnText}>قبول</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  cardText: { fontSize: 16, lineHeight: 26, textAlign: "right" },
  cardAuthor: { fontSize: 13, textAlign: "right", fontStyle: "italic" },
  cardMeta: { fontSize: 12, textAlign: "right" },
  actions: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 4,
  },
  approveBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  approveBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  rejectBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
  rejectBtnText: { fontSize: 14, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
});

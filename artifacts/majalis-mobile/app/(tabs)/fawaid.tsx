import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getApprovedFawaid, submitFawaid } from "@/lib/supabase";

export default function FawaidScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [newText, setNewText] = useState("");
  const [authorName, setAuthorName] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["fawaid"],
    queryFn: getApprovedFawaid,
  });

  const submitMutation = useMutation({
    mutationFn: () => submitFawaid(user!.id, newText, authorName),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      setNewText("");
      setAuthorName("");
      Alert.alert("شكراً", "تم إرسال الفائدة وستظهر بعد المراجعة");
      queryClient.invalidateQueries({ queryKey: ["fawaid"] });
    },
    onError: () => {
      Alert.alert("خطأ", "حدث خطأ أثناء الإرسال");
    },
  });

  const fawaid = data?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={fawaid}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingTop: Platform.OS === "web" ? 67 + 12 : 12,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="star-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا توجد فوائد حالياً
              </Text>
            </View>
          )}
          renderItem={({ item }: { item: any }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.parchmentDeep,
                  borderColor: colors.border,
                  borderRightColor: colors.brass,
                },
              ]}
            >
              <Ionicons name="quote" size={20} color={colors.brass} style={{ alignSelf: "flex-end" }} />
              <Text style={[styles.text, { color: colors.foreground }]}>{item.text}</Text>
              {item.author_name ? (
                <Text style={[styles.author, { color: colors.brass }]}>— {item.author_name}</Text>
              ) : null}
            </View>
          )}
        />
      )}

      {/* FAB for logged-in users */}
      {user && (
        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary, bottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 80 + 16 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      )}

      {/* Submit modal */}
      <Modal visible={modalVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>أضف فائدة</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="نص الفائدة..."
              placeholderTextColor={colors.mutedForeground}
              value={newText}
              onChangeText={setNewText}
              multiline
              numberOfLines={5}
              textAlign="right"
              textAlignVertical="top"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="اسم المؤلف (اختياري)"
              placeholderTextColor={colors.mutedForeground}
              value={authorName}
              onChangeText={setAuthorName}
              textAlign="right"
            />
            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: newText.trim().length > 5 ? colors.primary : colors.muted },
              ]}
              disabled={newText.trim().length <= 5 || submitMutation.isPending}
              onPress={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>إرسال للمراجعة</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderRightWidth: 4,
    marginBottom: 10,
    gap: 8,
  },
  text: { fontSize: 16, lineHeight: 28, textAlign: "right" },
  author: { fontSize: 13, textAlign: "right", fontStyle: "italic" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  fab: {
    position: "absolute",
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 48,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
});

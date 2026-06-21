import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getQaCategories, getQaQuestions } from "@/lib/supabase";

export default function QaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: catData } = useQuery({
    queryKey: ["qa-categories"],
    queryFn: getQaCategories,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["qa-questions", categoryId, search],
    queryFn: () => getQaQuestions({ categoryId, search }),
  });

  const categories = catData?.data || [];
  const questions = data?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: Platform.OS === "web" ? 67 + 8 : insets.top + 8, paddingHorizontal: 12 }}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث في الأسئلة..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            textAlign="right"
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={{ flexGrow: 0 }}
      >
        {[{ id: undefined, name: "الكل" }, ...categories].map((c: any) => {
          const active = categoryId === c.id;
          return (
            <Pressable
              key={c.id || "all"}
              style={[
                styles.pill,
                { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
              ]}
              onPress={() => setCategoryId(c.id)}
            >
              <Text style={[styles.pillText, { color: active ? "#FFF" : colors.foreground }]}>{c.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="help-circle-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا توجد أسئلة حالياً
              </Text>
            </View>
          )}
          renderItem={({ item }: { item: any }) => {
            const open = expanded === item.id;
            return (
              <Pressable
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setExpanded(open ? null : item.id)}
              >
                <View style={styles.cardTop}>
                  {item.qa_categories?.name ? (
                    <View style={[styles.categoryBadge, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
                        {item.qa_categories.name}
                      </Text>
                    </View>
                  ) : <View />}
                  {item.ruling_type ? (
                    <View style={[styles.rulingBadge, { backgroundColor: colors.brass }]}>
                      <Text style={styles.rulingBadgeText}>{item.ruling_type}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.questionRow}>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                  <Text style={[styles.question, { color: colors.foreground }]}>{item.question}</Text>
                </View>
                {open ? (
                  <View style={styles.answerWrap}>
                    <Text style={[styles.answer, { color: colors.mutedForeground }]}>{item.answer}</Text>
                    {item.evidence ? (
                      <Text style={[styles.evidence, { color: colors.primary }]}>الدليل: {item.evidence}</Text>
                    ) : null}
                    {item.reference ? (
                      <Text style={[styles.reference, { color: colors.brass }]}>المرجع: {item.reference}</Text>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 4,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },
  pillsRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
    flexDirection: "row-reverse",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontWeight: "600" },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  cardTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  categoryBadgeText: { fontSize: 12, fontWeight: "600" },
  rulingBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  rulingBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  questionRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8 },
  question: { flex: 1, fontSize: 16, fontWeight: "700", textAlign: "right", fontFamily: "Inter_700Bold", lineHeight: 26 },
  answerWrap: { gap: 6, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)", paddingTop: 10 },
  answer: { fontSize: 14, lineHeight: 24, textAlign: "right" },
  evidence: { fontSize: 13, lineHeight: 22, textAlign: "right" },
  reference: { fontSize: 12, textAlign: "right", fontStyle: "italic" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});

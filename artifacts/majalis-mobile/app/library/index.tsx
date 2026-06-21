import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getLibrary } from "@/lib/supabase";

const TYPES = ["الكل", "كتاب", "مقطع", "مقال", "متن"];
const TYPE_ICONS: Record<string, string> = {
  كتاب: "book-outline",
  مقطع: "play-circle-outline",
  مقال: "document-text-outline",
  متن: "reader-outline",
};

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["library", selectedType],
    queryFn: () => getLibrary({ type: selectedType }),
  });

  const items = data?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.pillsRow, { paddingTop: Platform.OS === "web" ? 67 + 8 : 8 }]}
        style={{ flexGrow: 0 }}
      >
        {TYPES.map((t) => {
          const val = t === "الكل" ? undefined : t;
          const active = selectedType === val;
          return (
            <Pressable
              key={t}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedType(val)}
            >
              <Text style={[styles.pillText, { color: active ? "#FFF" : colors.foreground }]}>{t}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="library-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا يوجد محتوى حالياً
              </Text>
            </View>
          )}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => item.link && Linking.openURL(item.link).catch(() => {})}
            >
              <View style={[styles.typeIcon, { backgroundColor: colors.accent }]}>
                <Ionicons
                  name={(TYPE_ICONS[item.type] || "document-outline") as any}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.content}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                {item.author ? (
                  <Text style={[styles.author, { color: colors.mutedForeground }]}>
                    {item.author}
                  </Text>
                ) : null}
                {item.category ? (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {item.category}
                    </Text>
                  </View>
                ) : null}
              </View>
              {item.link ? (
                <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600", textAlign: "right" },
  author: { fontSize: 13, textAlign: "right" },
  badge: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});

import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getSheikhs } from "@/lib/supabase";

export default function SheikhsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["sheikhs"],
    queryFn: getSheikhs,
  });

  const sheikhs = (data?.data || []).filter((s: any) =>
    search.trim() ? s.name?.includes(search.trim()) || s.specialty?.includes(search.trim()) : true
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Platform.OS === "web" ? 67 : 0 }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="ابحث عن شيخ..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sheikhs}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا يوجد مشايخ حالياً
              </Text>
            </View>
          )}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/sheikh/${item.id}` as any)}
            >
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Ionicons name="person" size={28} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                {item.specialty ? (
                  <Text style={[styles.specialty, { color: colors.mutedForeground }]}>
                    {item.specialty}
                  </Text>
                ) : null}
                {item.city ? (
                  <View style={styles.cityRow}>
                    <Ionicons name="location-outline" size={13} color={colors.brass} />
                    <Text style={[styles.city, { color: colors.brass }]}>{item.city}</Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-back" size={20} color={colors.mutedForeground} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: "700", textAlign: "right", fontFamily: "Inter_700Bold" },
  specialty: { fontSize: 13, textAlign: "right" },
  cityRow: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  city: { fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});

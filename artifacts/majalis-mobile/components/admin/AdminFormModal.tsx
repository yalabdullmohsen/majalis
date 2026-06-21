import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export function AdminFormModal({
  visible,
  title,
  onClose,
  onSave,
  saving = false,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.foreground,
              fontFamily: "Inter_700Bold",
            }}
          >
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderColor: colors.border,
            flexDirection: "row-reverse",
            gap: 10,
          }}
        >
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 10,
              padding: 13,
              alignItems: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>حفظ</Text>
            )}
          </Pressable>
          <Pressable
            onPress={onClose}
            style={{
              flex: 1,
              backgroundColor: colors.muted,
              borderRadius: 10,
              padding: 13,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 15 }}>
              إلغاء
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FieldInput({
  label,
  value,
  onChangeText,
  multiline = false,
  placeholder = "",
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
  placeholder?: string;
  keyboardType?: any;
}) {
  const colors = useColors();
  return (
    <View>
      <Text
        style={{
          fontSize: 13,
          color: colors.mutedForeground,
          marginBottom: 6,
          textAlign: "right",
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: 10,
          color: colors.foreground,
          textAlign: "right",
          fontSize: 14,
          minHeight: multiline ? 90 : 44,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

export function OptionRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View>
      <Text
        style={{
          fontSize: 13,
          color: colors.mutedForeground,
          marginBottom: 6,
          textAlign: "right",
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: value === o.value ? colors.primary : colors.border,
              backgroundColor: value === o.value ? colors.accent : colors.card,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: value === o.value ? colors.primary : colors.mutedForeground,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function SectionHeader({
  title,
  count,
  onAdd,
}: {
  title: string;
  count: number;
  onAdd: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: colors.foreground,
          fontFamily: "Inter_700Bold",
        }}
      >
        {title} ({count})
      </Text>
      <Pressable
        onPress={onAdd}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 7,
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Ionicons name="add" size={16} color="#FFF" />
        <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700" }}>إضافة</Text>
      </Pressable>
    </View>
  );
}

export function ItemCard({
  title,
  subtitle,
  badge,
  badgeBg,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeBg?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.foreground,
              textAlign: "right",
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                marginTop: 3,
                textAlign: "right",
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
          {badge ? (
            <View
              style={{
                marginTop: 5,
                alignSelf: "flex-end",
                backgroundColor: badgeBg || colors.muted,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.foreground }}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Pressable
            onPress={onEdit}
            style={{ padding: 7, backgroundColor: colors.accent, borderRadius: 8 }}
          >
            <Ionicons name="pencil-outline" size={15} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={{ padding: 7, backgroundColor: "#FEE2E2", borderRadius: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const BADGE_COLORS: Record<string, string> = {
  approved: "#D1FAE5",
  pending: "#FEF3C7",
  rejected: "#FEE2E2",
};
export const BADGE_LABELS: Record<string, string> = {
  approved: "مقبول",
  pending: "قيد المراجعة",
  rejected: "مرفوض",
};

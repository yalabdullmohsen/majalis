import React, { memo, useCallback, type ComponentType, type ReactElement } from "react";
import {
  FlatList,
  type FlatListProps,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type OptimizedListProps<T> = Omit<
  FlatListProps<T>,
  "renderItem" | "keyExtractor"
> & {
  data: readonly T[] | null | undefined;
  /** Stable unique key — avoid index when possible */
  keyExtractor: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;
  /**
   * When true + estimatedItemSize, enables getItemLayout (fixed-height rows only).
   * Do not enable for variable-height Arabic cards.
   */
  fixedItemSize?: boolean;
  estimatedItemSize?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * High-performance list wrapper.
 * FlatList with recycling-friendly defaults (expo-image already present;
 * add @shopify/flash-list later if you want FlashList + native rebuild).
 */
function OptimizedListInner<T>({
  data,
  keyExtractor,
  renderItem,
  fixedItemSize = false,
  estimatedItemSize = 88,
  initialNumToRender = 8,
  maxToRenderPerBatch = 6,
  windowSize = 7,
  removeClippedSubviews = true,
  updateCellsBatchingPeriod = 50,
  getItemLayout: getItemLayoutProp,
  ...rest
}: OptimizedListProps<T>): ReactElement {
  const getItemLayout = useCallback(
    (_: ArrayLike<T> | null | undefined, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }),
    [estimatedItemSize],
  );

  return (
    <FlatList
      data={data as T[] | null | undefined}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      getItemLayout={
        getItemLayoutProp ?? (fixedItemSize ? getItemLayout : undefined)
      }
      {...rest}
    />
  );
}

export const OptimizedList = memo(OptimizedListInner) as <T>(
  props: OptimizedListProps<T>,
) => ReactElement;

/** Wrap row components: `export const Row = memoListItem(RowImpl)` */
export function memoListItem<P extends object>(Component: ComponentType<P>) {
  return memo(Component);
}

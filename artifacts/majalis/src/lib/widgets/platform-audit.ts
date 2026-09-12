export type WidgetSurfaceStatus =
  | "active"
  | "incomplete"
  | "legacy"
  | "duplicate"
  | "unused"
  | "blocked_by_platform"
  | "ready_to_integrate";

export const WIDGET_PLATFORM_STACK = {
  productBrand: "سُنّة",
  runtime: "capacitor-webview",
  web: "vite-react-spa",
  ios: true,
  android: true,
  flutterStorePath: false,
  expoStorePath: false,
} as const;

export const WIDGET_SURFACE_AUDIT = [
  {
    id: "ios-prayer-live-activity",
    platform: "ios" as const,
    status: "active" as WidgetSurfaceStatus,
    notes: "ActivityKit Live Activity للصلاة — ليس Home Screen Widget.",
  },
  {
    id: "ios-home-screen-widgets",
    platform: "ios" as const,
    status: "ready_to_integrate" as WidgetSurfaceStatus,
    notes: "لا WidgetKit home-screen بعد؛ P1 على Snapshot Schema.",
  },
  {
    id: "android-app-widgets",
    platform: "android" as const,
    status: "ready_to_integrate" as WidgetSurfaceStatus,
    notes: "لا AppWidgetProvider حاليًا.",
  },
  {
    id: "shared-widget-data-coordinator",
    platform: "shared" as const,
    status: "active" as WidgetSurfaceStatus,
    notes: "P0: Coordinator + schema + privacy + deep links.",
  },
] as const;

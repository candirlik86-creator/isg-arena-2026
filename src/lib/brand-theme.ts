import { DEFAULT_SETTINGS, type GameSettings } from "./game-state";

export type ThemeId = "corporate-blue" | "warehouse" | "safety-yellow" | "dark" | "neon";

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "corporate-blue", label: "Kurumsal Mavi" },
  { id: "warehouse", label: "Depo" },
  { id: "safety-yellow", label: "Güvenlik Sarısı" },
  { id: "dark", label: "Koyu Tema" },
  { id: "neon", label: "Neon" },
];

const themeIds = new Set<ThemeId>(THEME_OPTIONS.map((option) => option.id));

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && themeIds.has(value as ThemeId);
}

export function resolveBrandSettings(settings: Partial<GameSettings> = {}): GameSettings {
  const customerName = settings.customerName?.trim() || DEFAULT_SETTINGS.customerName;
  const watermarkText = settings.watermarkText?.trim() || customerName;

  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    productBrandName: settings.productBrandName?.trim() || DEFAULT_SETTINGS.productBrandName,
    customerName,
    customerLogoText: settings.customerLogoText?.trim() ?? "",
    customerLogoUrl: settings.customerLogoUrl?.trim() ?? "",
    watermarkText,
    themeId: isThemeId(settings.themeId) ? settings.themeId : DEFAULT_SETTINGS.themeId,
  };
}

export function getScreenSurfaceAttributes(settings: Partial<GameSettings>) {
  const brand = resolveBrandSettings(settings);

  return {
    className: "arena-screen-bg",
    "data-theme-id": brand.themeId,
    "data-watermark-text": brand.watermarkText.toUpperCase(),
    "data-customer-name": brand.customerName,
  } as const;
}

export function getPlaySurfaceAttributes(settings: Partial<GameSettings>) {
  const brand = resolveBrandSettings(settings);

  return {
    "data-watermark-text": brand.watermarkText.toUpperCase(),
    "data-customer-name": brand.customerName,
  } as const;
}

export function getProductBrandInitials(productBrandName: string) {
  const parts = productBrandName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "SA";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

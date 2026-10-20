export const SHOP_NAME = "Pretty Corner";

// Digits only, with country code.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918655434260";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Pickup stations on the Western line, Virar to Borivali.
export const STATIONS = [
  "Virar",
  "Nalasopara",
  "Vasai Road",
  "Naigaon",
  "Bhayandar",
  "Mira Road",
  "Dahisar",
  "Borivali",
] as const;

export const SIZE_SUGGESTIONS = ["Free size", "Small", "Medium", "Large"];

export const MAX_CUSTOM_IMAGES = 4;

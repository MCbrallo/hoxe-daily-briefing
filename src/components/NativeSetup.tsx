"use client";

import { useNotificationsSetup } from "@/hooks/useNotificationsSetup";

export function NativeSetup() {
  useNotificationsSetup();
  return null;
}

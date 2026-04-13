"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Handles daily HOXE learning reminders securely on the device.
 * Enforces the 09:30 AM and 18:30 PM schedule if permitted.
 */
export function useNotificationsSetup() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function setupNotifications() {
      // Local Notifications only work on native platforms (Android/iOS)
      if (!Capacitor.isNativePlatform()) return;

      try {
        let permStatus = await LocalNotifications.checkPermissions();

        // If not granted, request the permission on initial load
        if (permStatus.display !== "granted") {
          permStatus = await LocalNotifications.requestPermissions();
        }

        if (permStatus.display === "granted") {
          // Clear any existing pending notifications to avoid dupes
          await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }] });

          // Schedule Daily Prompts
          await LocalNotifications.schedule({
            notifications: [
              {
                id: 1,
                title: "HOXE",
                body: "🌅 Un nuevo día está listo para aprender.",
                schedule: { 
                  allowWhileIdle: true,
                  every: "day",
                  on: { hour: 9, minute: 30 } 
                },
                actionTypeId: "",
                extra: null,
              },
              {
                id: 2,
                title: "HOXE",
                body: "🌙 No te vayas a la cama sin aprender algo nuevo.",
                schedule: { 
                  allowWhileIdle: true,
                  every: "day",
                  on: { hour: 18, minute: 30 } 
                },
                actionTypeId: "",
                extra: null,
              }
            ]
          });

          console.log("[HOXE Native Hooks] Successfully scheduled local notifications.");
        }
      } catch (err) {
        console.error("[HOXE Native Hooks] Failed to setup local notifications:", err);
      }
    }

    setupNotifications();
  }, []);
}

"use client";

import { useEffect } from "react";

export default function MarkNotificationsRead() {
  useEffect(() => {
    fetch("/api/notifications", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}

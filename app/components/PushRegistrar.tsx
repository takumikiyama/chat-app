"use client";
// import "next-pwa/register";
import { useEffect } from "react";
import { subscribePush } from "@/app/lib/push";

export default function PushRegistrar() {
  useEffect(() => {
    // SW登録後にプッシュ購読を開始
    subscribePush();
  }, []);
  return null;
}
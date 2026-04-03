"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getOrCreateProfile,
  updateProfile as dbUpdateProfile,
  type UpdateProfileInput,
} from "@/lib/actions/settings";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function fetchProfile() {
  const userId = await getAuthUserId();
  return getOrCreateProfile(db, userId);
}

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function saveProfile(formData: FormData): Promise<ActionResult> {
  const userId = await getAuthUserId();
  const profile = await getOrCreateProfile(db, userId);

  const gstPercent = parseFloat(formData.get("gstRate") as string ?? "10");

  const data: UpdateProfileInput = {
    businessName: (formData.get("businessName") as string ?? "").trim(),
    abn: (formData.get("abn") as string ?? "").trim() || undefined,
    address: (formData.get("address") as string ?? "").trim() || undefined,
    phone: (formData.get("phone") as string ?? "").trim() || undefined,
    email: (formData.get("email") as string ?? "").trim() || undefined,
    standardDayHours: parseFloat(formData.get("standardDayHours") as string ?? "8"),
    mileageRate: parseFloat(formData.get("mileageRate") as string ?? "0.91"),
    gstRate: gstPercent / 100, // Store as decimal (10% → 0.1)
    invoicePrefix: (formData.get("invoicePrefix") as string ?? "INV").trim(),
    paymentTermsDays: parseInt(formData.get("paymentTermsDays") as string ?? "30"),
    bankName: (formData.get("bankName") as string ?? "").trim() || undefined,
    bankBsb: (formData.get("bankBsb") as string ?? "").trim() || undefined,
    bankAccount: (formData.get("bankAccount") as string ?? "").trim() || undefined,
  };

  const result = await dbUpdateProfile(db, profile.id, userId, data);
  if (!result) {
    return { success: false, error: "Failed to save settings" };
  }

  revalidatePath("/app/settings");
  return { success: true };
}

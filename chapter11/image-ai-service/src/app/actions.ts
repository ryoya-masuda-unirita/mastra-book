"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function updateUserPlan(plan: string): Promise<void> {
  const hdrs = await headers();
  await auth.api.updateUser({
    headers: hdrs,
    body: { plan },
  });
}

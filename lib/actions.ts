"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTransaction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, koperasi_id, role")
    .eq("id", user!.id)
    .single();

  const type = formData.get("type") as string;
  const amount = Number(formData.get("amount"));
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;

  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      koperasi_id: profile!.koperasi_id,
      type,
      amount,
      description,
      category,
      created_by: profile!.id,
      // status stays 'pending' by default; auto-approve below threshold handled by trigger-less logic here:
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    transaction_id: tx.id,
    actor_id: profile!.id,
    action: "create",
    note: `Transaksi dicatat oleh ${profile!.role}`,
  });

  // Transaksi kecil (di bawah threshold) auto-approved supaya operasional harian tidak macet.
  if (!tx.approval_threshold_hit) {
    await supabase.rpc("set_transaction_status", { tx_id: tx.id, new_status: "approved" });;
    await supabase.from("audit_log").insert({
      transaction_id: tx.id,
      actor_id: profile!.id,
      action: "approve",
      note: "Auto-approved: di bawah ambang batas multi-signature",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function submitApproval(transactionId: string, decision: "approve" | "reject") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user!.id)
    .single();

  await supabase.from("approvals").insert({
    transaction_id: transactionId,
    approver_id: profile!.id,
    decision,
  });

  await supabase.from("audit_log").insert({
    transaction_id: transactionId,
    actor_id: profile!.id,
    action: decision === "approve" ? "approve" : "reject",
    note: `Keputusan multi-sig oleh ${profile!.role}`,
  });

  // Aturan 2-dari-3: cek total approve, jika >= 2 maka transaksi disetujui final.
  const { data: allApprovals } = await supabase
    .from("approvals")
    .select("decision")
    .eq("transaction_id", transactionId);

  const approveCount = allApprovals?.filter((a) => a.decision === "approve").length ?? 0;
  const rejectCount = allApprovals?.filter((a) => a.decision === "reject").length ?? 0;

  if (approveCount >= 2) {
    await supabase.rpc("set_transaction_status", { tx_id: transactionId, new_status: "approved" });
  } else if (rejectCount >= 2) {
    await supabase.rpc("set_transaction_status", { tx_id: transactionId, new_status: "rejected" });
  }

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
}

export async function flagAnomaly(transactionId: string, reason: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user!.id).single();

  await supabase.from("anomaly_flags").insert({
    transaction_id: transactionId,
    flagged_by: profile!.id,
    source: "anggota",
    reason,
  });

  await supabase.from("audit_log").insert({
    transaction_id: transactionId,
    actor_id: profile!.id,
    action: "flag_anomaly",
    note: reason,
  });

  revalidatePath("/anomalies");
  revalidatePath("/transactions");
}

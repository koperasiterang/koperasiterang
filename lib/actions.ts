"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Revalidate semua halaman yang menampilkan status/saldo transaksi. */
function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/approvals");
  revalidatePath("/anomalies");
}

export async function createTransaction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, koperasi_id, role")
    .eq("id", user!.id)
    .single();

  if (profileError || !profile) throw new Error("Profil tidak ditemukan. Silakan login ulang.");

  const type = formData.get("type") as string;
  const amount = Number(formData.get("amount"));
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;

  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      koperasi_id: profile.koperasi_id,
      type,
      amount,
      description,
      category,
      created_by: profile.id,
      // status default 'pending'; auto-approve di bawah threshold ditangani di bawah.
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    transaction_id: tx.id,
    actor_id: profile.id,
    action: "create",
    note: `Transaksi dicatat oleh ${profile.role}`,
  });

  // Transaksi kecil (di bawah threshold) auto-approved supaya operasional harian tidak macet.
  if (!tx.approval_threshold_hit) {
    const { error: rpcError } = await supabase.rpc("set_transaction_status", {
      tx_id: tx.id,
      new_status: "approved",
    });
    // Jangan gagal-diam: kalau RPC error, transaksi akan "nyangkut" pending -> laporkan.
    if (rpcError) {
      throw new Error(`Auto-approve gagal: ${rpcError.message}`);
    }

    await supabase.from("audit_log").insert({
      transaction_id: tx.id,
      actor_id: profile.id,
      action: "approve",
      note: "Auto-approved: di bawah ambang batas multi-signature",
    });
  }

  revalidateAll();
  redirect("/transactions");
}

export async function submitApproval(transactionId: string, decision: "approve" | "reject") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user!.id)
    .single();

  if (profileError || !profile) throw new Error("Profil tidak ditemukan. Silakan login ulang.");

  const { error: approvalError } = await supabase.from("approvals").insert({
    transaction_id: transactionId,
    approver_id: profile.id,
    decision,
  });
  // Unique constraint (transaction_id, approver_id) mencegah vote ganda -> laporkan bila gagal.
  if (approvalError) throw new Error(`Gagal menyimpan suara: ${approvalError.message}`);

  await supabase.from("audit_log").insert({
    transaction_id: transactionId,
    actor_id: profile.id,
    action: decision === "approve" ? "approve" : "reject",
    note: `Keputusan multi-sig oleh ${profile.role}`,
  });

  // Aturan 2-dari-3: cek total approve/reject, finalisasi status via RPC bila kuorum tercapai.
  const { data: allApprovals } = await supabase
    .from("approvals")
    .select("decision")
    .eq("transaction_id", transactionId);

  const approveCount = allApprovals?.filter((a) => a.decision === "approve").length ?? 0;
  const rejectCount = allApprovals?.filter((a) => a.decision === "reject").length ?? 0;

  if (approveCount >= 2 || rejectCount >= 2) {
    const finalStatus = approveCount >= 2 ? "approved" : "rejected";
    const { error: rpcError } = await supabase.rpc("set_transaction_status", {
      tx_id: transactionId,
      new_status: finalStatus,
    });
    // Inilah penyebab bug utama sebelumnya: error RPC ditelan diam-diam sehingga
    // status di DB tak pernah berubah. Sekarang dilaporkan secara eksplisit.
    if (rpcError) {
      throw new Error(`Finalisasi status (${finalStatus}) gagal: ${rpcError.message}`);
    }
  }

  // Revalidate SEMUA path terkait — sebelumnya /transactions tidak ikut di-revalidate.
  revalidateAll();
}

export async function flagAnomaly(transactionId: string, reason: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user!.id)
    .single();

  if (profileError || !profile) throw new Error("Profil tidak ditemukan. Silakan login ulang.");

  const { error: flagError } = await supabase.from("anomaly_flags").insert({
    transaction_id: transactionId,
    flagged_by: profile.id,
    source: "anggota",
    reason,
  });
  if (flagError) throw new Error(`Gagal menandai anomali: ${flagError.message}`);

  await supabase.from("audit_log").insert({
    transaction_id: transactionId,
    actor_id: profile.id,
    action: "flag_anomaly",
    note: reason,
  });

  revalidatePath("/anomalies");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

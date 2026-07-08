"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PENGURUS_ROLES, TX_CATEGORIES } from "@/lib/types";

/** Revalidate semua halaman yang menampilkan status/saldo/antrian. */
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
  if (!PENGURUS_ROLES.includes(profile.role)) {
    throw new Error("Hanya pengurus (ketua/bendahara/sekretaris) yang dapat mencatat transaksi.");
  }

  const type = formData.get("type") as string;
  const amount = Number(formData.get("amount"));
  const description = (formData.get("description") as string)?.trim();
  const category = formData.get("category") as string;

  if (!["masuk", "keluar"].includes(type)) throw new Error("Jenis transaksi tidak valid.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Jumlah harus lebih dari 0.");
  if (!description) throw new Error("Keterangan wajib diisi.");
  if (!TX_CATEGORIES.includes(category as any)) throw new Error("Kategori tidak valid.");

  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      koperasi_id: profile.koperasi_id,
      type,
      amount,
      description,
      category,
      created_by: profile.id,
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
    if (rpcError) throw new Error(`Auto-approve gagal: ${rpcError.message}`);

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

  // Separation of duties: penginput tidak boleh menyetujui transaksinya sendiri.
  const { data: txRow } = await supabase
    .from("transactions")
    .select("created_by, status")
    .eq("id", transactionId)
    .single();
  if (!txRow) throw new Error("Transaksi tidak ditemukan.");
  if (txRow.created_by === profile.id) {
    throw new Error("Anda mencatat transaksi ini, jadi tidak dapat menyetujuinya sendiri.");
  }
  if (txRow.status !== "pending") {
    throw new Error("Transaksi ini sudah difinalisasi.");
  }

  const { error: approvalError } = await supabase.from("approvals").insert({
    transaction_id: transactionId,
    approver_id: profile.id,
    decision,
  });
  if (approvalError) throw new Error(`Gagal menyimpan suara: ${approvalError.message}`);

  await supabase.from("audit_log").insert({
    transaction_id: transactionId,
    actor_id: profile.id,
    action: decision === "approve" ? "approve" : "reject",
    note: `Keputusan multi-sig oleh ${profile.role}`,
  });

  // Aturan 2-dari-3: finalisasi bila kuorum tercapai.
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
    if (rpcError) throw new Error(`Finalisasi status (${finalStatus}) gagal: ${rpcError.message}`);
  }

  revalidateAll();
}

export async function cancelTransaction(transactionId: string, reason: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = reason?.trim();
  if (!trimmed) throw new Error("Alasan pembatalan wajib diisi (tercatat permanen di audit log).");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user!.id)
    .single();
  if (profileError || !profile) throw new Error("Profil tidak ditemukan. Silakan login ulang.");

  const { error: rpcError } = await supabase.rpc("set_transaction_status", {
    tx_id: transactionId,
    new_status: "cancelled",
  });
  if (rpcError) throw new Error(`Pembatalan gagal: ${rpcError.message}`);

  // Alasan pembatalan tercatat permanen di audit log sebagai bukti (setelah status berubah).
  await supabase.from("audit_log").insert({
    transaction_id: transactionId,
    actor_id: profile.id,
    action: "cancel",
    note: `Dibatalkan oleh ${profile.role}: ${trimmed}`,
  });

  revalidateAll();
}

export async function flagAnomaly(transactionId: string, reason: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = reason?.trim();
  if (!trimmed) throw new Error("Alasan wajib diisi.");

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
    reason: trimmed,
  });
  // RLS akan menolak jika mencoba menandai transaksi sendiri → pesan jelas.
  if (flagError) throw new Error(`Gagal menandai anomali: ${flagError.message}`);

  await supabase.from("audit_log").insert({
    transaction_id: transactionId,
    actor_id: profile.id,
    action: "flag_anomaly",
    note: trimmed,
  });

  revalidateAll();
}

export async function reviewAnomaly(flagId: string, action: "cancel_tx" | "dismiss") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: rpcError } = await supabase.rpc("review_anomaly", {
    flag_id: flagId,
    action,
  });
  if (rpcError) throw new Error(`Peninjauan anomali gagal: ${rpcError.message}`);

  revalidateAll();
}

// Supabase Edge Function: hash-batch
// Dipanggil setelah transaksi dibuat (via DB webhook / manual trigger).
// Menghasilkan hash SHA-256 yang merantai transaksi ini ke transaksi sebelumnya
// (mirip prinsip blockchain sederhana) — begitu satu baris diubah, hash berikutnya tidak akan cocok.
// Ini yang memberi bukti "immutable audit trail" secara kriptografis, bukan cuma janji di DB.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  try {
    const { transaction_id } = await req.json();
    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "transaction_id wajib diisi" }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .single();

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: "Transaksi tidak ditemukan" }), { status: 404 });
    }

    // Ambil hash transaksi sebelumnya dalam koperasi yang sama untuk chaining
    const { data: prevTx } = await supabase
      .from("transactions")
      .select("batch_hash")
      .eq("koperasi_id", tx.koperasi_id)
      .neq("id", tx.id)
      .not("batch_hash", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const prevHash = prevTx?.batch_hash ?? "genesis";

    const payload = JSON.stringify({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      created_by: tx.created_by,
      created_at: tx.created_at,
      prev_hash: prevHash,
    });

    const hash = await sha256(payload);

    const { error: updateError } = await supabase
      .from("transactions")
      .update({ batch_hash: hash })
      .eq("id", transaction_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ hash, prev_hash: prevHash }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

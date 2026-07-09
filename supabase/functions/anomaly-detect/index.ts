// Supabase Edge Function: anomaly-detect
// Dipanggil setelah transaksi baru dibuat. Mengambil histori transaksi koperasi yang sama,
// lalu meminta Claude untuk menilai apakah transaksi baru ini janggal dibanding pola historis
// (nominal, frekuensi, deskripsi/kategori yang tidak biasa). Jika ya, otomatis insert ke anomaly_flags
// dengan source = 'ai', sehingga langsung muncul di Watchdog Dashboard untuk anggota & pengawas.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

serve(async (req) => {
  try {
    const { transaction_id } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tx } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .single();

    if (!tx) {
      return new Response(JSON.stringify({ error: "Transaksi tidak ditemukan" }), { status: 404 });
    }

    // Ambil 30 transaksi terakhir koperasi yang sama sebagai konteks pola normal
    const { data: history } = await supabase
      .from("transactions")
      .select("type, amount, category, description, created_at")
      .eq("koperasi_id", tx.koperasi_id)
      .neq("id", tx.id)
      .order("created_at", { ascending: false })
      .limit(30);

    const prompt = `Kamu adalah sistem deteksi anomali keuangan untuk koperasi desa.
Berikut histori 30 transaksi terakhir koperasi ini (JSON): ${JSON.stringify(history)}

Transaksi BARU yang perlu dinilai: ${JSON.stringify({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description,
    })}

Nilai apakah transaksi baru ini anomali dibanding pola historis (nominal jauh di luar
kebiasaan, kategori/deskripsi tidak wajar, atau frekuensi tidak biasa untuk kategori tersebut).

Jawab HANYA dalam format JSON tanpa teks lain: {"is_anomaly": boolean, "reason": "penjelasan singkat dalam Bahasa Indonesia, maks 2 kalimat"}`;

    // Nama model dibuat konfigurabel lewat env var ANTHROPIC_MODEL agar mudah disesuaikan
    // dengan model yang tersedia di akun Anda tanpa mengubah kode. Default: Claude Sonnet.
    const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    // Jangan gagal diam-diam: kalau API menolak (mis. nama model salah), catat ke log fungsi
    // supaya ketahuan, bukan sekadar dianggap "bukan anomali".
    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error(`Anthropic API error ${claudeResponse.status} (model=${model}): ${errText}`);
      return new Response(
        JSON.stringify({ error: "Analisis AI gagal", status: claudeResponse.status }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeResponse.json();
    const textBlock = claudeData.content?.find((c: any) => c.type === "text")?.text ?? "{}";

    let result;
    try {
      result = JSON.parse(textBlock.replace(/```json|```/g, "").trim());
    } catch {
      result = { is_anomaly: false, reason: "Gagal mem-parsing hasil analisis AI." };
    }

    if (result.is_anomaly) {
      await supabase.from("anomaly_flags").insert({
        transaction_id: tx.id,
        flagged_by: null,
        source: "ai",
        reason: result.reason,
      });

      await supabase.from("audit_log").insert({
        transaction_id: tx.id,
        actor_id: tx.created_by,
        action: "flag_anomaly",
        note: `[AI] ${result.reason}`,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

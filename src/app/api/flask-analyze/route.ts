import { NextRequest, NextResponse } from "next/server";

const FLASK_URL =
  process.env.FLASK_INTERNAL_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_FLASK_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:5000"; // fallback

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // { draft, top_k?, temperature?, max_tokens? }

    const res = await fetch(`${FLASK_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // NOTE: Make sure draft is included; you can pass additional knobs as desired.
      body: JSON.stringify({
        draft: body?.draft || "",
        top_k: body?.top_k ?? 8,
        temperature: body?.temperature ?? 0.3,
        max_tokens: body?.max_tokens ?? 900,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Flask /analyze failed: HTTP ${res.status} ${txt}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    // Expect { ok: true, run_id: "...", ... }
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

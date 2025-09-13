// app/api/scrape-community/route.ts
import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"

function cleanContent(text: string): string {
  const skipPatterns = [
    /!\[.*\]\(.*\)/i,               // images
    /https?:\/\//i,                 // raw URLs
    /Sign up|Subscribe|Newsletter/i,
    /Share|Tweet|Facebook|LinkedIn/i,
    /Cookie|Privacy Policy|Terms/i,
    /Menu|Navigation|Home|About|Contact/i,
    /Copyright|©|\(c\)/i,
    /Advertisement|Sponsored|Ad /i,
    /\.(pdf|jpg|png)\)/i,
    /^[\[\(].*[\]\)]$/i,
    /wp-content|uploads/i,
  ]
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && l.length > 10 && !skipPatterns.some(re => re.test(l)))
    .join("\n")
}

function safeSlug(s: string) {
  return s.replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_").toLowerCase()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const folderName = String(body?.folderName || "").trim()
    const communityDescription = String(body?.communityDescription || "").trim()
    const maxLinksRaw = Number(body?.maxLinks)
    const maxLinks = Number.isFinite(maxLinksRaw) ? Math.max(1, Math.min(25, maxLinksRaw)) : 10

    if (!folderName) {
      return NextResponse.json({ ok: false, error: "folderName is required" }, { status: 400 })
    }
    if (!communityDescription) {
      return NextResponse.json({ ok: false, error: "communityDescription is required" }, { status: 400 })
    }

    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing FIRECRAWL_API_KEY in environment" }, { status: 500 })
    }

    const query = `${communityDescription} demographics community characteristics`

    // Firecrawl v2 /search with scrapeOptions to get markdown/html content
    const fcRes = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: maxLinks,
        sources: ["web"],
        scrapeOptions: {
          formats: ["markdown"],       // prefer markdown if available
          onlyMainContent: true,
          blockAds: true,
          storeInCache: true,
        },
      }),
    })

    if (!fcRes.ok) {
      const txt = await fcRes.text().catch(() => "")
      return NextResponse.json({ ok: false, error: `Firecrawl error ${fcRes.status}: ${txt || "no body"}` }, { status: 502 })
    }

    const payload = await fcRes.json().catch(() => ({} as any))
    const webResults: Array<any> = payload?.data?.web ?? []
    if (!webResults.length) {
      return NextResponse.json({ ok: false, error: "No results found from Firecrawl" }, { status: 404 })
    }

    const cleanedParts: string[] = []
    for (const r of webResults) {
      const md = typeof r?.markdown === "string" ? r.markdown : ""
      const html = typeof r?.html === "string" ? r.html : ""
      const raw = md || html || ""
      if (!raw) continue
      const part = cleanContent(raw)
      if (part) {
        cleanedParts.push(part, "\n\n")
      }
    }

    const combined = cleanedParts.join("").trim()
    if (!combined) {
      return NextResponse.json({ ok: false, error: "Scraped content was empty after cleaning" }, { status: 422 })
    }

    // Ensure save directory: data/<folderName>/
    const dir = path.join(process.cwd(), "backend", "data", folderName)
    await fs.mkdir(dir, { recursive: true })

    const slug = safeSlug(communityDescription)
    const ts = new Date().toISOString().replaceAll(/[:.]/g, "-")
    const outputPath = path.join(dir, `community_${slug}_${ts}.txt`)

    await fs.writeFile(outputPath, combined, "utf-8")

    return NextResponse.json({ ok: true, outputPath })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

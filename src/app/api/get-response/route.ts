import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic' // avoid caching

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folder =
      searchParams.get('communityId') || searchParams.get('communityFolder')
    const artifactNumber = searchParams.get('artifactNumber')

    if (!folder || !artifactNumber) {
      return NextResponse.json(
        { error: 'Community folder and artifact number are required' },
        { status: 400 }
      )
    }

    // Try files in this order
    const filenames = [
      `llmready_${artifactNumber}.json`,  // preferred (EchoDataExtractor output)
      `response_${artifactNumber}.json`,  // optional echo_api_script output
    ]

    // Base: <repo-root>/backend/data/<folder>/
    const baseDir = join(process.cwd(), 'backend', 'data', folder)

    // 1) Try llmready / response
    for (const name of filenames) {
      const p = join(baseDir, name)
      try {
        const content = await readFile(p, 'utf8')
        const parsed = JSON.parse(content)
        return NextResponse.json({ success: true, data: parsed, found: true })
      } catch (_) {
        // ignore and try next
      }
    }

    // 2) If rag exists but post-processing not done yet, surface a nicer message
    const ragPath = join(baseDir, `rag_${artifactNumber}.json`)
    try {
      await stat(ragPath)
      return NextResponse.json({
        success: true,
        data: null,
        found: false,
        message:
          'Analysis file created; post-processing still running. Your report will appear shortly.',
      })
    } catch {
      // rag not there yet either
    }

    // Nothing found
    return NextResponse.json({
      success: true,
      data: null,
      found: false,
      message: 'Response file not found — analysis may still be processing',
    })
  } catch (error) {
    console.error('Error reading response file:', error)
    return NextResponse.json(
      { error: 'Failed to read response file' },
      { status: 500 }
    )
  }
}

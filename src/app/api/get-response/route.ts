import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join, resolve, basename } from 'path'

export const dynamic = 'force-dynamic' // avoid caching

// Sanitize path components to prevent path traversal attacks
function sanitizePath(input: string): string {
  // Remove any path traversal attempts and get only the base name
  return basename(input).replace(/[^a-zA-Z0-9_\-\.]/g, '_')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawFolder =
      searchParams.get('communityId') || searchParams.get('communityFolder')
    const rawArtifactNumber = searchParams.get('artifactNumber')

    if (!rawFolder || !rawArtifactNumber) {
      return NextResponse.json(
        { error: 'Community folder and artifact number are required' },
        { status: 400 }
      )
    }

    // Sanitize inputs to prevent path traversal
    const folder = sanitizePath(rawFolder)
    const artifactNumber = sanitizePath(rawArtifactNumber)

    // Validate artifact number is numeric
    if (!/^\d+$/.test(artifactNumber)) {
      return NextResponse.json(
        { error: 'Artifact number must be numeric' },
        { status: 400 }
      )
    }

    // Try files in this order
    const filenames = [
      `llmready_${artifactNumber}.json`,  // preferred (EchoDataExtractor output)
      `response_${artifactNumber}.json`,  // optional echo_api_script output
    ]

    // Base: <repo-root>/backend/data/<folder>/
    const dataRoot = resolve(process.cwd(), 'backend', 'data')
    const baseDir = join(dataRoot, folder)

    // Ensure the resolved path is still within dataRoot (defense in depth)
    if (!resolve(baseDir).startsWith(dataRoot)) {
      return NextResponse.json(
        { error: 'Invalid folder path' },
        { status: 400 }
      )
    }

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

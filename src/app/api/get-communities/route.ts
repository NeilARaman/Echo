import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const communitiesPath = join(process.cwd(), 'backend', 'data', 'communities')
    
    const files = await readdir(communitiesPath)
    const txtFiles = files.filter(file => file.endsWith('.txt'))
    
    const communities = await Promise.all(
      txtFiles.map(async (filename) => {
        const filePath = join(communitiesPath, filename)
        const content = await readFile(filePath, 'utf8')
        return {
          id: filename.replace('.txt', ''),
          filename,
          content: content.trim()
        }
      })
    )
    
    return NextResponse.json({ communities })
  } catch (error) {
    console.error('Error reading community files:', error)
    return NextResponse.json(
      { error: 'Failed to read community files' },
      { status: 500 }
    )
  }
}
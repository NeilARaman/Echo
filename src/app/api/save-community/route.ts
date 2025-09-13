import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { mkdir, writeFile } from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const { folderName, filename, content } = await request.json()

    if (!folderName || !filename || !content) {
      return NextResponse.json(
        { error: 'Folder name, filename, and content are required' },
        { status: 400 }
      )
    }

    const folderPath = join(process.cwd(), 'backend', 'data', folderName)
    await mkdir(folderPath, { recursive: true })

    const filePath = join(folderPath, filename)
    await writeFile(filePath, content, 'utf8')

    return NextResponse.json({ success: true, folderName, filename })
  } catch (error) {
    console.error('Error saving community file:', error)
    return NextResponse.json(
      { error: 'Failed to save community file' },
      { status: 500 }
    )
  }
}
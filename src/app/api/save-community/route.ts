import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { filename, content } = await request.json()
    
    if (!filename || !content) {
      return NextResponse.json(
        { error: 'Filename and content are required' },
        { status: 400 }
      )
    }
    
    const filePath = join(process.cwd(), 'backend', 'data', 'communities', filename)
    
    await writeFile(filePath, content, 'utf8')
    
    return NextResponse.json({ success: true, filename })
  } catch (error) {
    console.error('Error saving community file:', error)
    return NextResponse.json(
      { error: 'Failed to save community file' },
      { status: 500 }
    )
  }
}
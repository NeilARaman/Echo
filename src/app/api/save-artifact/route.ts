import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { communityId, content } = await request.json()
    
    if (!communityId || !content) {
      return NextResponse.json(
        { error: 'Community ID and content are required' },
        { status: 400 }
      )
    }
    
    const communityFolderPath = join(process.cwd(), 'backend', 'data', communityId)
    
    // Create community folder if it doesn't exist
    try {
      await mkdir(communityFolderPath, { recursive: true })
    } catch (error) {
      // Folder might already exist, that's okay
    }
    
    // Find the next artifact number
    let artifactNumber = 1
    try {
      const existingFiles = await readdir(communityFolderPath)
      const artifactFiles = existingFiles.filter(file => file.startsWith('artifact_') && file.endsWith('.txt'))
      
      if (artifactFiles.length > 0) {
        const numbers = artifactFiles.map(file => {
          const match = file.match(/artifact_(\d+)\.txt/)
          return match ? parseInt(match[1]) : 0
        })
        artifactNumber = Math.max(...numbers) + 1
      }
    } catch (error) {
      // Directory might not exist yet, start with 1
    }
    
    const filename = `artifact_${artifactNumber}.txt`
    const filePath = join(communityFolderPath, filename)
    
    await writeFile(filePath, content, 'utf8')
    
    return NextResponse.json({ 
      success: true, 
      filename,
      artifactNumber,
      communityId
    })
  } catch (error) {
    console.error('Error saving artifact file:', error)
    return NextResponse.json(
      { error: 'Failed to save artifact file' },
      { status: 500 }
    )
  }
}
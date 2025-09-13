import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const artifactNumber = searchParams.get('artifactNumber')
    
    if (!communityId || !artifactNumber) {
      return NextResponse.json(
        { error: 'Community ID and artifact number are required' },
        { status: 400 }
      )
    }
    
    const responseFileName = `response_${artifactNumber}.json`
    const responseFilePath = join(process.cwd(), 'backend', 'data', communityId, responseFileName)
    
    try {
      const responseData = await readFile(responseFilePath, 'utf8')
      const parsedData = JSON.parse(responseData)
      
      return NextResponse.json({
        success: true,
        data: parsedData,
        found: true
      })
    } catch (error) {
      // File doesn't exist or is malformed
      return NextResponse.json({
        success: true,
        data: null,
        found: false,
        message: 'Response file not found - analysis may still be processing'
      })
    }
    
  } catch (error) {
    console.error('Error reading response file:', error)
    return NextResponse.json(
      { error: 'Failed to read response file' },
      { status: 500 }
    )
  }
}
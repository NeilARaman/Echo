import { NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const dataPath = join(process.cwd(), 'backend', 'data')
    
    const items = await readdir(dataPath)
    
    const communities = await Promise.all(
      items.map(async (item) => {
        try {
          const itemPath = join(dataPath, item)
          const itemStat = await stat(itemPath)
          
          // Check if it's a directory and starts with expected pattern
          if (itemStat.isDirectory()) {
            const descriptionPath = join(itemPath, 'description.txt')
            try {
              const content = await readFile(descriptionPath, 'utf8')
              return {
                id: item,
                folderName: item,
                content: content.trim()
              }
            } catch (error) {
              // description.txt doesn't exist in this folder, skip it
              return null
            }
          }
          return null
        } catch (error) {
          return null
        }
      })
    )
    
    // Filter out null values
    const validCommunities = communities.filter(community => community !== null)
    
    return NextResponse.json({ communities: validCommunities })
  } catch (error) {
    console.error('Error reading community folders:', error)
    return NextResponse.json(
      { error: 'Failed to read community folders' },
      { status: 500 }
    )
  }
}
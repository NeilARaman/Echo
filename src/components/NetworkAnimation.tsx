"use client"

import React, { useEffect, useState } from 'react'

interface Node {
  id: number
  x: number
  y: number
}

interface Connection {
  id: string
  from: number
  to: number
}

interface AnimatedBall {
  connectionId: string
  progress: number
  startTime: number
  duration: number
}

interface NetworkAnimationProps {
  onComplete: () => void
}

export default function NetworkAnimation({ onComplete }: NetworkAnimationProps) {
  const [nodes] = useState<Node[]>(() => {
    // Generate 10 nodes in a circular pattern with some randomization
    const nodeCount = 10
    const centerX = 200
    const centerY = 200
    const radius = 120
    
    return Array.from({ length: nodeCount }, (_, i) => {
      const angle = (i / nodeCount) * 2 * Math.PI
      const randomOffset = (Math.random() - 0.5) * 40
      return {
        id: i,
        x: centerX + Math.cos(angle) * (radius + randomOffset),
        y: centerY + Math.sin(angle) * (radius + randomOffset)
      }
    })
  })

  const [connections] = useState<Connection[]>(() => {
    // Generate persistent connections between nodes
    const newConnections: Connection[] = []
    
    // Create some random connections between nodes
    for (let i = 0; i < 15; i++) {
      const from = Math.floor(Math.random() * nodes.length)
      let to = Math.floor(Math.random() * nodes.length)
      while (to === from) {
        to = Math.floor(Math.random() * nodes.length)
      }
      
      newConnections.push({
        id: `conn-${i}`,
        from,
        to
      })
    }
    
    return newConnections
  })

  const [animatedBalls, setAnimatedBalls] = useState<AnimatedBall[]>([])

  useEffect(() => {
    let animationFrame: number

    const spawnBall = () => {
      if (connections.length === 0) return
      
      const connection = connections[Math.floor(Math.random() * connections.length)]
      const duration = 1500 + Math.random() * 1000 // 1.5-2.5 seconds
      
      const newBall: AnimatedBall = {
        connectionId: connection.id,
        progress: 0,
        startTime: Date.now(),
        duration
      }
      
      setAnimatedBalls(prev => [...prev, newBall])
    }

    const animate = () => {
      const currentTime = Date.now()
      
      setAnimatedBalls(prev => {
        return prev
          .map(ball => {
            const elapsed = currentTime - ball.startTime
            const progress = Math.min(elapsed / ball.duration, 1)
            return { ...ball, progress }
          })
          .filter(ball => ball.progress < 1) // Remove completed balls
      })
      
      // Randomly spawn new balls
      if (Math.random() < 0.15) { // 15% chance each frame
        spawnBall()
      }
      
      animationFrame = requestAnimationFrame(animate)
    }

    // Start spawning balls immediately
    spawnBall()
    spawnBall()
    spawnBall()
    
    animate()
    
    // Complete animation after 5 seconds
    const timeout = setTimeout(() => {
      cancelAnimationFrame(animationFrame)
      onComplete()
    }, 5000)

    return () => {
      cancelAnimationFrame(animationFrame)
      clearTimeout(timeout)
    }
  }, [connections, onComplete])

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-center mb-2">
          Simulating Community Reception
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Virtual agents are analyzing your content...
        </p>
      </div>
      
      <div className="relative">
        <svg width="400" height="400" className="overflow-visible">
          {/* Render persistent connection lines */}
          {connections.map((conn) => {
            const fromNode = nodes[conn.from]
            const toNode = nodes[conn.to]
            
            const dx = toNode.x - fromNode.x
            const dy = toNode.y - fromNode.y
            const length = Math.sqrt(dx * dx + dy * dy)
            const unitX = dx / length
            const unitY = dy / length
            
            const startX = fromNode.x + unitX * 8
            const startY = fromNode.y + unitY * 8
            const endX = toNode.x - unitX * 8
            const endY = toNode.y - unitY * 8
            
            return (
              <line
                key={conn.id}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
            )
          })}
          
          {/* Render animated balls */}
          {animatedBalls.map((ball, index) => {
            const connection = connections.find(c => c.id === ball.connectionId)
            if (!connection) return null
            
            const fromNode = nodes[connection.from]
            const toNode = nodes[connection.to]
            
            const dx = toNode.x - fromNode.x
            const dy = toNode.y - fromNode.y
            const length = Math.sqrt(dx * dx + dy * dy)
            const unitX = dx / length
            const unitY = dy / length
            
            const startX = fromNode.x + unitX * 8
            const startY = fromNode.y + unitY * 8
            const endX = toNode.x - unitX * 8
            const endY = toNode.y - unitY * 8
            
            // Smooth easing function
            const easeProgress = ball.progress < 0.5 
              ? 2 * ball.progress * ball.progress 
              : 1 - Math.pow(-2 * ball.progress + 2, 3) / 2
            
            const currentX = startX + (endX - startX) * easeProgress
            const currentY = startY + (endY - startY) * easeProgress
            
            return (
              <circle
                key={`ball-${ball.connectionId}-${index}`}
                cx={currentX}
                cy={currentY}
                r="3"
                fill="#64748b"
                opacity="0.8"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(100, 116, 139, 0.4))'
                }}
              />
            )
          })}
          
          {/* Render nodes */}
          {nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r="8"
              fill="#94a3b8"
              stroke="#e2e8f0"
              strokeWidth="2"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(148, 163, 184, 0.3))'
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}
"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Target, TrendingUp, Users, MessageSquare } from "lucide-react"

interface Risk {
  risk: string
  severity: number
  mitigation: string
}

interface ResultData {
  executive_summary: {
    overall_readiness_score: string
    key_findings: string[]
    top_priority: string
  }
  key_insights: {
    most_common_suggestions: string
    quickest_wins: string[]
    primary_risks: {
      summary: string
      top_risks: Risk[]
    }
    focus_area: string
    agent_perspectives: {
      highest_rated: string
      lowest_rated: string
    }
    predicted_discussion: string
  }
}

interface ResultDisplayProps {
  data: ResultData
  onNewTest: () => void
  isTemplate?: boolean
  message?: string
}

export default function ResultDisplay({ data, onNewTest, isTemplate, message }: ResultDisplayProps) {
  const scoreValue = parseFloat(data.executive_summary.overall_readiness_score.split('/')[0])
  const scoreColor = scoreValue >= 8 ? 'text-green-600' : scoreValue >= 6 ? 'text-yellow-600' : 'text-red-600'
  const scoreBg = scoreValue >= 8 ? 'bg-green-50 border-green-200' : scoreValue >= 6 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'

  return (
    <div className="space-y-6">
      {/* Template Warning */}
      {isTemplate && message && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-700 font-medium">Template Results</p>
          <p className="text-xs text-blue-600 mt-1">{message}</p>
        </div>
      )}
      
      {/* Header with Score */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Community Reception Analysis</h2>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${scoreBg}`}>
          <Target className="h-5 w-5" />
          <span className="text-sm font-medium">Readiness Score:</span>
          <span className={`text-xl font-bold ${scoreColor}`}>
            {data.executive_summary.overall_readiness_score}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-sm text-muted-foreground">Key Findings</h4>
            <ul className="space-y-2">
              {data.executive_summary.key_findings.map((finding, index) => (
                <li key={index} className="text-sm border-l-2 border-blue-200 pl-3">
                  {finding}
                </li>
              ))}
            </ul>
          </div>
          
          {data.executive_summary.top_priority && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium mb-1 text-sm text-amber-800 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Top Priority Action
              </h4>
              <p className="text-sm text-amber-700">{data.executive_summary.top_priority}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Insights Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Quick Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.key_insights.quickest_wins.map((win, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  {win}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Primary Risks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Primary Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{data.key_insights.primary_risks.summary}</p>
            <div className="space-y-2">
              {data.key_insights.primary_risks.top_risks.slice(0, 2).map((risk, index) => (
                <div key={index} className="p-2 bg-red-50 border border-red-100 rounded">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-red-800">{risk.risk}</span>
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      {risk.severity}/10
                    </Badge>
                  </div>
                  <p className="text-xs text-red-700">{risk.mitigation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Common Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Common Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.key_insights.most_common_suggestions}</p>
          </CardContent>
        </Card>

        {/* Focus Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Improvement Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.key_insights.focus_area}</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Perspectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-purple-600" />
            Agent Perspectives
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-sm text-green-800 mb-1">Highest Rated</h4>
            <p className="text-sm text-green-700">{data.key_insights.agent_perspectives.highest_rated}</p>
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-sm text-orange-800 mb-1">Needs Attention</h4>
            <p className="text-sm text-orange-700">{data.key_insights.agent_perspectives.lowest_rated}</p>
          </div>
        </CardContent>
      </Card>

      {/* Predicted Discussion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            Predicted Community Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.key_insights.predicted_discussion}</p>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onNewTest}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Test Another Article
        </button>
      </div>
    </div>
  )
}
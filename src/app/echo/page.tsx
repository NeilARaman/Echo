"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import NetworkAnimation from "@/components/NetworkAnimation"
import ResultDisplay from "@/components/ResultDisplay"

type Community = { id: string; folderName: string; content: string }

const FLASK_BASE =
  (process.env.NEXT_PUBLIC_FLASK_BASE_URL?.replace(/\/+$/, "") ||
    "http://127.0.0.1:5000")

const POLL_INTERVAL_MS = 1500
const MAX_POLL_MS = 60_000 // stop after 60s and show template/fallback

export default function EchoPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [communityDescription, setCommunityDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null)

  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)
  const [loadingCommunities, setLoadingCommunities] = useState(true)

  const [draftText, setDraftText] = useState("")
  const [isSimulating, setIsSimulating] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [resultData, setResultData] = useState<any>(null)
  const [loadingResults, setLoadingResults] = useState(false)

  const [currentArtifactNumber, setCurrentArtifactNumber] = useState<number | null>(null)

  const pollTimer = useRef<NodeJS.Timeout | null>(null)

  // ---------- helpers ----------
  const safeCommunities = useMemo(() => communities ?? [], [communities])

  const templateResultData = useMemo(() => ({
    executive_summary: {
      overall_readiness_score: "6.36/10",
      key_findings: [
        "The article provides a nuanced, data-driven analysis of millennial political perspectives and policy preferences, highlighting their pragmatic, evidence-based approach to local governance.",
        "There is a need to address potential overgeneralization of millennial political views and ensure policy interventions accommodate the internal diversity within this generation.",
        "The article demonstrates significant potential for data-driven, equity-focused policy development that can directly improve residents' lived experiences."
      ],
      top_priority:
        "Mitigate the risk of overgeneralizing millennial political perspectives by incorporating more explicit caveats about demographic variations and designing flexible policy approaches.",
    },
    key_insights: {
      most_common_suggestions:
        "The dominant themes in the consensus suggestions are around incorporating more quantitative data, designing specific and measurable policy interventions, and developing flexible, equity-driven frameworks that address intersectional challenges.",
      quickest_wins: [
        "Include more quantitative data about millennial voting patterns and political engagement",
        "Develop h2/h3 outline focusing on: policy pragmatism, local innovation, equity-driven solutions",
      ],
      primary_risks: {
        summary:
          "The primary risks identified are around the potential for overgeneralizing millennial political perspectives and underestimating the internal diversity within this generation's political views.",
        top_risks: [
          {
            risk: "Overgeneralizing millennial political perspectives",
            severity: 7,
            mitigation: "Use nuanced demographic research; avoid blanket statements",
          },
          {
            risk: "Overestimating millennial voting bloc homogeneity",
            severity: 7,
            mitigation: "Design flexible policy approaches accommodating diverse perspectives",
          },
        ],
      },
      focus_area:
        "Improving the 'risk' category score by addressing potential overgeneralization and ensuring policy interventions accommodate diverse millennial perspectives.",
      agent_perspectives: {
        highest_rated:
          "The 'Fact Checker' agent has the highest average score of 7.6, likely due to strong performance in clarity, accuracy, and engagement.",
        lowest_rated:
          "The 'Copy & Clarity Editor' and 'SEO & Discoverability' agents have the lowest average score of 7.2, likely due to relatively lower scores in novelty and risk.",
      },
      predicted_discussion:
        "The audience discussion indicates broad support for the article's pragmatic, data-driven approach to policy development, particularly in areas like climate resilience, housing, and civic technology, while raising concerns about implementation complexity and resource constraints.",
    },
  }), [])

  // ---------- server calls ----------
  const fetchCommunities = async () => {
    setLoadingCommunities(true)
    try {
      const res = await fetch("/api/get-communities", { method: "GET" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: Community[] = Array.isArray(data?.communities) ? data.communities : []
      setCommunities(list)
    } catch (err) {
      console.error("Error fetching communities:", err)
      setCommunities([])
    } finally {
      setLoadingCommunities(false)
    }
  }

  const triggerScrape = async (folderName: string, description: string) => {
    setScrapeStatus("Scraping…")
    try {
      const res = await fetch("/api/scrape-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, communityDescription: description, maxLinks: 10 }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        setScrapeStatus(`Scrape failed: ${json?.error ?? `HTTP ${res.status}`}`)
        return
      }
      setScrapeStatus(`Scrape complete → ${json.outputPath ?? `(saved under ${folderName})`}`)
    } catch (e: any) {
      setScrapeStatus(`Scrape error: ${String(e)}`)
    }
  }

  const handleSaveCommunity = async () => {
    if (!communityDescription.trim()) return
    setIsLoading(true)
    setScrapeStatus(null)
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const folderName = `community_${timestamp}`
      const filename = "description.txt"

      const res = await fetch("/api/save-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, filename, content: communityDescription }),
      })
      if (!res.ok) throw new Error("Failed to save community")

      await triggerScrape(folderName, communityDescription)

      setCommunityDescription("")
      setIsDialogOpen(false)
      await fetchCommunities()
    } catch (err) {
      console.error("Error saving community:", err)
      setScrapeStatus(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Fire-and-forget: tell Flask to run RAG; Flask should write rag_{artifact}.json
const startFlaskRag = async (artifactNumber: number, draft: string, communityFolder: string) => {
  try {
    await fetch(`${FLASK_BASE}/analyze`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft,
        artifact_number: artifactNumber,
        communityId: communityFolder, // <- this is the folder on disk
      }),
    })
  } catch (e) {
    console.error("Flask analyze error:", e)
  }
}


  const handleSimulate = async () => {
    if (!selectedCommunity || !draftText.trim()) return
    setIsSimulating(true)
    try {
      // 1) Save artifact under the selected community; expect { artifactNumber }
      const res = await fetch("/api/save-artifact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: selectedCommunity, content: draftText }),
      })
      if (!res.ok) throw new Error("Failed to save artifact")
      const data = await res.json().catch(() => ({} as any))
      const artifactNumber: number = data?.artifactNumber ?? data?.artifact ?? null
      if (artifactNumber == null) throw new Error("No artifact number returned")

      setCurrentArtifactNumber(artifactNumber)

      const selected = safeCommunities.find(c => c.id === selectedCommunity)
      const communityFolder = selected?.folderName || selectedCommunity!
      void startFlaskRag(artifactNumber, draftText, communityFolder)

      // 3) Show animation while RAG runs
      setShowAnimation(true)
    } catch (err) {
      console.error("Error saving artifact or starting RAG:", err)
      setIsSimulating(false)
      alert(String(err))
    }
  }

  // After animation finishes, poll for rag_{artifact}.json via Next route
  const handleAnimationComplete = async () => {
    setShowAnimation(false)
    setLoadingResults(true)

    const started = Date.now()
    const pollOnce = async () => {
      if (!selectedCommunity || currentArtifactNumber == null) return { found: false }

      // 👇 use folderName, not id
      const selected = safeCommunities.find(c => c.id === selectedCommunity)
      const communityFolder = selected?.folderName || selectedCommunity

      const url = `/api/get-response?communityId=${encodeURIComponent(
        communityFolder
      )}&artifactNumber=${encodeURIComponent(currentArtifactNumber)}`

      try {
        const res = await fetch(url, { method: "GET" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return data
      } catch (e) {
        console.error("Polling error:", e)
        return { success: false, found: false, message: String(e) }
      }
    }

    const doPoll = async (): Promise<any> => {
      while (Date.now() - started < MAX_POLL_MS) {
        const result = await pollOnce()
        if (result?.success && result?.found && result?.data) return result
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
      return null
    }

    try {
      const result = await doPoll()
      if (result?.success && result?.found && result?.data) {
        setResultData(result.data)
        setShowResults(true)
      } else {
        // Fallback: show template with a friendly message
        setResultData({
          ...templateResultData,
          _isTemplate: true,
          _message:
            result?.message ||
            "Analysis is still processing… your report will appear once it’s ready.",
        })
        setShowResults(true)
      }
    } finally {
      setLoadingResults(false)
      setIsSimulating(false)
    }
  }

  const handleNewTest = () => {
    setShowResults(false)
    setDraftText("")
    setSelectedCommunity(null)
    setResultData(null)
    setCurrentArtifactNumber(null)
    if (pollTimer.current) {
      clearTimeout(pollTimer.current)
      pollTimer.current = null
    }
  }

  useEffect(() => {
    fetchCommunities()
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Echo Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your target communities and test how your content will be received
          </p>
        </div>

        {/* Communities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Target Communities</CardTitle>
            <CardDescription>Add communities where you want to test your content reception</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCommunities ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading communities...</div>
              </div>
            ) : safeCommunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 p-3 rounded-full bg-muted">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No communities added yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start by adding your first target community to begin testing content reception
                </p>
              </div>
            ) : (
              <div className="grid gap-3 mb-6">
                {safeCommunities.map((community) => (
                  <div
                    key={community.id}
                    onClick={() =>
                      setSelectedCommunity(
                        selectedCommunity === community.id ? null : community.id
                      )
                    }
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedCommunity === community.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border"
                    }`}
                  >
                    <p className="text-sm">{community.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Folder: {community.folderName}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {isLoading && <div className="text-sm text-muted-foreground mb-2">Saving…</div>}
            {scrapeStatus && <div className="text-sm">{scrapeStatus}</div>}

            <div className="flex justify-center">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Community
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Target Community</DialogTitle>
                    <DialogDescription>
                      Describe the community where you want to test your content reception.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="e.g., Tech enthusiasts on Reddit who are interested in AI and machine learning..."
                      value={communityDescription}
                      onChange={(e) => setCommunityDescription(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveCommunity}
                      disabled={!communityDescription.trim() || isLoading}
                    >
                      {isLoading ? "Saving..." : "Save & Scrape"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Draft Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Test Draft Article</CardTitle>
            <CardDescription>See how your draft content will be received by your target communities</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingResults ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading analysis results...</p>
              </div>
            ) : showResults && resultData ? (
              <ResultDisplay
                data={resultData}
                onNewTest={handleNewTest}
                isTemplate={Boolean(resultData._isTemplate)}
                message={resultData._message}
              />
            ) : showAnimation ? (
              <NetworkAnimation onComplete={handleAnimationComplete} />
            ) : !selectedCommunity ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 p-3 rounded-full bg-muted">
                  <div className="h-6 w-6 text-muted-foreground">📝</div>
                </div>
                <h3 className="text-lg font-medium mb-2">Ready to test your content?</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Select a community above to begin testing your draft content
                </p>
                <Button variant="outline" disabled>
                  Test Draft Article
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Select a community first</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Draft Article Content</label>
                  <Textarea
                    placeholder="Paste or type your draft article content here..."
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={8}
                    className="min-h-[200px]"
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={handleSimulate}
                    disabled={!draftText.trim() || isSimulating}
                    className="px-8"
                  >
                    {isSimulating ? "Saving Artifact..." : "Simulate Reception"}
                  </Button>
                </div>
                {!draftText.trim() && (
                  <p className="text-xs text-muted-foreground text-center">
                    Enter draft content to simulate reception
                  </p>
                )}
                {isSimulating && !showAnimation && (
                  <p className="text-xs text-muted-foreground text-center">
                    Saving your artifact...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

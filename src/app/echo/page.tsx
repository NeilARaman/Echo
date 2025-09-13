"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

export default function EchoPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [communityDescription, setCommunityDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [communities, setCommunities] = useState<Array<{id: string, filename: string, content: string}>>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)
  const [loadingCommunities, setLoadingCommunities] = useState(true)
  const [draftText, setDraftText] = useState("")
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSaveCommunity = async () => {
    if (!communityDescription.trim()) return
    
    setIsLoading(true)
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `community_${timestamp}.txt`
      
      const response = await fetch('/api/save-community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          content: communityDescription
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save community')
      }
      
      setCommunityDescription("")
      setIsDialogOpen(false)
      fetchCommunities() // Refresh the communities list
    } catch (error) {
      console.error('Error saving community:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/get-communities')
      if (response.ok) {
        const data = await response.json()
        setCommunities(data.communities)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setLoadingCommunities(false)
    }
  }

  const handleSimulate = async () => {
    if (!selectedCommunity || !draftText.trim()) return
    
    setIsSimulating(true)
    try {
      const response = await fetch('/api/save-artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityId: selectedCommunity,
          content: draftText
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save artifact')
      }
      
      const data = await response.json()
      console.log('Artifact saved:', data)
      
      // Clear the draft text after successful save
      setDraftText("")
    } catch (error) {
      console.error('Error saving artifact:', error)
    } finally {
      setIsSimulating(false)
    }
  }

  useEffect(() => {
    fetchCommunities()
  }, [])
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Echo Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your target communities and test how your content will be received
          </p>
        </div>

        {/* Communities Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Target Communities</CardTitle>
            <CardDescription>
              Add communities where you want to test your content reception
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCommunities ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading communities...</div>
              </div>
            ) : communities.length === 0 ? (
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
                {communities.map((community) => (
                  <div
                    key={community.id}
                    onClick={() => setSelectedCommunity(selectedCommunity === community.id ? null : community.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedCommunity === community.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border'
                    }`}
                  >
                    <p className="text-sm">{community.content}</p>
                  </div>
                ))}
              </div>
            )}
            
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
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveCommunity}
                      disabled={!communityDescription.trim() || isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Community"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Draft Testing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Draft Article</CardTitle>
            <CardDescription>
              See how your draft content will be received by your target communities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCommunity ? (
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
                <p className="text-xs text-muted-foreground mt-2">
                  Select a community first
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Draft Article Content
                  </label>
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
                {isSimulating && (
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
  );
}
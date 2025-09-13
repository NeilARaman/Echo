import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

export default function EchoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 p-3 rounded-full bg-muted">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No communities added yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Start by adding your first target community to begin testing content reception
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Community
              </Button>
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 p-3 rounded-full bg-muted">
                <div className="h-6 w-6 text-muted-foreground">📝</div>
              </div>
              <h3 className="text-lg font-medium mb-2">Ready to test your content?</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Upload a draft article and see how it will be received by your communities
              </p>
              <Button variant="outline" disabled>
                Test Draft Article
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Add at least one community first
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
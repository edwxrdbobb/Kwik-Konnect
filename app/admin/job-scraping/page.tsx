"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  Briefcase, 
  MapPin, 
  Clock, 
  ExternalLink,
  Linkedin,
  Globe,
  Trash2,
  Eye
} from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { useToast } from "@/hooks/use-toast"

interface ScrapedJob {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  skills: string[]
  postedAt: string
  description: string
  url: string
  source: "linkedin" | "careersl"
  scraped_at: string
  status: string
}

export default function JobScrapingPage() {
  const [jobs, setJobs] = useState<ScrapedJob[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("scrape")
  const [scrapeConfig, setScrapeConfig] = useState({
    keywords: "",
    location: "Sierra Leone",
    limit: 20,
    source: "all"
  })
  const [filterConfig, setFilterConfig] = useState({
    source: "all",
    location: "",
    keywords: ""
  })
  const { toast } = useToast()

  const handleScrapeJobs = async (source: "linkedin" | "careersl" | "all") => {
    setLoading(true)
    try {
      const endpoints = source === "all" 
        ? ["/api/scrape-jobs/linkedin", "/api/scrape-jobs/careersl"]
        : [`/api/scrape-jobs/${source}`]

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scrapeConfig)
          })
          return response.json()
        })
      )

      const allJobs = results.flatMap(result => result.jobs || [])
      setJobs(prevJobs => {
        const newJobs = allJobs.filter((job: ScrapedJob) => 
          !prevJobs.some(prevJob => prevJob.id === job.id)
        )
        return [...newJobs, ...prevJobs]
      })

      const totalSaved = results.reduce((sum, result) => sum + (result.saved || 0), 0)
      toast({
        title: "Scraping Complete!",
        description: `Successfully scraped and saved ${totalSaved} new jobs from ${source}.`
      })
    } catch (error: any) {
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to scrape jobs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoadJobs = async () => {
    setLoading(true)
    try {
      const [linkedinResponse, careerslResponse] = await Promise.all([
        fetch("/api/scrape-jobs/linkedin"),
        fetch("/api/scrape-jobs/careersl")
      ])

      const linkedinJobs = await linkedinResponse.json()
      const careerslJobs = await careerslResponse.json()

      const allJobs = [...(linkedinResponse.ok ? linkedinJobs.jobs || [] : []), 
                      ...(careerslResponse.ok ? careerslJobs.jobs || [] : [])]
      
      setJobs(allJobs)
    } catch (error: any) {
      toast({
        title: "Failed to Load Jobs",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filterConfig.source !== "all" && job.source !== filterConfig.source) return false
    if (filterConfig.location && !job.location.toLowerCase().includes(filterConfig.location.toLowerCase())) return false
    if (filterConfig.keywords) {
      const searchTerms = filterConfig.keywords.toLowerCase().split(' ')
      return searchTerms.some(term => 
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.skills.some(skill => skill.toLowerCase().includes(term))
      )
    }
    return true
  })

  const getSourceIcon = (source: string) => {
    return source === "linkedin" ? <Linkedin className="h-4 w-4" /> : <Globe className="h-4 w-4" />
  }

  const getSourceColor = (source: string) => {
    return source === "linkedin" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold sm:text-3xl">Job Scraping Management</h1>
            <p className="mt-1 text-muted-foreground">
              Scrape and manage jobs from LinkedIn and career.sl
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="scrape">Scrape Jobs</TabsTrigger>
              <TabsTrigger value="manage">Manage Jobs</TabsTrigger>
              <TabsTrigger value="logs">Scraping Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="scrape" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                {/* Scraping Configuration */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Scraping Configuration</CardTitle>
                      <CardDescription>
                        Configure and start job scraping from external sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (Optional)</Label>
                        <Input
                          id="keywords"
                          placeholder="e.g., software engineer, marketing"
                          value={scrapeConfig.keywords}
                          onChange={(e) => setScrapeConfig(prev => ({ ...prev, keywords: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Sierra Leone"
                          value={scrapeConfig.location}
                          onChange={(e) => setScrapeConfig(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="limit">Number of Jobs</Label>
                        <Select value={scrapeConfig.limit.toString()} onValueChange={(value) => setScrapeConfig(prev => ({ ...prev, limit: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 jobs</SelectItem>
                            <SelectItem value="20">20 jobs</SelectItem>
                            <SelectItem value="50">50 jobs</SelectItem>
                            <SelectItem value="100">100 jobs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Scraping Actions</Label>
                        <div className="grid gap-2">
                          <Button
                            onClick={() => handleScrapeJobs("linkedin")}
                            disabled={loading}
                            className="gap-2"
                          >
                            <Linkedin className="h-4 w-4" />
                            {loading ? "Scraping LinkedIn..." : "Scrape LinkedIn Jobs"}
                          </Button>
                          <Button
                            onClick={() => handleScrapeJobs("careersl")}
                            disabled={loading}
                            variant="outline"
                            className="gap-2"
                          >
                            <Globe className="h-4 w-4" />
                            {loading ? "Scraping career.sl..." : "Scrape career.sl Jobs"}
                          </Button>
                          <Button
                            onClick={() => handleScrapeJobs("all")}
                            disabled={loading}
                            variant="secondary"
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            {loading ? "Scraping All..." : "Scrape All Sources"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-500">
                            {jobs.filter(j => j.source === "linkedin").length}
                          </div>
                          <div className="text-sm text-muted-foreground">LinkedIn Jobs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {jobs.filter(j => j.source === "careersl").length}
                          </div>
                          <div className="text-sm text-muted-foreground">career.sl Jobs</div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="text-center">
                          <div className="text-3xl font-bold">{jobs.length}</div>
                          <div className="text-sm text-muted-foreground">Total Jobs</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last scrape:</span>
                          <span>Just now</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className="bg-green-500/10 text-green-500">Ready</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Select value={filterConfig.source} onValueChange={(value) => setFilterConfig(prev => ({ ...prev, source: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="careersl">career.sl</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="Filter by location"
                        value={filterConfig.location}
                        onChange={(e) => setFilterConfig(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Keywords</Label>
                      <Input
                        placeholder="Filter by keywords"
                        value={filterConfig.keywords}
                        onChange={(e) => setFilterConfig(prev => ({ ...prev, keywords: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleLoadJobs} disabled={loading} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? "Loading..." : "Load Jobs"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Jobs List */}
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
                      <p className="mt-2 text-muted-foreground">
                        Try scraping jobs from external sources or adjust your filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredJobs.map((job) => (
                    <Card key={job.id} className="relative">
                      <GlowingEffect
                        spread={40}
                        glow={true}
                        disabled={false}
                        proximity={80}
                        inactiveZone={0.3}
                        borderWidth={2}
                      />
                      <Card className="relative">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getSourceColor(job.source)}>
                                  {getSourceIcon(job.source)}
                                  <span className="ml-1">{job.source}</span>
                                </Badge>
                                <Badge variant="outline">{job.type}</Badge>
                                {job.salary && (
                                  <Badge variant="secondary">{job.salary}</Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                              <p className="text-muted-foreground mb-2">{job.company}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {job.postedAt}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {job.description}
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {job.skills.slice(0, 5).map((skill) => (
                                  <Badge key={skill} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{job.skills.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <a href={job.url} target="_blank" rel="noopener noreferrer" className="gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  View
                                </a>
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1">
                                <Eye className="h-3 w-3" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Scraping Logs</CardTitle>
                  <CardDescription>
                    View history of job scraping activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Scraping logs will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

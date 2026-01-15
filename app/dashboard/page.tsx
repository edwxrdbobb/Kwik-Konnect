"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { getDashboardStats, getRecentApplications, getSavedCVs, type DashboardStats } from "./actions"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useRole } from "@/lib/role-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import {
  FileText,
  Briefcase,
  Bookmark,
  MessageSquare,
  TrendingUp,
  Building2,
  Users,
  Eye,
  Star,
  Download,
  Edit,
  ExternalLink,
  Clock,
  Loader2,
} from "lucide-react"

export default function DashboardPage() {
  const { role } = useRole()
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("Aminata")

  const [stats, setStats] = useState<DashboardStats>({
    applicationsCount: 0,
    savedJobsCount: 0,
    interviewsCount: 0,
    profileViews: 0
  })
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [savedCVs, setSavedCVs] = useState<any[]>([])

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth/login")
      } else {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User")

        // Fetch dashboard data in parallel
        const [statsData, applicationsData, cvData] = await Promise.all([
          getDashboardStats(),
          getRecentApplications(),
          getSavedCVs()
        ])

        setStats(statsData)
        setRecentApplications(applicationsData)
        setSavedCVs(cvData)
        setIsLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  // Mock data for talent - KEEPING SOME MOCKS FOR VISUALS UNTIL FULL DB POPULATION
  // Forced update to clear cache
  const suggestedJobs = [
    { id: "1", title: "Frontend Developer", company: "TechSalone", match: "High Match", location: "Freetown" },
    { id: "2", title: "UI/UX Designer", company: "Digital Dreams SL", match: "Good Match", location: "Remote" },
    { id: "3", title: "Community Manager", company: "Christex Foundation", match: "Explore", location: "Freetown" },
  ]

  const recentActivity = [
    { type: "post", content: "Shared portfolio drop in Community", time: "2 hours ago" },
    { type: "application", content: "Applied to Frontend Developer at TechSalone", time: "1 day ago" },
    { type: "certificate", content: "Verified certificate added", time: "3 days ago" },
  ]

  // Mock data for employer
  const companyProfile = {
    name: "TechSalone",
    location: "Freetown",
    rating: 4.5,
    reviews: 12,
  }

  const openRoles = [
    { id: "1", title: "Frontend Developer", applications: 24, views: 156, postedAt: "2 days ago" },
    { id: "2", title: "Product Designer", applications: 18, views: 98, postedAt: "1 week ago" },
    { id: "3", title: "Backend Engineer", applications: 15, views: 87, postedAt: "2 weeks ago" },
  ]

  const talentInsights = {
    totalViews: 341,
    totalApplications: 57,
    avgTimeToApply: "2.3 days",
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Hey there, {userName}!</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {role === "talent"
                  ? "Here's what's happening with your job search"
                  : "Manage your hiring and company presence"}
              </p>
            </div>
            <Badge variant="secondary" className="w-fit gap-2 px-3 py-1.5">
              {role === "talent" ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              <span className="capitalize">{role}</span>
            </Badge>
          </div>

          {/* Stats overview */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {role === "talent" ? (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{savedCVs.length}</p>
                        <p className="text-xs text-muted-foreground">CVs Created</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.applicationsCount}</p>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Bookmark className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.savedJobsCount}</p>
                        <p className="text-xs text-muted-foreground">Saved Jobs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">8</p>
                        <p className="text-xs text-muted-foreground">Community Posts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{openRoles.length}</p>
                        <p className="text-xs text-muted-foreground">Open Roles</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Eye className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{talentInsights.totalViews}</p>
                        <p className="text-xs text-muted-foreground">Total Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{talentInsights.totalApplications}</p>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{talentInsights.avgTimeToApply}</p>
                        <p className="text-xs text-muted-foreground">Avg Response</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Main content grid */}
          {role === "talent" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Your CVs */}
              <Card className="relative overflow-hidden">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.2}
                  borderWidth={2}
                />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Your CVs
                  </CardTitle>
                  <CardDescription>Manage and download your CV versions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedCVs.map((cv) => (
                    <div key={cv.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex-1">
                        <p className="font-medium">{cv.professional_title || "Untitled CV"}</p>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(cv.last_updated).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/cv-builder">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Link href="/cv-builder">
                    <Button variant="outline" className="w-full bg-transparent">
                      Create New CV
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Suggested roles */}
              <Card className="relative overflow-hidden">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.2}
                  borderWidth={2}
                />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Suggested for You
                  </CardTitle>
                  <CardDescription>Jobs that match your skills and interests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestedJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.company} • {job.location}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={job.match === "High Match" ? "default" : "secondary"}
                        className="shrink-0 text-xs"
                      >
                        {job.match}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/jobs-list">
                    <Button variant="outline" className="w-full bg-transparent">
                      View All Jobs
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Saved jobs */}
              {/* Saved jobs count view (Simplified for now) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-primary" />
                    Saved Jobs
                  </CardTitle>
                  <CardDescription>You have {stats.savedJobsCount} saved jobs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* We would map actual saved jobs here if we fetched the full list */}
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {stats.savedJobsCount > 0
                      ? "Visit Jobs page to view your saved items."
                      : "No saved jobs yet. Start browsing!"}
                  </p>
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full">Browse Jobs</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Community activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Community Activity
                  </CardTitle>
                  <CardDescription>Your recent interactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.content}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                  <Link href="/community">
                    <Button variant="outline" className="w-full bg-transparent">
                      Go to Community
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Company profile */}
              <Card className="relative overflow-hidden">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.2}
                  borderWidth={2}
                />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Your Company Profile
                  </CardTitle>
                  <CardDescription>Manage your company presence</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-bold text-primary">
                        {getInitials(companyProfile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{companyProfile.name}</h3>
                      <p className="text-sm text-muted-foreground">{companyProfile.location}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        <span className="font-medium">{companyProfile.rating}</span>
                        <span className="text-sm text-muted-foreground">({companyProfile.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href="/companies/1" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 bg-transparent">
                        <ExternalLink className="h-4 w-4" />
                        View Public Page
                      </Button>
                    </Link>
                    <Button className="flex-1">Edit Profile</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Open roles */}
              <Card className="relative overflow-hidden">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.2}
                  borderWidth={2}
                />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Open Roles
                  </CardTitle>
                  <CardDescription>Active job postings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {openRoles.map((role) => (
                    <div key={role.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{role.title}</p>
                          <p className="text-xs text-muted-foreground">Posted {role.postedAt}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <Eye className="inline h-3.5 w-3.5 mr-1" />
                          {role.views} views
                        </span>
                        <span className="text-muted-foreground">
                          <Users className="inline h-3.5 w-3.5 mr-1" />
                          {role.applications} applications
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent">
                    Post New Job
                  </Button>
                </CardContent>
              </Card>

              {/* Talent insights */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Talent Insights
                  </CardTitle>
                  <CardDescription>How candidates are engaging with your jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-border p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{talentInsights.totalViews}</div>
                      <p className="mt-1 text-sm text-muted-foreground">Total Profile Views</p>
                    </div>
                    <div className="rounded-lg border border-border p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{talentInsights.totalApplications}</div>
                      <p className="mt-1 text-sm text-muted-foreground">Total Applications</p>
                    </div>
                    <div className="rounded-lg border border-border p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{talentInsights.avgTimeToApply}</div>
                      <p className="mt-1 text-sm text-muted-foreground">Avg Time to Apply</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

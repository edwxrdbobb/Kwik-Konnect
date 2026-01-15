"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JobSwiper } from "@/components/jobs/job-swiper"
import type { Job } from "@/components/jobs/job-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Heart, X, Filter, LayoutGrid, Map as MapIcon, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobCard } from "@/components/jobs/job-card"
import dynamic from "next/dynamic"

const MapboxMap = dynamic(() => import("../../components/mapbox-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-muted/20 border-2 rounded-lg">
      <p className="text-muted-foreground animate-pulse">Loading Map...</p>
    </div>
  ),
})

const sampleJobs: Job[] = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "TechSalone",
    location: "Freetown",
    type: "Full-time",
    salary: "SLE 3,000-5,000/mo",
    skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
    postedAt: "2 days ago",
    description:
      "Join our growing team to build modern web applications for businesses across Sierra Leone. You'll work on cutting-edge projects using React and Next.js.",
  },
  {
    id: "2",
    title: "Community Manager",
    company: "Christex Foundation",
    location: "Remote",
    type: "Part-time",
    salary: "SLE 1,500-2,500/mo",
    skills: ["Social Media", "Communication", "Community Building", "Content Creation"],
    postedAt: "1 day ago",
    description:
      "Manage and grow our online community across social platforms. Create engaging content and foster meaningful connections with our audience.",
  },
  {
    id: "3",
    title: "Agricultural Field Worker",
    company: "Feed Salone Initiative",
    location: "Bo District",
    type: "Gig",
    salary: "SLE 500-800/day",
    skills: ["Farming", "Physical Labor", "Teamwork"],
    postedAt: "3 hours ago",
    description:
      "Seasonal opportunity to support rice cultivation. Training provided. Great for students looking for flexible work during breaks.",
  },
  {
    id: "4",
    title: "Data Entry Clerk",
    company: "Ministry of Health",
    location: "Freetown",
    type: "Contract",
    salary: "SLE 2,000-3,000/mo",
    skills: ["Microsoft Excel", "Data Entry", "Attention to Detail", "Organization"],
    postedAt: "5 days ago",
    description:
      "Support the digitization of health records. This is a 6-month contract with possibility of extension. Training on our systems will be provided.",
  },
  {
    id: "5",
    title: "Private Tutor",
    company: "EduConnect SL",
    location: "Flexible",
    type: "Gig",
    salary: "SLE 200-400/hour",
    skills: ["Teaching", "Mathematics", "English", "Patience"],
    postedAt: "1 week ago",
    description:
      "Teach secondary school students in Mathematics and English. Flexible schedule. You choose your hours and students.",
  },
]

export default function JobsPage() {
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([])
  const [skippedJobs, setSkippedJobs] = useState<Job[]>([])
  const [viewMode, setViewMode] = useState<"swipe" | "grid" | "map">("swipe")

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Main swipe area */}
            <div>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Find Your Next Job</h1>
                  <p className="mt-1 text-muted-foreground">
                    {viewMode === "swipe" ? "Swipe right to apply, left to skip" : `Explore ${sampleJobs.length} available opportunities`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border p-1 bg-muted/50">
                    <Button
                      variant={viewMode === "swipe" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("swipe")}
                      className="h-8 gap-2"
                    >
                      <Layers className="h-4 w-4" />
                      <span className="hidden sm:inline">Swipe</span>
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 gap-2"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
                    </Button>
                    <Button
                      variant={viewMode === "map" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("map")}
                      className="h-8 gap-2"
                    >
                      <MapIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Map</span>
                    </Button>
                  </div>

                  <Button variant="outline" size="sm" className="bg-transparent h-10">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>

              {viewMode === "swipe" && (
                <JobSwiper
                  jobs={sampleJobs}
                  onSwipeLeft={(job) => setSkippedJobs((prev) => [...prev, job])}
                  onSwipeRight={(job) => setAppliedJobs((prev) => [...prev, job])}
                />
              )}

              {viewMode === "grid" && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {sampleJobs.map((job) => (
                    <JobCard key={job.id} job={job} className="h-full active:cursor-default" />
                  ))}
                </div>
              )}

              {viewMode === "map" && (
                <div className="h-[600px]">
                  <MapboxMap
                    items={sampleJobs.map((job, index) => {
                      // Approximate locations for demo purposes
                      const baseLat = 8.46
                      const baseLng = -13.23
                      // Add some randomness so they don't stack perfectly if we use the same base
                      const isFreetown = job.location.includes("Freetown")

                      return {
                        id: job.id,
                        lat: isFreetown ? baseLat + (index * 0.01) : 7.96 + (index * 0.01),
                        lng: isFreetown ? baseLng + (index * 0.01) : -11.74 + (index * 0.01),
                        title: job.title,
                        description: `${job.company} • ${job.salary}`,
                      }
                    })}
                    height="100%"
                    center={{ lat: 8.46, lng: -13.23 }}
                  />
                </div>
              )}
            </div>

            {/* Sidebar - hidden on mobile */}
            <div className="hidden lg:block">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Your Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="applied">
                    <TabsList className="w-full">
                      <TabsTrigger value="applied" className="flex-1 gap-1">
                        <Heart className="h-4 w-4" />
                        Applied ({appliedJobs.length})
                      </TabsTrigger>
                      <TabsTrigger value="skipped" className="flex-1 gap-1">
                        <X className="h-4 w-4" />
                        Skipped ({skippedJobs.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="applied" className="mt-4 space-y-3">
                      {appliedJobs.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No applications yet</p>
                      ) : (
                        appliedJobs.map((job) => (
                          <div key={job.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{job.title}</p>
                              <p className="text-xs text-muted-foreground">{job.company}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                    <TabsContent value="skipped" className="mt-4 space-y-3">
                      {skippedJobs.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No skipped jobs</p>
                      ) : (
                        skippedJobs.map((job) => (
                          <div key={job.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Briefcase className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{job.title}</p>
                              <p className="text-xs text-muted-foreground">{job.company}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

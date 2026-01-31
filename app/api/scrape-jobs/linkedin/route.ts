import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface LinkedInJob {
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
  source: "linkedin"
}

export async function POST(req: NextRequest) {
  try {
    const { keywords = "", location = "Sierra Leone", limit = 20 } = await req.json()

    // LinkedIn scraping simulation (in production, you'd use a proper scraping service)
    const scrapedJobs: LinkedInJob[] = await scrapeLinkedInJobs(keywords, location, limit)

    // Save to database
    const supabase = await createClient()
    const { data: savedJobs, error } = await supabase
      .from("scraped_jobs")
      .upsert(
        scrapedJobs.map(job => ({
          ...job,
          scraped_at: new Date().toISOString(),
          status: "active"
        })),
        { onConflict: "id" }
      )
      .select()

    if (error) {
      console.error("[LinkedIn Scraper] Database error:", error)
      return NextResponse.json({ error: "Failed to save jobs" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      jobs: scrapedJobs,
      saved: savedJobs?.length || 0
    })

  } catch (error: any) {
    console.error("[LinkedIn Scraper] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to scrape LinkedIn jobs" },
      { status: 500 }
    )
  }
}

async function scrapeLinkedInJobs(keywords: string, location: string, limit: number): Promise<LinkedInJob[]> {
  // Simulate LinkedIn job scraping
  // In production, this would use Puppeteer, Playwright, or a scraping API
  const sampleJobs: LinkedInJob[] = [
    {
      id: `linkedin_${Date.now()}_1`,
      title: "Senior Software Engineer",
      company: "Tech Innovation Hub",
      location: "Freetown, Sierra Leone",
      type: "Full-time",
      salary: "$3,000-5,000/month",
      skills: ["React", "Node.js", "TypeScript", "MongoDB"],
      postedAt: "2 days ago",
      description: "We're looking for a senior software engineer to join our growing team...",
      url: "https://linkedin.com/jobs/view/senior-software-engineer-123456",
      source: "linkedin"
    },
    {
      id: `linkedin_${Date.now()}_2`,
      title: "Digital Marketing Manager",
      company: "Growth Agency SL",
      location: "Freetown, Sierra Leone",
      type: "Full-time",
      salary: "$2,000-3,500/month",
      skills: ["Digital Marketing", "SEO", "Social Media", "Analytics"],
      postedAt: "1 week ago",
      description: "Lead our digital marketing efforts and help clients grow their online presence...",
      url: "https://linkedin.com/jobs/view/digital-marketing-manager-789012",
      source: "linkedin"
    },
    {
      id: `linkedin_${Date.now()}_3`,
      title: "Data Analyst",
      company: "Data Insights Ltd",
      location: "Freetown, Sierra Leone",
      type: "Contract",
      salary: "$1,800-2,800/month",
      skills: ["SQL", "Excel", "Python", "Data Visualization"],
      postedAt: "3 days ago",
      description: "Analyze complex datasets and provide actionable insights for business decisions...",
      url: "https://linkedin.com/jobs/view/data-analyst-345678",
      source: "linkedin"
    }
  ]

  // Filter by keywords if provided
  let filteredJobs = sampleJobs
  if (keywords) {
    const searchTerms = keywords.toLowerCase().split(' ')
    filteredJobs = sampleJobs.filter(job => 
      searchTerms.some(term => 
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.skills.some(skill => skill.toLowerCase().includes(term))
      )
    )
  }

  return filteredJobs.slice(0, limit)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: jobs, error } = await supabase
      .from("scraped_jobs")
      .select("*")
      .eq("source", "linkedin")
      .eq("status", "active")
      .order("scraped_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ jobs: jobs || [] })
  } catch (error: any) {
    console.error("[LinkedIn Scraper] GET Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch LinkedIn jobs" },
      { status: 500 }
    )
  }
}

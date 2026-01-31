import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CareerSLScraper, type CareerSLJob } from "@/lib/careersl-scraper"

export async function POST(req: NextRequest) {
  try {
    const { keywords = "", location = "Sierra Leone", limit = 20 } = await req.json()

    // Use the dedicated scraper class
    const scraper = new CareerSLScraper()
    const scrapedJobs: CareerSLJob[] = await scraper.scrapeJobs(keywords, location, limit)

    // Try to save to database, but don't fail if it doesn't exist yet
    try {
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
        console.warn("[CareerSL Scraper] Database warning (table may not exist):", error.message)
        // Continue without saving to database
      }

      return NextResponse.json({
        success: true,
        jobs: scrapedJobs,
        saved: error ? 0 : (savedJobs?.length || 0),
        source: "careersl",
        message: error ? "Jobs scraped successfully (database not available)" : "Jobs scraped and saved successfully"
      })
    } catch (dbError) {
      console.warn("[CareerSL Scraper] Database error:", dbError)
      return NextResponse.json({
        success: true,
        jobs: scrapedJobs,
        saved: 0,
        source: "careersl",
        message: "Jobs scraped successfully (database not available)"
      })
    }

  } catch (error: any) {
    console.error("[CareerSL Scraper] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to scrape career.sl jobs" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: jobs, error } = await supabase
      .from("scraped_jobs")
      .select("*")
      .eq("source", "careersl")
      .eq("status", "active")
      .order("scraped_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ jobs: jobs || [] })
  } catch (error: any) {
    console.error("[CareerSL Scraper] GET Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch career.sl jobs" },
      { status: 500 }
    )
  }
}

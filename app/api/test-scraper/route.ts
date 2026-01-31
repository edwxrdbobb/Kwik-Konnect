import { NextRequest, NextResponse } from "next/server"
import { CareerSLScraper } from "@/lib/careersl-scraper"

export async function POST(req: NextRequest) {
  try {
    const { keywords = "", location = "Sierra Leone", limit = 20 } = await req.json()

    // Test the scraper without database operations
    const scraper = new CareerSLScraper()
    const scrapedJobs = await scraper.scrapeJobs(keywords, location, limit)

    return NextResponse.json({
      success: true,
      jobs: scrapedJobs,
      count: scrapedJobs.length,
      message: "Scraper test completed successfully"
    })

  } catch (error: any) {
    console.error("[Test Scraper] Error:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to test scraper",
        details: error.stack 
      },
      { status: 500 }
    )
  }
}

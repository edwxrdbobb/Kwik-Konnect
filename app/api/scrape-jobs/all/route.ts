import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { keywords = "", location = "Sierra Leone", limit = 20 } = await req.json()

    // Scrape from all sources
    const [linkedinResponse, careerslResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scrape-jobs/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, location, limit: Math.ceil(limit / 2) })
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scrape-jobs/careersl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, location, limit: Math.ceil(limit / 2) })
      })
    ])

    const linkedinResult = linkedinResponse.ok ? await linkedinResponse.json() : { jobs: [], saved: 0 }
    const careerslResult = careerslResponse.ok ? await careerslResponse.json() : { jobs: [], saved: 0 }

    const allJobs = [...(linkedinResult.jobs || []), ...(careerslResult.jobs || [])]
    const totalSaved = (linkedinResult.saved || 0) + (careerslResult.saved || 0)

    return NextResponse.json({
      success: true,
      jobs: allJobs,
      saved: totalSaved,
      sources: {
        linkedin: linkedinResult.jobs?.length || 0,
        careersl: careerslResult.jobs?.length || 0
      }
    })

  } catch (error: any) {
    console.error("[All Sources Scraper] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to scrape jobs from all sources" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get jobs from all sources
    const [linkedinResponse, careerslResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scrape-jobs/linkedin`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scrape-jobs/careersl`)
    ])

    const linkedinJobs = linkedinResponse.ok ? await linkedinResponse.json() : { jobs: [] }
    const careerslJobs = careerslResponse.ok ? await careerslResponse.json() : { jobs: [] }

    const allJobs = [...(linkedinResponse.ok ? linkedinJobs.jobs || [] : []), 
                    ...(careerslResponse.ok ? careerslJobs.jobs || [] : [])]

    return NextResponse.json({ jobs: allJobs })
  } catch (error: any) {
    console.error("[All Sources Scraper] GET Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch jobs from all sources" },
      { status: 500 }
    )
  }
}

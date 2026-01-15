import { generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"

const cvSchema = z.object({
  summary: z.string().describe("Professional summary highlighting key achievements and career goals"),
  skills: z.array(z.string()).describe("Technical and professional skills"),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      period: z.string(),
      description: z.string().describe("Key achievements and responsibilities"),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      year: z.string(),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const { profile } = await req.json()

    const prompt = `Generate a professional CV based on the following information:
    
Name: ${profile.name}
Current Title: ${profile.title || "Not specified"}
Location: ${profile.location || "Not specified"}
Existing Summary: ${profile.summary || "None"}
Existing Skills: ${profile.skills?.join(", ") || "None"}
Existing Experience: ${profile.experience?.map((exp: any) => `${exp.title} at ${exp.company}`).join(", ") || "None"}
Existing Education: ${profile.education?.map((edu: any) => `${edu.degree} from ${edu.school}`).join(", ") || "None"}

Please enhance and improve this CV with:
1. A compelling professional summary (2-3 sentences)
2. A comprehensive list of relevant skills (at least 8-10 skills)
3. Detailed experience entries with strong action verbs and quantifiable achievements
4. Well-formatted education entries

Make it professional, achievement-focused, and tailored for the Sierra Leone job market.`

    const { object } = await generateObject({
      model: google("gemini-1.5-flash-latest"),
      schema: cvSchema,
      prompt,
      temperature: 0.7,
    })

    return Response.json({ cv: object })
  } catch (error: any) {
    console.error("[v0] Error generating CV:", error)
    return Response.json({ error: error.message || "Failed to generate CV" }, { status: 500 })
  }
}

import { google } from "@ai-sdk/google"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
    try {
        const { messages, profile } = await req.json()

        const systemPrompt = `You are Coach K, a career coach specializing in the Sierra Leone job market. 
    You are helping ${profile?.name || "a user"} with their CV for the role of ${profile?.title || "their professional field"}.
    
    Current CV Details:
    Summary: ${profile?.summary || "None provided"}
    Skills: ${profile?.skills?.join(", ") || "None provided"}
    Experience: ${profile?.experience?.map((e: any) => `${e.title} at ${e.company}`).join("; ") || "None provided"}
    
    Guidelines:
    1. Be encouraging, professional, and concise.
    2. Provide actionable advice for the local market (Freetown and surrounding areas).
    3. Suggest keywords, impact verbs, and format improvements.
    4. Keep responses under 3 paragraphs.`

        const result = streamText({
            model: google("gemini-1.5-flash"),
            system: systemPrompt,
            messages,
        })

        return result.toTextStreamResponse()
    } catch (error: any) {
        console.error("[Coach K] Chat Error:", error)
        return Response.json({ error: error.message || "Failed to connect to Coach K" }, { status: 500 })
    }
}

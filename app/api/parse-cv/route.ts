import { generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"

const cvParsedSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    title: z.string().optional(),
    summary: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(
        z.object({
            title: z.string(),
            company: z.string(),
            period: z.string(),
            description: z.string(),
        })
    ).optional(),
    education: z.array(
        z.object({
            degree: z.string(),
            school: z.string(),
            year: z.string(),
        })
    ).optional(),
})

export async function POST(req: Request) {
    try {
        const { file, fileName, fileType } = await req.json()

        if (!file) {
            return Response.json({ error: "No file provided" }, { status: 400 })
        }

        // AI Model Selection with Fallback
        const getParseResult = async (currentProvider: string) => {
            const model = currentProvider === "openai" ? openai("gpt-4o") : google("gemini-2.5-flash")
            return await generateObject({
                model,
                schema: cvParsedSchema,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Parse this CV into structured data. File Context: ${fileName}` } as any,
                            { type: "file", data: file, mediaType: fileType, filename: fileName } as any,
                        ],
                    },
                ],
                temperature: 0.2,
            })
        }

        let result
        try {
            result = await getParseResult("google")
        } catch (error) {
            console.warn("[AI Fallback] Google failed, trying OpenAI...", error)
            try {
                result = await getParseResult("openai")
            } catch (fallbackError) {
                console.error("[AI] Both providers failed:", fallbackError)
                throw fallbackError
            }
        }

        return Response.json({ profile: result.object })
    } catch (error: any) {
        console.error("[CV Parser] Error parsing CV:", error)
        return Response.json({ error: error.message || "Failed to parse CV" }, { status: 500 })
    }
}

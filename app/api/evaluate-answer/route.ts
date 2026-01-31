import { generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"

const evaluationSchema = z.object({
    score: z.number().min(1).max(10).describe("A score from 1 to 10 based on the quality of the answer"),
    feedback: z.string().describe("Constructive feedback for the user, highlighting strengths and areas for improvement"),
})

export async function POST(req: Request) {
    try {
        const { question, answer, type, provider = "google" } = await req.json()

        const prompt = `You are an expert interviewer and career coach specializing in the Sierra Leone tech and professional market.
    
Interview Question (${type}): ${question}
User's Answer: ${answer}

Please evaluate this answer and provide:
1. A score from 1 to 10.
2. Constructive feedback that is encouraging yet professional.
3. Specific tips on how to improve the response for a local employer in Sierra Leone.

Keep the feedback concise (2-3 sentences).`

        // AI Model Selection with Fallback
        const getEvaluationResult = async (currentProvider: string) => {
            const model = currentProvider === "openai" ? openai("gpt-4o") : google("gemini-2.5-flash")
            return await generateObject({
                model,
                schema: evaluationSchema,
                prompt,
                temperature: 0.7,
            })
        }

        let result
        try {
            result = await getEvaluationResult("google")
        } catch (error) {
            console.warn("[AI Fallback] Google failed, trying OpenAI...", error)
            try {
                result = await getEvaluationResult("openai")
            } catch (fallbackError) {
                console.error("[AI] Both providers failed:", fallbackError)
                throw fallbackError
            }
        }

        return Response.json(result.object)
    } catch (error: any) {
        console.error("[Interview Coach] Evaluation Error:", error)
        return Response.json({ error: error.message || "Failed to evaluate answer" }, { status: 500 })
    }
}

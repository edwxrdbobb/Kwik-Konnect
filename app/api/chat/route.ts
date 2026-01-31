import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"
import { streamText, convertToModelMessages } from "ai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

export async function POST(req: Request) {
    try {
        const { messages, profile, id: chatId } = await req.json()
        const selectedProvider = "google"

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

        // AI Model Selection with Fallback
        const getChatResult = async (currentProvider: string) => {
            const model = currentProvider === "openai" ? openai("gpt-4o") : google("gemini-2.5-flash")
            const modelMessages = await convertToModelMessages(messages)
            return await streamText({
                model,
                messages: modelMessages,
                system: systemPrompt,
            })
        }

        const result = await getChatResult(selectedProvider)

        const supabase = await createClient()
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id ?? null

        const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user")
        const lastUserText =
            lastUserMessage?.parts?.map((p: any) => (p.type === "text" ? p.text : "")).join("") || ""

        if (userId && lastUserText) {
            supabase
                .from("chat_messages")
                .insert({
                    user_id: userId,
                    conversation_id: chatId ?? null,
                    role: "user",
                    content: lastUserText,
                    provider: selectedProvider,
                    profile_snapshot: profile ?? null,
                })
                .then(() => {})
                .catch(() => {})
        }

        if (userId) {
            result.text
                .then((assistantText) => {
                    if (!assistantText) return
                    return supabase.from("chat_messages").insert({
                        user_id: userId,
                        conversation_id: chatId ?? null,
                        role: "assistant",
                        content: assistantText,
                        provider: selectedProvider,
                        profile_snapshot: profile ?? null,
                    })
                })
                .then(() => {})
                .catch(() => {})
        }

        return result.toUIMessageStreamResponse({ originalMessages: messages })
    } catch (error: any) {
        console.error("[Coach K] Chat Error:", error)
        return Response.json({ error: error.message || "Failed to connect to Coach K" }, { status: 500 })
    }
}

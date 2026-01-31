import { createServerSupabaseClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const sortBy = req.nextUrl.searchParams.get("sort") || "latest"

    let query = supabase
      .from("posts")
      .select(
        `
        id,
        content,
        type,
        created_at,
        author_id,
        comments(id),
        post_reactions(id, reaction)
      `,
      )
      .order("created_at", { ascending: false })

    if (sortBy === "trending") {
      query = query.limit(100)
    }

    const { data: posts, error } = await query

    if (error) throw error

    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, role, avatar_url")
          .eq("id", post.author_id)
          .single()

        return {
          ...post,
          profiles: profile || {
            id: post.author_id,
            full_name: "Anonymous User",
            role: "Community Member",
            avatar_url: null,
          },
        }
      }),
    )

    const transformedPosts = postsWithProfiles.map((post) => {
      const reactions = {
        fire: post.post_reactions?.filter((r: any) => r.reaction === "fire").length || 0,
        bulb: post.post_reactions?.filter((r: any) => r.reaction === "bulb").length || 0,
        clap: post.post_reactions?.filter((r: any) => r.reaction === "clap").length || 0,
        heart: post.post_reactions?.filter((r: any) => r.reaction === "heart").length || 0,
      }

      if (sortBy === "trending") {
        const totalReactions = Object.values(reactions).reduce((sum: number, val: number) => sum + val, 0)
        return {
          ...post,
          reactions,
          comments: post.comments?.length || 0,
          trendingScore: totalReactions,
        }
      }

      return {
        ...post,
        reactions,
        comments: post.comments?.length || 0,
      }
    })

    if (sortBy === "trending") {
      transformedPosts.sort((a: any, b: any) => b.trendingScore - a.trendingScore)
    }

    return NextResponse.json(transformedPosts)
  } catch (error: any) {
    console.error("[API] Error fetching posts:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { content, type } = await req.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        content,
        type: type || "text",
        author_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      ...post,
      profiles: profile || {
        id: user.id,
        full_name: "Anonymous User",
        role: "Community Member",
        avatar_url: null,
      },
    })
  } catch (error: any) {
    console.error("[API] Error creating post:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

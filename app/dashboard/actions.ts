"use server"

import { createClient } from "@/lib/supabase/server"

// Define types locally for now, ideally should come from a types file
export interface DashboardStats {
    applicationsCount: number
    savedJobsCount: number
    interviewsCount: number // Placeholder for now
    profileViews: number // Placeholder for now
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            applicationsCount: 0,
            savedJobsCount: 0,
            interviewsCount: 0,
            profileViews: 0
        }
    }

    // Fetch applications count
    const { count: applicationsCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("applicant_id", user.id)

    // Fetch saved jobs count
    const { count: savedJobsCount } = await supabase
        .from("saved_jobs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

    // Fetch interviews count (status = interviewing)
    const { count: interviewsCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("applicant_id", user.id)
        .eq("status", "interviewing")

    return {
        applicationsCount: applicationsCount || 0,
        savedJobsCount: savedJobsCount || 0,
        interviewsCount: interviewsCount || 0,
        profileViews: 0, // Implement when tracking exists
    }
}

export async function getRecentApplications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from("applications")
        .select(`
      *,
      job:jobs (
        title,
        company:companies (name, logo_url)
      )
    `)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

    return data || []
}

export async function getSavedCVs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .order("last_updated", { ascending: false })

    return data || []
}

export async function getUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    return data
}

export async function updateUserProfile(profileData: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id)
        .select()
        .single()

    if (error) throw error
    return data
}

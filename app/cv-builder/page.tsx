"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Plus, X, Download, Eye, FileText, Briefcase, GraduationCap, User, Save, MessageSquare, Bot, Upload, Trash2, Image as ImageIcon, Edit3 } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useChat } from '@ai-sdk/react'

interface ProfileData {
  name: string
  email: string
  phone: string
  location: string
  title: string
  summary: string
  photo_url: string
  skills: string[]
  experience: { title: string; company: string; period: string; description: string }[]
  education: { degree: string; school: string; year: string }[]
}

const initialProfile: ProfileData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  title: "",
  summary: "",
  photo_url: "",
  skills: [],
  experience: [],
  education: [],
}

export default function CVBuilderPage() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile)
  const [newSkill, setNewSkill] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [showFullPreview, setShowFullPreview] = useState(false)
  const [viewState, setViewState] = useState<"loading" | "upload" | "preview" | "edit">("loading")
  const [userId, setUserId] = useState<string | null>(null)
  const [hasExistingCV, setHasExistingCV] = useState(false)
  const cvPreviewRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cvFileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const [selectedAI, setSelectedAI] = useState<"google" | "openai">("google")
  const [chatInput, setChatInput] = useState("")
  const [chatId, setChatId] = useState<string | null>(null)
  const welcomeMessage = {
    id: "welcome",
    role: "system",
    parts: [
      {
        type: "text",
        text: `Hey ${profile.name || "there"}! I'm Coach K. I've analyzed your CV draft. Would you like some tips on optimizing it for the Sierra Leone tech market?`,
      },
    ],
  }
  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId ?? undefined,
    initialMessages: [welcomeMessage],
  })
  const isChatLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("kk_chat_id") : null
    if (stored) {
      setChatId(stored)
      return
    }
    const newId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `chat_${Date.now()}`
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kk_chat_id", newId)
    }
    setChatId(newId)
  }, [])

  useEffect(() => {
    let isMounted = true
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      if (!isMounted) return
      setUserId(user.id)

      // Load existing CV
      const { data: cvData, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        if (error?.message?.includes("AbortError")) return
        console.error("[CV Builder] Error loading CV:", error)
        console.error("[CV Builder] Error details:", JSON.stringify(error, null, 2))
        setViewState("upload")
        return
      }

      if (!isMounted) return
      if (cvData) {
        setProfile({
          name: cvData.full_name || "",
          email: cvData.email || "",
          phone: cvData.phone || "",
          location: cvData.location || "",
          title: cvData.title || cvData.professional_title || "",
          summary: cvData.summary || "",
          photo_url: cvData.photo_url || "",
          skills: cvData.skills || [],
          experience: cvData.experience || [],
          education: cvData.education || [],
        })
        setHasExistingCV(true)
        setViewState("preview")
      } else {
        setHasExistingCV(false)
        setViewState("upload")
      }

      if (!user || !chatId) return

      const { data: chatRows, error: chatError } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("user_id", user.id)
        .eq("conversation_id", chatId)
        .order("created_at", { ascending: true })

      if (chatError) {
        if (chatError?.message?.includes("AbortError")) return
        console.error("[Chat] Error loading history:", chatError)
        return
      }

      if (!isMounted) return
      if (chatRows && chatRows.length > 0) {
        setMessages(
          chatRows.map((row) => ({
            id: row.id,
            role: row.role,
            parts: [
              {
                type: "text",
                text: row.content,
              },
            ],
          })),
        )
      } else {
        setMessages([welcomeMessage])
      }
    }

    checkAuth()
    return () => {
      isMounted = false
    }
  }, [router, chatId, setMessages, welcomeMessage])

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }))
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))
  }

  const addExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [...prev.experience, { title: "", company: "", period: "", description: "" }],
    }))
  }

  const addEducation = () => {
    setProfile((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", school: "", year: "" }],
    }))
  }

  const handleSaveCV = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your CV",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      // First, let's try to check if the table exists and is accessible
      const { data: testData, error: testError } = await supabase
        .from("cvs")
        .select("id")
        .eq("user_id", userId)
        .limit(1)

      if (testError && testError.code === "PGRST204") {
        console.error("[CV Builder] Table access issue - RLS policies may be missing:", testError)
        throw new Error("Database permissions not properly configured. Please contact support.")
      }

      const { error } = await supabase.from("cvs").upsert({
        user_id: userId,
        full_name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        photo_url: profile.photo_url,
        title: profile.title,
        summary: profile.summary,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
      })

      if (error) throw error
      setHasExistingCV(true)
      toast({
        title: "CV saved successfully!",
        description: "Your CV has been saved to your account",
      })
      setViewState("preview")
    } catch (error: any) {
      console.error("[CV Builder] Error saving CV:", error?.message || error)
      toast({
        title: "Failed to save CV",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCV = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (!userId || !confirm("Are you sure you want to delete your CV? This action cannot be undone.")) return

    setIsDeleting(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.from("cvs").delete().eq("user_id", userId)
      if (error) throw error
      setProfile(initialProfile)
      setHasExistingCV(false)
      setViewState("upload")
      toast({ title: "CV deleted", description: "Your CV has been removed." })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setIsSaving(true)
    const supabase = createClient()
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/photo.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('cv-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('cv-assets')
        .getPublicUrl(fileName)

      setProfile(prev => ({ ...prev, photo_url: publicUrl }))
      toast({ title: "Photo updated", description: "Your photo has been uploaded." })
    } catch (error: any) {
      toast({ title: "Upload failed", description: "Please ensure 'cv-assets' bucket exists in your Supabase storage.", variant: "destructive" })
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCVFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    try {
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.onload = async () => {
          try {
            const base64 = reader.result as string
            const response = await fetch("/api/parse-cv", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file: base64,
                fileName: file.name,
                fileType: file.type,
              }),
            })

            if (!response.ok) {
              let errorMessage = "Parsing failed"
              try {
                const errorBody = await response.json()
                errorMessage = errorBody?.error || errorMessage
              } catch {
                const errorText = await response.text()
                if (errorText) errorMessage = errorText
              }
              throw new Error(errorMessage)
            }

            const { profile: parsedProfile } = await response.json()

            setProfile((prev) => ({
              ...prev,
              ...parsedProfile,
              skills: parsedProfile.skills || prev.skills,
              experience: parsedProfile.experience || prev.experience,
              education: parsedProfile.education || prev.education,
            }))

            setViewState("edit")
            toast({ title: "CV Parsed!", description: "We've auto-filled your profile. Please review and save." })
            resolve()
          } catch (err) {
            reject(err)
          }
        }
        reader.readAsDataURL(file)
      })
    } catch (error: any) {
      toast({ title: "Parsing failed", description: error.message, variant: "destructive" })
    } finally {
      setIsParsing(false)
    }
  }

  const handleGenerateCV = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile, provider: selectedAI }),
      })

      if (!response.ok) throw new Error("Failed to generate CV")

      const { cv } = await response.json()

      // Update profile with AI-generated content
      setProfile((prev) => ({
        ...prev,
        summary: cv.summary || prev.summary,
        skills: cv.skills && cv.skills.length > 0 ? cv.skills : prev.skills,
        experience:
          cv.experience && cv.experience.length > 0
            ? cv.experience.map((exp: any) => ({
              title: exp.title || "",
              company: exp.company || "",
              period: exp.period || "",
              description: exp.description || "",
            }))
            : prev.experience,
        education:
          cv.education && cv.education.length > 0
            ? cv.education.map((edu: any) => ({
              degree: edu.degree || "",
              school: edu.school || "",
              year: edu.year || "",
            }))
            : prev.education,
      }))

      toast({
        title: "CV enhanced with AI successfully!",
        description: "Your CV has been improved",
      })
    } catch (error: any) {
      console.error("[AI] Error generating CV:", error?.message || error)
      toast({
        title: "Failed to generate CV with AI",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!cvPreviewRef.current) return

    setIsDownloading(true)

    try {
      const originalElement = cvPreviewRef.current
      const clonedElement = originalElement.cloneNode(true) as HTMLElement

      // Replace all Tailwind classes with inline RGB styles
      clonedElement.style.cssText = `
        background: rgb(255, 255, 255);
        color: rgb(0, 0, 0);
        padding: 24px;
        font-family: system-ui, -apple-system, sans-serif;
      `

      // Apply inline styles to all child elements to override CSS color functions like lab/oklch
      const allElements = clonedElement.getElementsByTagName("*")
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i] as HTMLElement
        // Remove computed styles that might use oklch
        el.style.color = "inherit"
        el.style.backgroundColor = "transparent"
        el.style.borderColor = "inherit"
        el.style.outlineColor = "inherit"
        el.style.boxShadow = "none"
        el.style.textShadow = "none"
        el.style.backgroundImage = "none"
        // Ensure SVG elements avoid lab/oklch colors
        if (el instanceof SVGElement) {
          el.setAttribute("fill", "currentColor")
          el.setAttribute("stroke", "currentColor")
        }
      }

      // Temporarily append to body for rendering
      clonedElement.style.position = "absolute"
      clonedElement.style.left = "-9999px"
      clonedElement.style.width = originalElement.offsetWidth + "px"
      document.body.appendChild(clonedElement)

      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        // Force RGB color space
        foreignObjectRendering: false,
      })

      // Remove temporary element
      document.body.removeChild(clonedElement)

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`${profile.name || "CV"}_Resume.pdf`)
      toast({
        title: "CV downloaded successfully!",
        description: `${profile.name || "CV"}_Resume.pdf`,
      })
    } catch (error: any) {
      console.error("[PDF] Error downloading PDF:", error?.message || error)
      toast({
        title: "Failed to download PDF",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (viewState === "loading") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 bg-primary/20 rounded-full" />
            <p className="text-muted-foreground text-sm">Getting things ready...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (viewState === "upload") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                {hasExistingCV ? "Enhance Your CV" : "Complete Your Profile"}
              </h1>
              <p className="mt-4 text-muted-foreground text-lg">
                {hasExistingCV
                  ? "Upload a new CV to enhance your existing one or build from scratch"
                  : "Upload your current CV or start from scratch to unlock AI career coaching"
                }
              </p>
            </div>

            {/* Show existing CV if it exists */}
            {hasExistingCV && (
              <div className="mb-8">
                <Card className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Your Current CV</CardTitle>
                        <CardDescription>This is your saved CV. You can edit it or create a new one.</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setViewState("edit"); }} className="gap-2 h-8">
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setViewState("preview"); }} className="gap-2 h-8">
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border bg-card p-6 text-xs">
                      {profile.name ? (
                        <div className="space-y-4">
                          <div className="border-b-2 border-primary/20 pb-4 flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                              <p className="text-sm text-primary font-medium">{profile.title}</p>
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {profile.email && <span className="flex items-center gap-1">✉ {profile.email}</span>}
                                {profile.phone && <span className="flex items-center gap-1">📞 {profile.phone}</span>}
                                {profile.location && <span className="flex items-center gap-1">📍 {profile.location}</span>}
                              </div>
                            </div>
                            {profile.photo_url && (
                              <div className="h-16 w-16 rounded-lg overflow-hidden border-2 border-primary/10 shrink-0 bg-muted">
                                <img src={profile.photo_url} alt="Profile" className="h-full w-full object-cover" />
                              </div>
                            )}
                          </div>

                          {profile.summary && (
                            <div>
                              <h3 className="text-sm font-bold text-foreground mb-2">Professional Summary</h3>
                              <p className="text-muted-foreground leading-relaxed text-xs">{profile.summary}</p>
                            </div>
                          )}

                          {profile.skills.length > 0 && (
                            <div>
                              <h3 className="text-sm font-bold text-foreground mb-2">Skills</h3>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {profile.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                          <FileText className="mb-2 h-6 w-6 text-primary" />
                          <p>No CV data found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-6 max-w-2xl mx-auto">
              <Card className="border-2 border-dashed border-primary/20 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => cvFileInputRef.current?.click()}>
                <CardContent className="py-12 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{isParsing ? "Parsing your CV..." : "Upload Existing CV"}</h3>
                  <p className="text-muted-foreground mb-6">PDF, Word, or Image files. Coach K will auto-fill your details.</p>
                  <Button variant="outline" className="gap-2" disabled={isParsing}>
                    <FileText className="h-4 w-4" />
                    Select File
                  </Button>
                  <input type="file" ref={cvFileInputRef} className="hidden" onChange={handleCVFileUpload} accept=".pdf,.doc,.docx,image/*" />
                </CardContent>
              </Card>

              <div className="flex items-center gap-4 px-10">
                <div className="h-[1px] flex-1 bg-border" />
                <span className="text-xs text-muted-foreground uppercase font-bold">Or</span>
                <div className="h-[1px] flex-1 bg-border" />
              </div>

              <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setViewState("edit")}>
                <CardContent className="py-8 flex items-center gap-6">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Edit3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Build from Scratch</h3>
                    <p className="text-sm text-muted-foreground">Fill in your information manually</p>
                  </div>
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">CV Management Center</h1>
              <p className="mt-1 text-muted-foreground">
                Manage, enhance, and download your professional CV
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {viewState === "preview" ? (
                <>
                  <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setViewState("edit"); }} className="gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit CV
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDeleteCV} disabled={isDeleting} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setViewState("preview"); }} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
              <Select value={selectedAI} onValueChange={(v: any) => setSelectedAI(v)}>
                <SelectTrigger className="w-[140px] h-10">
                  <Bot className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="AI Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`grid gap-6 ${viewState === 'edit' ? 'lg:grid-cols-[1fr_400px_350px]' : 'lg:grid-cols-[1fr_350px] max-w-6xl mx-auto'}`}>
            {/* Form Section */}
            {viewState === "edit" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.3}
                  borderWidth={2}
                />
                <Card className="relative">
                  <CardHeader>
                    <CardTitle>Edit Your Information</CardTitle>
                    <CardDescription>Update your profile to refresh your Professional CV</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-6 grid w-full grid-cols-3">
                        <TabsTrigger value="personal" className="gap-2">
                          <User className="h-4 w-4" />
                          <span className="hidden sm:inline">Personal</span>
                        </TabsTrigger>
                        <TabsTrigger value="experience" className="gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span className="hidden sm:inline">Experience</span>
                        </TabsTrigger>
                        <TabsTrigger value="education" className="gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span className="hidden sm:inline">Education</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="personal" className="space-y-4">
                        {/* Photo Section */}
                        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-muted/30 border border-dashed border-primary/20">
                          <div className="relative group">
                            <div className="h-24 w-24 rounded-full border-2 border-primary/10 flex items-center justify-center overflow-hidden bg-background shadow-inner">
                              {profile.photo_url ? (
                                <img src={profile.photo_url} alt="Profile" className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => photoInputRef.current?.click()}
                              className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                              title="Upload Photo"
                            >
                              <Upload className="h-3 w-3" />
                            </button>
                            <input
                              type="file"
                              ref={photoInputRef}
                              onChange={handlePhotoUpload}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-semibold">Profile Photo</Label>
                            <p className="text-xs text-muted-foreground">Upload a professional headshot for your CV</p>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              placeholder="John Doe"
                              value={profile.name}
                              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="title">Professional Title</Label>
                            <Input
                              id="title"
                              placeholder="Frontend Developer"
                              value={profile.title}
                              onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="john@example.com"
                              value={profile.email}
                              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              placeholder="+232 xxx xxx xxx"
                              value={profile.phone}
                              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              placeholder="Freetown, Sierra Leone"
                              value={profile.location}
                              onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="summary">Professional Summary</Label>
                          <Textarea
                            id="summary"
                            placeholder="A brief summary of your professional background and career goals..."
                            rows={4}
                            value={profile.summary}
                            onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Skills</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a skill..."
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                            />
                            <Button type="button" variant="outline" onClick={addSkill}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {profile.skills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                                {skill}
                                <button
                                  onClick={() => removeSkill(skill)}
                                  className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="experience" className="space-y-4">
                        {profile.experience.map((exp, index) => (
                          <Card key={index} className="border-dashed">
                            <CardContent className="pt-4 space-y-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                  placeholder="Job Title"
                                  value={exp.title}
                                  onChange={(e) => {
                                    const updated = [...profile.experience]
                                    updated[index].title = e.target.value
                                    setProfile((p) => ({ ...p, experience: updated }))
                                  }}
                                />
                                <Input
                                  placeholder="Company"
                                  value={exp.company}
                                  onChange={(e) => {
                                    const updated = [...profile.experience]
                                    updated[index].company = e.target.value
                                    setProfile((p) => ({ ...p, experience: updated }))
                                  }}
                                />
                              </div>
                              <Input
                                placeholder="Period (e.g., Jan 2022 - Present)"
                                value={exp.period}
                                onChange={(e) => {
                                  const updated = [...profile.experience]
                                  updated[index].period = e.target.value
                                  setProfile((p) => ({ ...p, experience: updated }))
                                }}
                              />
                              <Textarea
                                placeholder="Describe your responsibilities and achievements..."
                                rows={3}
                                value={exp.description}
                                onChange={(e) => {
                                  const updated = [...profile.experience]
                                  updated[index].description = e.target.value
                                  setProfile((p) => ({ ...p, experience: updated }))
                                }}
                              />
                            </CardContent>
                          </Card>
                        ))}
                        <Button variant="outline" onClick={addExperience} className="w-full bg-transparent">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Experience
                        </Button>
                      </TabsContent>

                      <TabsContent value="education" className="space-y-4">
                        {profile.education.map((edu, index) => (
                          <Card key={index} className="border-dashed">
                            <CardContent className="pt-4 space-y-3">
                              <Input
                                placeholder="Degree / Certificate"
                                value={edu.degree}
                                onChange={(e) => {
                                  const updated = [...profile.education]
                                  updated[index].degree = e.target.value
                                  setProfile((p) => ({ ...p, education: updated }))
                                }}
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                  placeholder="School / Institution"
                                  value={edu.school}
                                  onChange={(e) => {
                                    const updated = [...profile.education]
                                    updated[index].school = e.target.value
                                    setProfile((p) => ({ ...p, education: updated }))
                                  }}
                                />
                                <Input
                                  placeholder="Year"
                                  value={edu.year}
                                  onChange={(e) => {
                                    const updated = [...profile.education]
                                    updated[index].year = e.target.value
                                    setProfile((p) => ({ ...p, education: updated }))
                                  }}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Button variant="outline" onClick={addEducation} className="w-full bg-transparent">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Education
                        </Button>
                      </TabsContent>
                    </Tabs>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        onClick={handleSaveCV}
                        disabled={isSaving}
                        className="flex-1 gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-md h-10"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button type="button" onClick={handleGenerateCV} disabled={isGenerating} variant="outline" className="flex-1 gap-2 bg-transparent border-primary/20 h-10">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {isGenerating ? "Polishing..." : "AI Enhance"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Preview Section */}
            <div className="relative lg:sticky lg:top-24 lg:self-start">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={80}
                inactiveZone={0.3}
                borderWidth={2}
              />
              <Card className="relative h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">CV Preview</CardTitle>
                      {viewState === "preview" && <CardDescription>This is your current live CV</CardDescription>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowFullPreview(!showFullPreview)} className="h-8">
                        <Eye className="mr-1 h-3 w-3" />
                        {showFullPreview ? "Compact" : "Full"}
                      </Button>
                      <Button size="sm" onClick={handleDownloadPDF} disabled={isDownloading} className="h-8">
                        <Download className="mr-1 h-3 w-3" />
                        {isDownloading ? "..." : "PDF"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    ref={cvPreviewRef}
                    className={`rounded-lg border border-border bg-card p-6 ${showFullPreview ? "text-sm" : "aspect-[8.5/11] text-xs overflow-auto"}`}
                  >
                    {profile.name ? (
                      <div className="space-y-4">
                        <div className="border-b-2 border-primary/20 pb-4 flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                            <p className="text-lg text-primary font-medium">{profile.title}</p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {profile.email && <span className="flex items-center gap-1">✉ {profile.email}</span>}
                              {profile.phone && <span className="flex items-center gap-1">📞 {profile.phone}</span>}
                              {profile.location && <span className="flex items-center gap-1">📍 {profile.location}</span>}
                            </div>
                          </div>
                          {profile.photo_url && (
                            <div className="h-20 w-20 rounded-lg overflow-hidden border-2 border-primary/10 shrink-0 bg-muted">
                              <img src={profile.photo_url} alt="Profile" className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>

                        {profile.summary && (
                          <div>
                            <h3 className="text-base font-bold text-foreground mb-2 text-sm">Professional Summary</h3>
                            <p className="text-muted-foreground leading-relaxed text-xs">{profile.summary}</p>
                          </div>
                        )}

                        {profile.skills.length > 0 && (
                          <div>
                            <h3 className="text-base font-bold text-foreground mb-2 text-sm">Skills</h3>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {profile.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {profile.experience.length > 0 && (
                          <div>
                            <h3 className="text-base font-bold text-foreground mb-2 text-sm">Work Experience</h3>
                            <div className="space-y-3">
                              {profile.experience.map((exp, idx) => (
                                <div key={idx} className="border-l-2 border-primary/30 pl-3">
                                  <h4 className="font-semibold text-foreground text-sm">{exp.title}</h4>
                                  <p className="text-xs text-primary">{exp.company}</p>
                                  <p className="text-[10px] text-muted-foreground italic">{exp.period}</p>
                                  {exp.description && (
                                    <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
                                      {exp.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {profile.education.length > 0 && (
                          <div>
                            <h3 className="text-base font-bold text-foreground mb-2 text-sm">Education</h3>
                            <div className="space-y-2">
                              {profile.education.map((edu, idx) => (
                                <div key={idx} className="border-l-2 border-primary/30 pl-3 text-xs">
                                  <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                                  <p className="text-primary">{edu.school}</p>
                                  <p className="text-muted-foreground">{edu.year}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <FileText className="mb-2 h-8 w-8 text-primary" />
                        <p>Fill in your details to see a live preview</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Assistant Section */}
            <div className="relative lg:sticky lg:top-24 lg:self-start">
              <GlowingEffect spread={40} glow={true} disabled={false} proximity={80} inactiveZone={0.3} borderWidth={2} />
              <Card className="relative h-[calc(100vh-140px)] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    AI Career Coach
                  </CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>Get suggestions and interview tips</span>
                    <Select value={selectedAI} onValueChange={(v: any) => setSelectedAI(v)} disabled>
                      <SelectTrigger className="w-[100px] h-7 text-[10px]">
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col p-4 pt-0">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                    {messages.map((m: any) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-2xl border text-sm ${m.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted/50 text-foreground mr-4'
                          }`}
                      >
                        <p className="font-bold mb-1">
                          {m.role === 'user' ? 'You:' : 'Coach K:'}
                        </p>
                        {m.parts?.map((part: any, index: number) =>
                          part.type === "text" ? <span key={index}>{part.text}</span> : null,
                        )}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="p-3 rounded-2xl bg-muted/50 border text-sm text-foreground mr-4 animate-pulse">
                        Coach K is thinking...
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const value = chatInput.trim()
                      if (!value) return
                      sendMessage(
                        { text: value },
                        { body: { profile, provider: selectedAI } },
                      )
                      setChatInput("")
                    }}
                    className="space-y-4 pt-4 border-t"
                    noValidate
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-8 bg-transparent border-dashed"
                        onClick={() => {
                          setChatInput("Optimize my summary for local tech hubs")
                        }}
                      >
                        Local Insights
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-8 bg-transparent border-dashed"
                        onClick={() => {
                          setChatInput("Suggest some industry keywords")
                        }}
                      >
                        Add Keywords
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask Coach K..."
                        className="h-10 text-sm"
                      />
                      <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={isChatLoading}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

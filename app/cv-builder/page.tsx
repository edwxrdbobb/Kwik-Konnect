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
import { Sparkles, Plus, X, Download, Eye, FileText, Briefcase, GraduationCap, User, Save, MessageSquare } from "lucide-react"
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
  skills: [],
  experience: [],
  education: [],
}

export default function CVBuilderPage() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile)
  const [newSkill, setNewSkill] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [showFullPreview, setShowFullPreview] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const cvPreviewRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
    api: '/api/chat',
    body: { profile },
    initialMessages: [
      {
        id: 'welcome',
        role: 'system',
        content: `Hey ${profile.name || "there"}! I'm Coach K. I've analyzed your CV draft. Would you like some tips on optimizing it for the Sierra Leone tech market?`
      }
    ]
  })

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Load existing CV
      const { data: cvData } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .order("last_updated", { ascending: false })
        .limit(1)
        .single()

      if (cvData) {
        setProfile({
          name: cvData.full_name || "",
          email: cvData.email || "",
          phone: cvData.phone || "",
          location: cvData.location || "",
          title: cvData.professional_title || "",
          summary: cvData.summary || "",
          skills: cvData.skills || [],
          experience: cvData.experience || [],
          education: cvData.education || [],
        })
      }
    }

    checkAuth()
  }, [router])

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

  const handleSaveCV = async () => {
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
      const { error } = await supabase.from("cvs").upsert({
        user_id: userId,
        full_name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        professional_title: profile.title,
        summary: profile.summary,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
      })

      if (error) throw error
      toast({
        title: "CV saved successfully!",
        description: "Your CV has been saved to your account",
      })
    } catch (error) {
      console.error("[v0] Error saving CV:", error)
      toast({
        title: "Failed to save CV",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
        body: JSON.stringify({ profile }),
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
    } catch (error) {
      console.error("[v0] Error generating CV:", error)
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

      // Apply inline styles to all child elements to override oklch colors
      const allElements = clonedElement.getElementsByTagName("*")
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i] as HTMLElement
        // Remove computed styles that might use oklch
        el.style.color = "inherit"
        el.style.backgroundColor = "transparent"
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
    } catch (error) {
      console.error("[v0] Error downloading PDF:", error)
      toast({
        title: "Failed to download PDF",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">AI-Powered CV Builder</h1>
              <p className="mt-1 text-muted-foreground">
                Fill in your details and let AI create a professional CV for you
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateCV} disabled={isGenerating} className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg">
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "Magic in progress..." : "Magic CV (Gemini)"}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_400px_350px]">
            {/* Form Section */}
            <div className="space-y-6">
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
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>Fill in your profile to generate a tailored CV</CardDescription>
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
                      onClick={handleSaveCV}
                      disabled={isSaving}
                      variant="outline"
                      className="flex-1 gap-2 bg-transparent"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save CV"}
                    </Button>
                    <Button onClick={handleGenerateCV} disabled={isGenerating} className="flex-1 gap-2">
                      <Sparkles className="h-4 w-4" />
                      {isGenerating ? "Generating..." : "Enhance with AI"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                    <CardTitle className="text-lg">CV Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowFullPreview(!showFullPreview)}>
                        <Eye className="mr-1 h-3 w-3" />
                        {showFullPreview ? "Compact" : "Full"}
                      </Button>
                      <Button size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
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
                        {/* ... existing preview content ... */}
                        <div className="border-b-2 border-primary/20 pb-4">
                          <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                          <p className="text-lg text-primary font-medium">{profile.title}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {profile.email && <span>✉ {profile.email}</span>}
                            {profile.phone && <span>📞 {profile.phone}</span>}
                            {profile.location && <span>📍 {profile.location}</span>}
                          </div>
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
                  <CardDescription>Get suggestions and interview tips based on your CV</CardDescription>
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
                        {m.content}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="p-3 rounded-2xl bg-muted/50 border text-sm text-foreground mr-4 animate-pulse">
                        Coach K is thinking...
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-8 bg-transparent border-dashed"
                        onClick={() => handleInputChange({ target: { value: "Optimize my summary for local tech hubs" } } as any)}
                      >
                        Local Insights
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-8 bg-transparent border-dashed"
                        onClick={() => handleInputChange({ target: { value: "Suggest some industry keywords" } } as any)}
                      >
                        Add Keywords
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={handleInputChange}
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

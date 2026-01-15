"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Briefcase, Settings, Camera, Plus, X, Save, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { getUserProfile, updateUserProfile, getRecentApplications, getDashboardStats } from "@/app/dashboard/actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [stats, setStats] = useState({ applicationsCount: 0, interviewsCount: 0, certificatesCount: 0 })
  const [newSkill, setNewSkill] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfileData = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth/login")
        return
      }

      const [profile, apps, statsData] = await Promise.all([
        getUserProfile(),
        getRecentApplications(),
        getDashboardStats()
      ])

      if (profile) {
        setName(profile.full_name || "")
        setEmail(profile.email || session.user.email || "")
        setTitle(profile.professional_title || "")
        setLocation(profile.location || "")
        setBio(profile.bio || "")
        setSkills(profile.skills || [])
      }
      setApplications(apps || [])
      setStats({
        applicationsCount: statsData.applicationsCount || 0,
        interviewsCount: statsData.interviewsCount || 0,
        certificatesCount: 0
      })
      setIsLoading(false)
    }

    fetchProfileData()
  }, [router])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUserProfile({
        full_name: name,
        professional_title: title,
        location: location,
        bio: bio,
        skills: skills,
      })
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()])
      setNewSkill("")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading Profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="profile" className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">My Profile</h1>
                <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
              </div>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="applications" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Applications</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile">
              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                {/* Profile card */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src="/professional-woman-diverse.png" />
                          <AvatarFallback className="text-2xl">AK</AvatarFallback>
                        </Avatar>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <h2 className="mt-4 text-xl font-bold">{name}</h2>
                      <p className="text-muted-foreground">{title}</p>
                      <p className="text-sm text-muted-foreground">{location}</p>

                      <div className="mt-4 flex flex-wrap justify-center gap-1">
                        {skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{skills.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-6 grid w-full grid-cols-3 gap-2 border-t border-border pt-6 text-center">
                        <div>
                          <div className="text-xl font-bold text-primary">{stats.applicationsCount}</div>
                          <div className="text-xs text-muted-foreground">Applied</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-primary">{stats.interviewsCount}</div>
                          <div className="text-xs text-muted-foreground">Interviews</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-primary">{stats.certificatesCount}</div>
                          <div className="text-xs text-muted-foreground">Certificates</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit profile */}
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">Professional Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
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
                        <Button variant="outline" onClick={addSkill}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                            {skill}
                            <button
                              onClick={() => setSkills((s) => s.filter((x) => x !== skill))}
                              className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full gap-2 sm:w-auto" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>My Applications</CardTitle>
                  <CardDescription>Track your job applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.length > 0 ? (
                      applications.map((app: any, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{app.job?.title}</p>
                              <p className="text-sm text-muted-foreground">{app.job?.company?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4 sm:justify-end">
                            <Badge variant={app.status === "interviewing" ? "default" : "secondary"}>
                              {app.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <Briefcase className="mx-auto h-12 w-12 opacity-20" />
                        <p className="mt-2">No applications yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Notifications</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Email notifications for new job matches", checked: true },
                        { label: "SMS alerts for interview invitations", checked: true },
                        { label: "Weekly job digest", checked: false },
                      ].map((item, i) => (
                        <label key={i} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            defaultChecked={item.checked}
                            className="h-4 w-4 rounded border-border"
                          />
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Privacy</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Make my profile visible to recruiters", checked: true },
                        { label: "Show my verified certificates publicly", checked: true },
                      ].map((item, i) => (
                        <label key={i} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            defaultChecked={item.checked}
                            className="h-4 w-4 rounded border-border"
                          />
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button>Save Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MapPin,
  Search,
  MessageSquare,
  Mail,
  Star,
  Phone,
  LayoutGrid,
  Map as MapIcon,
  Filter,
  Wrench,
  Zap,
  Hammer,
  Truck,
  Scissors,
  Smartphone,
  Droplets,
  ExternalLink,
  ChevronRight,
  Clock,
  Briefcase,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import dynamic from "next/dynamic"

const MapboxMap = dynamic(() => import("../../components/mapbox-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[700px] flex items-center justify-center bg-muted/20 border-2 rounded-lg">
      <p className="text-muted-foreground animate-pulse">Loading Map...</p>
    </div>
  ),
})

interface ServiceProvider {
  id: string
  name: string
  category: string
  skills: string[]
  rating: number
  reviews: number
  location: {
    lat: number
    lng: number
    address: string
    city: string
  }
  experience: string
  displayImage: string
  whatsapp: string
  email: string
  isVerified: boolean
  distance: string
}

const categories = [
  { id: "all", name: "All Services", icon: Wrench },
  { id: "plumber", name: "Plumbers", icon: Droplets },
  { id: "electrician", name: "Electricians", icon: Zap },
  { id: "carpenter", name: "Carpenters", icon: Hammer },
  { id: "mechanic", name: "Auto Mechanics", icon: Wrench },
  { id: "ac_repair", name: "AC Repair", icon: Zap },
  { id: "painter", name: "Painters", icon: Hammer },
  { id: "tailor", name: "Tailors", icon: Scissors },
  { id: "phone_repair", name: "Phone Technicians", icon: Smartphone },
  { id: "delivery", name: "Delivery Guys", icon: Truck },
  { id: "tutor", name: "Private Tutors", icon: Briefcase },
]

const mockProviders: ServiceProvider[] = [
  {
    id: "1",
    name: "Mohamed Bangura",
    category: "plumber",
    skills: ["Pipe Fitting", "Drainage", "Borehole"],
    rating: 4.9,
    reviews: 24,
    location: { lat: 8.484, lng: -13.234, address: "Wilberforce", city: "Freetown" },
    experience: "8 years",
    displayImage: "https://images.unsplash.com/photo-1540560084595-93b49a2dee6c?auto=format&fit=crop&q=80&w=200",
    whatsapp: "+23277000111",
    email: "mo.bangura@gmail.com",
    isVerified: true,
    distance: "1.2 miles",
  },
  {
    id: "2",
    name: "Sarah Sesay",
    category: "tailor",
    skills: ["Fila", "Suiting", "Embroidery"],
    rating: 4.8,
    reviews: 56,
    location: { lat: 8.465, lng: -13.231, address: "Lumley", city: "Freetown" },
    experience: "12 years",
    displayImage: "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200",
    whatsapp: "+23277000222",
    email: "sarah.suiting@gmail.com",
    isVerified: true,
    distance: "2.5 miles",
  },
  {
    id: "3",
    name: "Alusine Kamara",
    category: "electrician",
    skills: ["Wiring", "Solar", "Generator"],
    rating: 4.7,
    reviews: 15,
    location: { lat: 8.491, lng: -13.218, address: "Brookfields", city: "Freetown" },
    experience: "5 years",
    displayImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    whatsapp: "+23277000333",
    email: "kamara.power@gmail.com",
    isVerified: false,
    distance: "0.8 miles",
  },
  {
    id: "4",
    name: "Ibrahim Jalloh",
    category: "carpenter",
    skills: ["Furniture", "Roofing", "Finishing"],
    rating: 4.6,
    reviews: 31,
    location: { lat: 8.472, lng: -13.195, address: "Kissy Town", city: "Freetown" },
    experience: "10 years",
    displayImage: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=200",
    whatsapp: "+23277000444",
    email: "jalloh.woodworks@gmail.com",
    isVerified: true,
    distance: "4.1 miles",
  },
]

export default function CommunityPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredProviders = mockProviders.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4">
          {/* Header Area */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Community Services</h1>
              <p className="mt-1 text-muted-foreground">Find skilled local experts within a 50-mile radius</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border p-1 bg-muted/50">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-9 gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === "map" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="h-9 gap-2"
                >
                  <MapIcon className="h-4 w-4" />
                  Map
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* Sidebar Filters */}
            <aside className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by skill or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Categories</h3>
                  <div className="flex flex-col gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                      >
                        <cat.icon className="h-4 w-4" />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-bold text-sm mb-2">Need Help?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Kwik Konnect helps you find reliable service providers. Look for the blue checkmark for verified pros!
                  </p>
                  <Button className="w-full mt-4 h-8 text-xs" variant="outline">
                    Register as Expert
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Content Area */}
            <div className="space-y-6">
              {viewMode === "list" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProviders.map((provider) => (
                    <Card
                      key={provider.id}
                      className="group cursor-pointer border-2 hover:border-primary/50 transition-all flex flex-col"
                      onClick={() => {
                        setSelectedProvider(provider)
                        setIsModalOpen(true)
                      }}
                    >
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar className="h-16 w-16 border-2 border-primary/10">
                            <img src={provider.displayImage} alt={provider.name} className="object-cover" />
                            <AvatarFallback>{provider.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold truncate text-lg">{provider.name}</h3>
                              {provider.isVerified && (
                                <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500/10 text-blue-500">
                                  ✓
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-primary font-medium">{categories.find(c => c.id === provider.category)?.name}</p>
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{provider.location.address}, {provider.distance}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-0.5 text-yellow-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm font-bold text-foreground ml-1">{provider.rating}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">({provider.reviews} reviews)</span>
                          <span className="text-sm text-muted-foreground ml-auto">• {provider.experience} exp</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-auto">
                          {provider.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-[10px] font-semibold py-0">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <div className="border-t border-border p-3 grid grid-cols-2 gap-2">
                        <Button variant="ghost" className="h-9 text-xs gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Reviews
                        </Button>
                        <Button className="h-9 text-xs gap-2">
                          View Details
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {filteredProviders.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="text-xl font-bold">No providers found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                      <Button onClick={() => { setSearchQuery(""); setSelectedCategory("all") }}>Clear All Filters</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[700px]">
                  <MapboxMap
                    items={filteredProviders.map(p => ({
                      id: p.id,
                      lat: p.location.lat,
                      lng: p.location.lng,
                      title: p.name,
                      description: `${categories.find(c => c.id === p.category)?.name} • ${p.rating} ★`,
                    }))}
                    height="100%"
                    center={{ lat: 8.4606, lng: -13.2324 }}
                    zoom={13}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Provider Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
            {selectedProvider && (
              <div className="flex flex-col">
                <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/5 to-background">
                  <div className="absolute -bottom-12 left-8">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                      <img src={selectedProvider.displayImage} alt={selectedProvider.name} className="object-cover" />
                      <AvatarFallback className="text-3xl">{selectedProvider.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="pt-16 px-8 pb-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold">{selectedProvider.name}</h2>
                        {selectedProvider.isVerified && (
                          <Badge className="bg-blue-500 text-white hover:bg-blue-600">Verified Pro</Badge>
                        )}
                      </div>
                      <p className="text-lg text-primary font-medium mt-1">
                        {categories.find(c => c.id === selectedProvider.category)?.name} Expert
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                      <Star className="h-6 w-6 text-yellow-500 fill-current" />
                      <div className="leading-tight">
                        <p className="font-bold text-xl">{selectedProvider.rating}</p>
                        <p className="text-xs text-muted-foreground">{selectedProvider.reviews} verified reviews</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-sm uppercase text-muted-foreground mb-2 flex items-center gap-2">
                          <Briefcase className="h-4 w-4" /> Work Profile
                        </h4>
                        <p className="text-muted-foreground">Experienced {selectedProvider.experience} in {selectedProvider.category} services. Specializing in residential and commercial projects across {selectedProvider.location.city}.</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm uppercase text-muted-foreground mb-2">Technical Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProvider.skills.map(s => (
                            <Badge key={s} variant="secondary">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Card className="bg-muted/50 border-none">
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-bold text-sm uppercase text-muted-foreground">Location Details</h4>
                          <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{selectedProvider.location.address}, {selectedProvider.location.city}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>Available Mon - Sat, 8AM - 6PM</span>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white" asChild>
                          <a href={`https://wa.me/${selectedProvider.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <MessageSquare className="h-4 w-4" />
                            Chat on WhatsApp
                          </a>
                        </Button>
                        <Button className="w-full gap-2" variant="outline" asChild>
                          <a href={`mailto:${selectedProvider.email}`}>
                            <Mail className="h-4 w-4" />
                            Send Email
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  )
}

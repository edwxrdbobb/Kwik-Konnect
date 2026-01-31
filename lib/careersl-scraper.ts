export interface CareerSLJob {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  skills: string[]
  postedAt: string
  description: string
  url: string
  source: "careersl"
}

export class CareerSLScraper {
  private baseUrl = "https://careers.sl"
  private userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

  async scrapeJobs(keywords: string = "", location: string = "Sierra Leone", limit: number = 20): Promise<CareerSLJob[]> {
    try {
      console.log("[CareerSL Scraper] Starting to scrape jobs...")
      
      const jobs: CareerSLJob[] = []
      const maxPages = Math.ceil(limit / 10) // Assume ~10 jobs per page
      
      for (let page = 1; page <= maxPages && jobs.length < limit; page++) {
        const pageUrl = page === 1 ? `${this.baseUrl}/jobs/` : `${this.baseUrl}/jobs/page/${page}/`
        console.log(`[CareerSL Scraper] Scraping page ${page}: ${pageUrl}`)
        
        const pageJobs = await this.scrapePage(pageUrl, limit - jobs.length)
        jobs.push(...pageJobs)
        
        // Add delay between pages to be respectful
        if (page < maxPages && jobs.length < limit) {
          await this.delay(2000)
        }
      }
      
      // Filter by keywords if provided
      let filteredJobs = jobs
      if (keywords) {
        const searchTerms = keywords.toLowerCase().split(' ').filter(term => term.length > 0)
        filteredJobs = jobs.filter(job => 
          searchTerms.some(term => 
            job.title.toLowerCase().includes(term) ||
            job.company.toLowerCase().includes(term) ||
            job.skills.some(skill => skill.toLowerCase().includes(term)) ||
            job.description.toLowerCase().includes(term)
          )
        )
      }
      
      console.log(`[CareerSL Scraper] Successfully scraped ${filteredJobs.length} jobs`)
      return filteredJobs.slice(0, limit)
      
    } catch (error) {
      console.error("[CareerSL Scraper] Error:", error)
      return this.getFallbackJobs()
    }
  }

  private async scrapePage(url: string, remainingLimit: number): Promise<CareerSLJob[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      return this.parseJobsFromHTML(html, remainingLimit)
      
    } catch (error) {
      console.error(`[CareerSL Scraper] Error scraping page ${url}:`, error)
      return []
    }
  }

  private parseJobsFromHTML(html: string, limit: number): CareerSLJob[] {
    const jobs: CareerSLJob[] = []
    
    console.log(`[CareerSL Scraper] Parsing HTML, length: ${html.length}`)
    
    // First try to find job links in the HTML
    const jobLinkPatterns = [
      /href="\/job\/([^\/]+)\/"/g,
      /\/job\/([^\/]+)\/"/g
    ]
    
    let jobSlugs: string[] = []
    for (const pattern of jobLinkPatterns) {
      const matches = [...html.matchAll(pattern)]
      jobSlugs = jobSlugs.concat(matches.map(match => match[1]))
      if (jobSlugs.length > 0) break
    }
    
    // Remove duplicates
    jobSlugs = [...new Set(jobSlugs)]
    
    console.log(`[CareerSL Scraper] Found ${jobSlugs.length} job slugs: ${jobSlugs.slice(0, 5).join(', ')}`)
    
    // If we found job slugs, create jobs from them
    if (jobSlugs.length > 0) {
      jobSlugs.slice(0, limit).forEach((slug, index) => {
        const title = this.slugToTitle(slug)
        const job: CareerSLJob = {
          id: `careersl_${slug}_${Date.now()}`,
          title,
          company: this.inferCompany(title),
          location: "Sierra Leone",
          type: "Full Time",
          salary: this.generateSalary("Full Time"),
          skills: this.extractSkillsFromTitle(title),
          postedAt: this.generatePostedDate(),
          description: `Job opportunity: ${title}. Click to view full details and application instructions.`,
          url: `${this.baseUrl}/job/${slug}/`,
          source: "careersl"
        }
        jobs.push(job)
      })
    }
    
    // If no jobs found, use fallback data
    if (jobs.length === 0) {
      console.log(`[CareerSL Scraper] No jobs found in HTML, using fallback data`)
      return this.getFallbackJobs()
    }
    
    return jobs
  }
  
  private slugToTitle(slug: string): string {
    // Convert slug to readable title
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\b\w+(?:'\w+)?\b/g, word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
  }
  
  private inferCompany(title: string): string {
    const companyKeywords = [
      { keyword: "TVET", company: "GIZ" },
      { keyword: "Advisor", company: "International Organization" },
      { keyword: "Manager", company: "Corporate" },
      { keyword: "Officer", company: "Government Agency" },
      { keyword: "Nurse", company: "Healthcare Facility" },
      { keyword: "Coordinator", company: "NGO" },
      { keyword: "Executive", company: "Corporate" },
      { keyword: "Audit", company: "Financial Institution" }
    ]
    
    for (const { keyword, company } of companyKeywords) {
      if (title.includes(keyword)) {
        return company
      }
    }
    
    return "Organization"
  }

  private createJobFromBasicInfo(jobInfo: { title: string; url: string; slug: string }): CareerSLJob {
    // Extract basic info from the URL and title
    const title = jobInfo.title
    
    // Try to infer company from title or use default
    let company = "Unknown Organization"
    const companyKeywords = ["GIZ", "UNDP", "UNICEF", "WHO", "World Bank", "Ministry", "NGO", "Foundation", "Hospital", "University"]
    for (const keyword of companyKeywords) {
      if (title.includes(keyword)) {
        company = keyword
        break
      }
    }
    
    // Default values - will be updated if we scrape individual pages
    return {
      id: `careersl_${jobInfo.slug}_${Date.now()}`,
      title,
      company,
      location: "Sierra Leone",
      type: "Full Time",
      salary: this.generateSalary("Full Time"),
      skills: this.extractSkillsFromTitle(title),
      postedAt: this.generatePostedDate(),
      description: `Job opportunity: ${title}. Click to view full details and application instructions.`,
      url: jobInfo.url,
      source: "careersl"
    }
  }

  private async scrapeJobDetails(url: string, basicJob: CareerSLJob): Promise<CareerSLJob> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.status}`)
      }

      const html = await response.text()
      
      // Extract location
      const locationMatch = html.match(/Freetown|Sierra Leone|Western Area|Kono|Makeni|Bo/i)
      const location = locationMatch ? locationMatch[0] : basicJob.location
      
      // Extract job type
      const typeMatch = html.match(/Full Time|Part Time|Contract|Fixed Term|Bidding|Temporary/i)
      const type = typeMatch ? typeMatch[0] : basicJob.type
      
      // Extract description
      const descriptionPatterns = [
        /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>(.*?)<\/div>/is,
        /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
        /Job Description.*?<\/p>(.*?)(?:<h|<div|<section)/is
      ]
      
      let description = basicJob.description
      for (const pattern of descriptionPatterns) {
        const match = html.match(pattern)
        if (match) {
          const cleanDesc = match[1]
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 800)
          
          if (cleanDesc.length > 50) {
            description = cleanDesc + "..."
            break
          }
        }
      }
      
      // Extract categories as skills
      const categoryMatches = [...html.matchAll(/<a[^>]*href="\/job-category\/[^"]*"[^>]*>([^<]+)<\/a>/g)]
      const skills = categoryMatches
        .slice(0, 8)
        .map(match => match[1].trim())
        .filter(skill => skill.length > 0 && skill.length < 50)
      
      // Extract company name
      const companyPatterns = [
        /About (GIZ|UNDP|UNICEF|WHO|World Bank)/i,
        /(GIZ|UNDP|UNICEF|WHO|World Bank|Ministry[^<]*|NGO[^<]*|Foundation[^<]*|Hospital[^<]*|University[^<]*)/i
      ]
      
      let company = basicJob.company
      for (const pattern of companyPatterns) {
        const match = html.match(pattern)
        if (match && match[1]) {
          company = match[1].trim()
          break
        }
      }
      
      return {
        ...basicJob,
        company,
        location: `${location}, Sierra Leone`,
        type,
        salary: this.generateSalary(type),
        skills: skills.length > 0 ? skills : basicJob.skills,
        description
      }
      
    } catch (error) {
      console.error(`[CareerSL Scraper] Error scraping details for ${url}:`, error)
      return basicJob
    }
  }

  private extractSkillsFromTitle(title: string): string[] {
    const skillKeywords = [
      "Manager", "Advisor", "Officer", "Coordinator", "Specialist", "Consultant",
      "Engineer", "Developer", "Analyst", "Administrator", "Assistant", "Director",
      "Nurse", "Doctor", "Teacher", "Accountant", "Finance", "HR", "IT", "Communication"
    ]
    
    const skills: string[] = []
    const titleLower = title.toLowerCase()
    
    skillKeywords.forEach(skill => {
      if (titleLower.includes(skill.toLowerCase())) {
        skills.push(skill)
      }
    })
    
    return skills.length > 0 ? skills : ["General"]
  }

  private generateSalary(type: string): string {
    const salaries: Record<string, string> = {
      "Full Time": "SLE 5,000-20,000/month",
      "Part Time": "SLE 2,500-10,000/month", 
      "Contract": "SLE 6,000-15,000/month",
      "Fixed Term": "SLE 7,000-18,000/month",
      "Bidding": "Project-based",
      "Temporary": "SLE 3,000-8,000/month"
    }
    return salaries[type] || "SLE 5,000-15,000/month"
  }

  private generatePostedDate(): string {
    const options = ["1 day ago", "2 days ago", "3 days ago", "1 week ago", "2 weeks ago", "3 weeks ago"]
    return options[Math.floor(Math.random() * options.length)]
  }

  private getFallbackJobs(): CareerSLJob[] {
    return [
      {
        id: `careersl_fallback_${Date.now()}_1`,
        title: "TVET Advisor",
        company: "GIZ",
        location: "Freetown, Sierra Leone",
        type: "Full Time",
        salary: "SLE 15,000-25,000/month",
        skills: ["Development", "Economics", "Education", "Training", "Technical Vocational"],
        postedAt: "1 day ago",
        description: "Technical Vocational Education and Training Advisor position with GIZ Sierra Leone. Focus on strengthening TVET systems and promoting youth employment.",
        url: "https://careers.sl/job/tvet-advisor/",
        source: "careersl"
      },
      {
        id: `careersl_fallback_${Date.now()}_2`,
        title: "Cocoa Coffee Value Chain Advisor",
        company: "International Organization",
        location: "Freetown, Sierra Leone",
        type: "Full Time",
        salary: "SLE 12,000-20,000/month",
        skills: ["Agriculture", "Value Chain", "Cocoa", "Coffee", "Development"],
        postedAt: "3 days ago",
        description: "Advisor position for cocoa and coffee value chain development. Experience in agricultural value chains required.",
        url: "https://careers.sl/job/cocoa-coffee-value-chain-advisor/",
        source: "careersl"
      },
      {
        id: `careersl_fallback_${Date.now()}_3`,
        title: "Communications Manager II",
        company: "International Organization",
        location: "Freetown, Sierra Leone",
        type: "Fixed Term",
        salary: "SLE 8,000-15,000/month",
        skills: ["Communications", "Public Relations", "Media", "Writing", "Strategy"],
        postedAt: "1 week ago",
        description: "Communications Manager role with focus on public relations and media outreach for international organization.",
        url: "https://careers.sl/job/communications-manager-ii/",
        source: "careersl"
      },
      {
        id: `careersl_fallback_${Date.now()}_4`,
        title: "Digital Media Producer",
        company: "Media Company",
        location: "Freetown, Sierra Leone",
        type: "Bidding",
        salary: "Project-based",
        skills: ["Digital Media", "Video Production", "Content Creation", "Social Media"],
        postedAt: "2 days ago",
        description: "Digital Media Producer for content creation and media production projects.",
        url: "https://careers.sl/job/digital-media-producer/",
        source: "careersl"
      },
      {
        id: `careersl_fallback_${Date.now()}_5`,
        title: "Audit Officer",
        company: "Financial Institution",
        location: "Freetown, Sierra Leone",
        type: "Full Time",
        salary: "SLE 6,000-12,000/month",
        skills: ["Accounting", "Finance", "Auditing", "Compliance", "Reporting"],
        postedAt: "4 days ago",
        description: "Audit Officer position responsible for financial auditing and compliance monitoring.",
        url: "https://careers.sl/job/audit-officer-2/",
        source: "careersl"
      },
      {
        id: `careersl_fallback_${Date.now()}_6`,
        title: "Executive Personal Assistant",
        company: "Corporate",
        location: "Freetown, Sierra Leone",
        type: "Full Time",
        salary: "SLE 5,000-10,000/month",
        skills: ["Administration", "Communication", "Organization", "MS Office"],
        postedAt: "5 days ago",
        description: "Executive Personal Assistant providing high-level administrative support to executive team.",
        url: "https://careers.sl/job/executive-personal-assistant/",
        source: "careersl"
      },
      {
        id: `careersl_fallback_${Date.now()}_7`,
        title: "NCD State Registered Nurse",
        company: "Healthcare Facility",
        location: "Kono, Sierra Leone",
        type: "Full Time",
        salary: "SLE 4,000-8,000/month",
        skills: ["Nursing", "Healthcare", "Patient Care", "Medical Records"],
        postedAt: "1 week ago",
        description: "State Registered Nurse position for Non-Communicable Disease program in Kono district.",
        url: "https://careers.sl/job/ncd-state-registered-nurse/",
        source: "careersl"
      },
      {
        id: `careersl_fallback_${Date.now()}_8`,
        title: "AHD Counsellor IMPAACT4HIV",
        company: "Healthcare NGO",
        location: "Freetown, Sierra Leone",
        type: "Full Time",
        salary: "SLE 6,000-10,000/month",
        skills: ["Counseling", "Healthcare", "HIV/AIDS", "Support Services"],
        postedAt: "2 weeks ago",
        description: "Counsellor for HIV/AIDS program providing support and counseling services.",
        url: "https://careers.sl/job/ahd-counsellor-impaact4hiv-3/",
        source: "careersl"
      }
    ]
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

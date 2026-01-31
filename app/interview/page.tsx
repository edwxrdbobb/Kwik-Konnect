"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Send, RotateCcw, CheckCircle, Target, TrendingUp, Award } from "lucide-react"

interface Question {
  id: string
  text: string
  type: "behavioral" | "technical"
}

interface Answer {
  questionId: string
  text: string
  score?: number
  feedback?: string
}

const jobCategories = [
  { id: "frontend", label: "Frontend Developer", icon: "💻" },
  { id: "backend", label: "Backend Developer", icon: "⚙️" },
  { id: "community", label: "Community Manager", icon: "👥" },
  { id: "data", label: "Data Entry", icon: "📊" },
  { id: "tutoring", label: "Tutor / Teacher", icon: "📚" },
  { id: "general", label: "General Interview", icon: "💼" },
]

const sampleQuestions: Record<string, Question[]> = {
  frontend: [
    { id: "1", text: "What is the difference between React state and props?", type: "technical" },
    {
      id: "2",
      text: "Tell me about a challenging project you worked on and how you overcame obstacles.",
      type: "behavioral",
    },
    { id: "3", text: "How do you ensure your code is maintainable and scalable?", type: "technical" },
  ],
  general: [
    { id: "1", text: "Tell me about yourself and your career goals.", type: "behavioral" },
    { id: "2", text: "What are your greatest strengths and weaknesses?", type: "behavioral" },
    { id: "3", text: "Where do you see yourself in 5 years?", type: "behavioral" },
  ],
}

export default function InterviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)

  const questions = selectedCategory ? sampleQuestions[selectedCategory] || sampleQuestions.general : []
  const currentQuestion = questions[currentQuestionIndex]

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return

    setIsEvaluating(true)

    try {
      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.text,
          answer: currentAnswer,
          type: currentQuestion.type,
          provider: "google", // Default to google for speed
        }),
      })

      if (!response.ok) throw new Error("Failed to evaluate answer")
      const result = await response.json()

      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          text: currentAnswer,
          score: result.score,
          feedback: result.feedback,
        },
      ])
    } catch (error) {
      console.error("Evaluation Error:", error)
      // Fallback in case of error
      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          text: currentAnswer,
          score: 5,
          feedback: "Sorry, I couldn't evaluate your response right now. Let's keep going!",
        },
      ])
    }

    setCurrentAnswer("")
    setIsEvaluating(false)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setSessionComplete(true)
    }
  }

  const resetSession = () => {
    setSelectedCategory(null)
    setCurrentQuestionIndex(0)
    setAnswers([])
    setCurrentAnswer("")
    setSessionComplete(false)
  }

  const averageScore =
    answers.length > 0
      ? Math.round((answers.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length) * 10) / 10
      : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold sm:text-3xl">AI Interview Coach</h1>
            <p className="mt-1 text-muted-foreground">Practice mock interviews and get instant AI feedback</p>
          </div>

          {!selectedCategory ? (
            // Category selection
            <div className="mx-auto max-w-3xl">
              <Card>
                <CardHeader>
                  <CardTitle>Select Interview Type</CardTitle>
                  <CardDescription>Choose the job category you want to practice for</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {jobCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                      >
                        <span className="text-2xl">{category.icon}</span>
                        <span className="font-medium">{category.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : sessionComplete ? (
            // Results
            <div className="mx-auto max-w-3xl space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Interview Complete!</CardTitle>
                  <CardDescription>Here is your performance summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <Target className="mx-auto mb-2 h-6 w-6 text-primary" />
                      <div className="text-2xl font-bold">{averageScore}/10</div>
                      <div className="text-sm text-muted-foreground">Average Score</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-500" />
                      <div className="text-2xl font-bold">{answers.length}</div>
                      <div className="text-sm text-muted-foreground">Questions Answered</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <TrendingUp className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                      <div className="text-2xl font-bold">{averageScore >= 7 ? "Good" : "Needs Work"}</div>
                      <div className="text-sm text-muted-foreground">Performance</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold">Detailed Feedback</h3>
                    {answers.map((answer, index) => (
                      <Card key={answer.questionId} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm font-medium">Question {index + 1}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{questions[index].text}</p>
                            </div>
                            <Badge variant={answer.score && answer.score >= 8 ? "default" : "secondary"}>
                              {answer.score}/10
                            </Badge>
                          </div>
                          <p className="mt-3 text-sm">{answer.feedback}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button onClick={resetSession} className="mt-6 w-full gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Practice Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Interview session
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Progress */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span>{Math.round((currentQuestionIndex / questions.length) * 100)}% complete</span>
                  </div>
                  <Progress value={(currentQuestionIndex / questions.length) * 100} className="mt-2" />
                </CardContent>
              </Card>

              {/* Question */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant={currentQuestion.type === "technical" ? "default" : "secondary"}>
                      {currentQuestion.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Type your answer here..."
                    rows={6}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    disabled={isEvaluating}
                  />
                  <div className="flex justify-between gap-4">
                    <Button variant="outline" onClick={resetSession}>
                      End Session
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={!currentAnswer.trim() || isEvaluating}
                      className="gap-2"
                    >
                      {isEvaluating ? (
                        <>
                          <Sparkles className="h-4 w-4 animate-pulse" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Previous answers */}
              {answers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Previous Answers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {answers.map((answer, index) => (
                      <div
                        key={answer.questionId}
                        className="flex items-center justify-between rounded-lg bg-muted p-3"
                      >
                        <span className="text-sm">Question {index + 1}</span>
                        <Badge variant={answer.score && answer.score >= 8 ? "default" : "secondary"}>
                          {answer.score}/10
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

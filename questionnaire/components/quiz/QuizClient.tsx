"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Flag } from "lucide-react"
import HelperRead from "@/components/quiz/HelperRead"

interface Question { id: number; question: string; hint?: string }

const questions: Question[] = [
  { id: 1, question: "On what date and at what time was the suspicious email received? [Format: dd.mm|HH:MM:SS]" },
  { id: 2, question: "What is the sender address of the suspicious email? [Format: email@domain.tld]" },
  { id: 3, question: "Who was the targeted user, and what is the IP of their workstation? [Format: user|A.B.C.D]" },
  { id: 4, question: "Which MITRE ATT&CK sub-technique does this activity map to? [Format: Txxxx.x—Name]" },
  { id: 5, question: "What was the clicked URL, and what IP address did it resolve to? [Format: URL|A.B.C.D]" },
  { id: 6, question: "At what time did the attacker first connect to the infrastructure? [Format: HH:MM:SS]" },
  { id: 7, question: "Which IP address did the attacker use inside the infrastructure? [Format: A.B.C.D]" },
  { id: 8, question: "What was the SSH session ID? [Format: exact session/token string]" },
  { id: 9, question: "What attack technique did the attacker use to log in via SSH? [Format: Txxxx—Name]" },
  { id: 10, question: "At what time did the attacker issue the first command? [Format: HH:MM:SS]" },
  { id: 11, question: "How many services were exposed, and on which IP was the Ollama runtime hosted? [Format: no. services|A.B.C.D]" },
  { id: 12, question: "What is the domain name corresponding to the IP 172.18.0.5? [Format: FQDN]" },
  { id: 13, question: "How many API endpoints were exposed? [Format: Number]" },
  { id: 14, question: "Which API endpoint was attacked? [Format: /path]" },
  { id: 15, question: "How many commands were executed in total during the attacker’s session? [Format: Number]" },
  { id: 16, question: "How did the attacker attempt to hide or cover their command history? [Format: command]" },
  { id: 17, question: "Which MITRE ATT&CK sub-technique applies to the data poisoning attack? [Format: Txxxx.x — Name_Name]" },
  { id: 18, question: "Which fake Python library was recommended by the LLM as a result of the poisoning? [Format: package-name]" },
  { id: 19, question: "By which user was the malicious library downloaded? [Format: username]" },
  { id: 20, question: "What mechanism was implemented inside the fake library? [Format: mechanism_name]" },
  { id: 21, question: "In which file was the reverse shell code located? [Format: filename]" },
  { id: 22, question: "What IP:port did the reverse shell connect to? [Format: A.B.C.D:port]" },
]

export default function QuizClient() {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [correct, setCorrect] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<Record<number, boolean>>({})
  const [showHints, setShowHints] = useState<Record<number, boolean>>({})
  const [score, setScore] = useState(0)

  async function validateAnswer(questionId: number, answer: string) {
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: questionId, answer }),
      cache: "no-store",
    })
    if (!res.ok) return { correct: false }
    return (await res.json()) as { correct: boolean }
  }

  const handleSubmit = async (questionId: number) => {
    const answer = answers[questionId]?.trim()
    if (!answer) return
    const result = await validateAnswer(questionId, answer)
    if (result.correct) {
      setCorrect((prev) => new Set([...prev, questionId]))
      setWrong((prev) => ({ ...prev, [questionId]: false }))
      setScore((prev) => prev + 1)
    } else {
      setWrong((prev) => ({ ...prev, [questionId]: true }))
    }
  }

  const toggleHint = (id: number) => setShowHints((p) => ({ ...p, [id]: !p[id] }))
  const resetForm = () => { setAnswers({}); setCorrect(new Set()); setWrong({}); setShowHints({}); setScore(0) }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Flag className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">AI - LLM Poisoning</h1>
          </div>
          <p className="text-lg text-blue-200">Test your knowledge of LLM poisoning and AI security vulnerabilities</p>
          <HelperRead />
          <Badge variant="outline" className="mt-2 border-blue-400 text-blue-300">{questions.length} Questions</Badge>
        </div>

        {correct.size > 0 && (
          <Card className="mb-6 border-blue-500/20 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white"><Flag className="h-5 w-5 text-blue-400" />Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">Score: {score}/{correct.size} ({correct.size}/{questions.length} answered)</p>
                  <p className="text-blue-2 00">
                    {correct.size === questions.length
                      ? score === questions.length
                        ? "Perfect! You're an LLM security expert!"
                        : score >= 20
                        ? "Excellent knowledge of LLM security!"
                        : score >= 15
                        ? "Good understanding, keep learning!"
                        : "Study more about LLM vulnerabilities!"
                      : `Keep going! ${questions.length - correct.size} questions remaining.`}
                  </p>
                </div>
                {correct.size === questions.length && (
                  <Button onClick={resetForm} variant="outline" className="border-blue-400 text-blue-300 hover:bg-blue-400/10 bg-transparent">Try Again</Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <Card key={q.id} className="border-blue-500/20 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">{idx + 1}</span>
                  Question {q.id}
                </CardTitle>
                <CardDescription className="text-blue-200">{q.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor={`answer-${q.id}`} className="text-blue-300">Your Answer</Label>
                    <div className="flex items-center gap-2">
                      <Input id={`answer-${q.id}`} value={answers[q.id] || ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Enter your answer..." className="bg-slate-700/50 border-blue-500/30 text-white placeholder:text-blue-300/50" />
                      {!correct.has(q.id) ? (
                        <Button onClick={() => handleSubmit(q.id)} disabled={!answers[q.id]?.trim()} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          {wrong[q.id] ? "Try Again" : "Submit"}
                        </Button>
                      ) : (
                        <div className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400" /></div>
                      )}
                    </div>
                  </div>
                  {wrong[q.id] && !correct.has(q.id) && (<p className="text-sm text-red-400">❌ Incorrect! Try again.</p>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          {correct.size === questions.length ? (
            <div className="space-y-4">
              <p className="text-blue-200 text-lg">🎉 Challenge completed! Final score: {score}/{questions.length}</p>
              <Button onClick={resetForm} size="lg" variant="outline" className="border-blue-400 text-blue-300 hover:bg-blue-400/10 bg-transparent">Reset and Try Again</Button>
            </div>
          ) : (
            <p className="text-blue-300">Answer questions individually and check your progress above!</p>
          )}
        </div>

        <div className="mt-12 text-center text-sm text-blue-400">
          <p>Learn more about LLM security at OWASP Top 10 for LLM Applications</p>
        </div>
      </div>
    </div>
  )
}

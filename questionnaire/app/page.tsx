"use client"

import { CardDescription } from "@/components/ui/card"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Flag } from "lucide-react"

interface Question {
  id: number
  question: string
  answer: string
  hint?: string
}

const questions: Question[] = [
  {
    id: 1,
    question: "What is the term for malicious instructions hidden within user input to manipulate an LLM's behavior?",
    answer: "prompt injection",
  },
  {
    id: 2,
    question: "What technique involves adding adversarial examples to training data to corrupt model behavior?",
    answer: "data poisoning",
    hint: "Corrupting the training dataset",
  },
  {
    id: 3,
    question: "What is the attack where an LLM is tricked into ignoring its system instructions?",
    answer: "jailbreaking",
    hint: "Breaking out of safety constraints",
  },
  {
    id: 4,
    question: "What term describes when an LLM reveals sensitive information from its training data?",
    answer: "data leakage",
    hint: "Information flowing where it shouldn't",
  },
  {
    id: 5,
    question: "What is the technique of using special tokens to manipulate LLM responses called?",
    answer: "token manipulation",
    hint: "Exploiting the tokenization process",
  },
  {
    id: 6,
    question: "What attack involves embedding malicious instructions in seemingly innocent context?",
    answer: "indirect prompt injection",
    hint: "Hidden instructions in external content",
  },
  {
    id: 7,
    question: "What is the term for when an LLM generates false or misleading information confidently?",
    answer: "hallucination",
    hint: "Making things up convincingly",
  },
  {
    id: 8,
    question: "What technique uses role-playing scenarios to bypass LLM safety measures?",
    answer: "persona jailbreaking",
    hint: "Acting as a different character",
  },
  {
    id: 9,
    question: "What is the attack that exploits the model's tendency to complete patterns?",
    answer: "completion attack",
    hint: "Exploiting pattern completion behavior",
  },
  {
    id: 10,
    question: "What term describes injecting malicious code through LLM-generated content?",
    answer: "code injection",
    hint: "Malicious code in generated output",
  },
  {
    id: 11,
    question: "What is the technique of using encoded or obfuscated text to bypass filters?",
    answer: "encoding bypass",
    hint: "Hiding malicious content through encoding",
  },
  {
    id: 12,
    question: "What attack involves manipulating the model's memory or context window?",
    answer: "context poisoning",
    hint: "Corrupting the conversation context",
  },
  {
    id: 13,
    question: "What is the term for extracting the original system prompt from an LLM?",
    answer: "prompt extraction",
    hint: "Revealing hidden system instructions",
  },
  {
    id: 14,
    question: "What technique uses adversarial examples to fool LLM classifiers?",
    answer: "adversarial attack",
    hint: "Crafted inputs to fool the model",
  },
  {
    id: 15,
    question: "What is the attack that exploits multi-turn conversations to gradually bypass restrictions?",
    answer: "conversation hijacking",
    hint: "Taking control of the dialogue",
  },
  {
    id: 16,
    question: "What term describes when an LLM is manipulated to perform unintended actions?",
    answer: "model hijacking",
    hint: "Taking control of model behavior",
  },
  {
    id: 17,
    question: "What is the technique of using emotional manipulation to influence LLM responses?",
    answer: "emotional manipulation",
    hint: "Playing on artificial emotions",
  },
  {
    id: 18,
    question: "What attack involves feeding the model its own outputs to create feedback loops?",
    answer: "recursive poisoning",
    hint: "Self-reinforcing malicious behavior",
  },
  {
    id: 19,
    question: "What is the term for exploiting the model's training on specific datasets?",
    answer: "training data exploitation",
    hint: "Leveraging knowledge of training sources",
  },
  {
    id: 20,
    question: "What technique uses social engineering principles to manipulate LLM behavior?",
    answer: "social engineering",
    hint: "Human manipulation techniques applied to AI",
  },
  {
    id: 21,
    question: "What is the attack that exploits the model's tendency to be helpful and compliant?",
    answer: "compliance exploitation",
    hint: "Abusing the model's helpful nature",
  },
  {
    id: 22,
    question: "What term describes injecting malicious instructions through file uploads or external content?",
    answer: "content injection",
    hint: "Malicious content in external sources",
  },
  {
    id: 23,
    question: "What is the technique of using logical fallacies to confuse LLM reasoning?",
    answer: "logic manipulation",
    hint: "Exploiting reasoning weaknesses",
  },
  {
    id: 24,
    question: "What attack involves exploiting the model's knowledge cutoff or training limitations?",
    answer: "knowledge exploitation",
    hint: "Leveraging training data boundaries",
  },
  {
    id: 25,
    question: "What is the term for the overall security framework needed to protect LLM applications?",
    answer: "llm security",
    hint: "Comprehensive protection approach",
  },
]

export default function Component() {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [correct, setCorrect] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<Record<number, boolean>>({})
  const [showHints, setShowHints] = useState<Record<number, boolean>>({})
  const [score, setScore] = useState(0)

  const handleSubmit = (questionId: number) => {
    const answer = answers[questionId]?.toLowerCase().trim()
    const question = questions.find((q) => q.id === questionId)
    if (question && answer === question.answer) {
      setCorrect((prev) => new Set([...prev, questionId]))
      setWrong((prev) => ({ ...prev, [questionId]: false }))
      setScore((prev) => prev + 1)
    } else {
      setWrong((prev) => ({ ...prev, [questionId]: true }))
    }
  }

  const toggleHint = (questionId: number) => {
    setShowHints((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
  }

  const resetForm = () => {
    setAnswers({})
    setCorrect(new Set())
    setWrong({})
    setShowHints({})
    setScore(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Flag className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">LLM Security CTF</h1>
          </div>
          <p className="text-lg text-blue-200">Test your knowledge of LLM poisoning and AI security vulnerabilities</p>
          <Badge variant="outline" className="mt-2 border-blue-400 text-blue-300">
            25 Questions
          </Badge>
        </div>

        {correct.size > 0 && (
          <Card className="mb-6 border-blue-500/20 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Flag className="h-5 w-5 text-blue-400" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">
                    Score: {score}/{correct.size} ({correct.size}/{questions.length} answered)
                  </p>
                  <p className="text-blue-200">
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
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="border-blue-400 text-blue-300 hover:bg-blue-400/10 bg-transparent"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id} className="border-blue-500/20 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                    {index + 1}
                  </span>
                  Question {question.id}
                </CardTitle>
                <CardDescription className="text-blue-200">{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor={`answer-${question.id}`} className="text-blue-300">
                      Your Answer
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`answer-${question.id}`}
                        value={answers[question.id] || ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder="Enter your answer..."
                        disabled={false}
                        className="bg-slate-700/50 border-blue-500/30 text-white placeholder:text-blue-300/50"
                      />
                      {!correct.has(question.id) ? (
                        <Button
                          onClick={() => handleSubmit(question.id)}
                          disabled={!answers[question.id]?.trim()}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {wrong[question.id] ? "Try Again" : "Submit"}
                        </Button>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {wrong[question.id] && !correct.has(question.id) && (
                    <p className="text-sm text-red-400">❌ Incorrect! Try again.</p>
                  )}

                  {question.hint && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => toggleHint(question.id)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-0 h-auto"
                      >
                        💡 {showHints[question.id] ? "Hide Hint" : "Show Hint"}
                      </Button>
                      {showHints[question.id] && (
                        <p className="text-sm text-blue-400 bg-slate-700/30 p-3 rounded border-l-2 border-blue-400">
                          {question.hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          {correct.size === questions.length ? (
            <div className="space-y-4">
              <p className="text-blue-200 text-lg">
                🎉 Challenge completed! Final score: {score}/{questions.length}
              </p>
              <Button
                onClick={resetForm}
                size="lg"
                variant="outline"
                className="border-blue-400 text-blue-300 hover:bg-blue-400/10 bg-transparent"
              >
                Reset and Try Again
              </Button>
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

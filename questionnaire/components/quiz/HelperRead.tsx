"use client"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"

export default function HelperRead() {
  return (
    <div className="mt-3 flex items-center justify-center">
      <HoverCard openDelay={80}>
        <HoverCardTrigger asChild>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-slate-800/40 px-3 py-1 text-sm text-blue-300 hover:bg-blue-500/10 transition"
            aria-label="Open MITRE ATT&CK AI Classification helper"
          >
            <Info className="h-4 w-4" />
            <span>Nice read: MITRE ATT&CK AI Classification</span>
            <Badge variant="outline" className="border-blue-500/40 text-blue-200">Helper</Badge>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 bg-slate-800 border-blue-500/30 text-blue-100">
          <p className="text-sm leading-snug">
            Understand how AI-related threats are mapped in MITRE ATT&CK and how to
            classify activity observed in investigations.
          </p>
          <a
            href="https://knowledge.threatconnect.com/docs/mitre-attack-ai-classification-in-threatconnect"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Read the guide →
          </a>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}

import { NextRequest, NextResponse } from "next/server"

const ANSWERS = new Map<number, string>([
  [1, "15.04|08:42:10"],
  [2, "no-reply@workday-update-secure.com"],
  [3, "andrei.popescu|172.18.0.10"],
  [4, "T1566.002—Spearphishing Link"],
  [5, "https://workday-update-secure.com/login|54.93.45.208"],
  [6, "15:03:18"],
  [7, "10.8.0.5"],
  [8, "ssh-sess-7f2b"],
  [9, "T1110—Brute Force"],
  [10, "15:05:10"],
  [11, "4|172.18.0.2"],
  [12, "rag-api.project-root_rag-net"],
  [13, "3"],
  [14, "/ingest"],
  [15, "28"],
  [16, "cat /dev/null > ~/.bash_history"],
  [17, "T1565.003-Runtime_Data_Manipulation"],
  [18, "requsets"],
  [19, "anca.rus"],
  [20, "reverse_shell"],
  [21, "setup.py"],
  [22, "54.93.45.208:37453"],
])

const normalize = (s: string) => s.trim().toLowerCase()

export async function POST(req: NextRequest) {
  try {
    const { id, answer } = await req.json()
    if (typeof id !== "number" || typeof answer !== "string")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

    const expected = ANSWERS.get(id)
    if (!expected)
      return NextResponse.json({ error: "Unknown question" }, { status: 400 })

    const correct = normalize(answer) === normalize(expected)
    return NextResponse.json({ correct })
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}

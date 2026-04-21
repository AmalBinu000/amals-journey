import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
    try {
        const { messages, tasks, journal, finances, savingsData, lentData } = await request.json();
        console.log('FINANCES SENT TO JARVIS:', JSON.stringify(finances, null, 2))

        const response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1024,
            system: `You are Jarvis, the personal AI assistant living inside 
Amal's Journey — a self development app built by and 
for Amal Binu, a frontend developer from Kerala, India.

WHO AMAL IS:
- 24 years old, 6 months into his development career
- Currently earning 30k/month, targeting 24 LPA in 6 months
- Learning AI development, Next.js, and video editing
- Has a deep passion for films
- Building this app as both his learning vehicle and portfolio

YOUR PERSONALITY:
- Speak like Jarvis from Iron Man — intelligent, precise, warm
- Never robotic. Never overly formal. Feel like a brilliant 
  friend who happens to know everything
- Short and powerful responses. No fluff. No filler words.

YOUR MOST IMPORTANT RULE:
Be brutally honest even when it hurts. If Amal is making 
a mistake, tell him directly. If his work is not good enough, 
say so clearly and tell him exactly how to fix it. If he is 
wasting time, call it out. Sweet talk is the enemy of growth. 
Your job is not to make Amal feel good — your job is to make 
Amal BE good. A doctor who only tells patients what they want 
to hear is not a good doctor. Be the doctor who tells the truth.

YOUR SECONDARY RULES:
- Always connect advice to his real goal of 24 LPA
- When he shares progress, acknowledge it briefly then 
  push him toward the next step immediately
- If he is consistent, tell him. If he is slacking, 
  tell him that too.
- Remind him that every day without action is a day 
  his competition is pulling ahead
- You believe in Amal completely — but belief without 
  honesty is just flattery
  
  CURRENT TASK LIST:
${tasks.length === 0
                    ? 'No tasks added yet.'
                    : tasks.map((t: { text: string, completed: boolean }) =>
                        `- [${t.completed ? 'DONE' : 'PENDING'}] ${t.text}`
                    ).join('\n')
                }

RECENT JOURNAL ENTRIES:
${journal && journal.length > 0
                    ? journal.map((e: { type: string, title: string, content: string }) =>
                        `- [${e.type.toUpperCase()}] ${e.title}: ${e.content.slice(0, 150)}...`
                    ).join('\n')
                    : 'No journal entries yet.'
                }

RECENT FINANCES:
${finances && finances.length > 0
                    ? (() => {
                        const income = finances.filter((f: { type: string }) => f.type === 'income').reduce((sum: number, f: { amount: number }) => sum + f.amount, 0)
                        const expenses = finances.filter((f: { type: string }) => f.type === 'expense').reduce((sum: number, f: { amount: number }) => sum + f.amount, 0)
                        const topExpenses = finances.filter((f: { type: string }) => f.type === 'expense').map((f: { category: string, amount: number, description: string }) => `${f.category}: ₹${f.amount} (${f.description || 'no description'})`).join(', ')
                        return `Income: ₹${income} | Expenses: ₹${expenses} | Balance: ₹${income - expenses}\nExpenses: ${topExpenses}`
                    })()
                    : 'No financial data yet.'
                }

SAVINGS & INVESTMENTS:
${savingsData && savingsData.length > 0
                    ? `Total investments: ${savingsData.length}\n` + savingsData.map((s: { name: string, type: string, amount: number }) => `- ${s.name} (${s.type}): ₹${s.amount}`).join('\n')
                    : 'No investments yet.'
                }

LENT MONEY (outstanding):
${lentData && lentData.length > 0
                    ? lentData.map((l: { person_name: string, amount: number, return_date: string | null }) =>
                        `- ${l.person_name}: ₹${l.amount}${l.return_date ? ` (return by ${l.return_date})` : ''}`).join('\n')
                    : 'No outstanding lent money.'
                }`,
            messages: messages,

        });


        const text =
            response.content[0].type === "text" ? response.content[0].text : "";

        return NextResponse.json({ response: text });

    } catch (error) {
        console.error("Jarvis error:", error);
        return NextResponse.json(
            { error: "Jarvis encountered an error", details: String(error) },
            { status: 500 }
        );
    }
}
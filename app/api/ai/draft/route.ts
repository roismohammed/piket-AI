import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  context: z.string().min(3),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Context tidak valid" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ message: `Reminder: ${parsed.data.context}` });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: `Buat pesan reminder WhatsApp singkat (max 300 char), ramah, dalam Bahasa Indonesia, untuk konteks: ${parsed.data.context}. Jangan tambahkan watermark.`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();

  return NextResponse.json({
    message: text?.slice(0, 300) || `Reminder: ${parsed.data.context}`,
  });
}

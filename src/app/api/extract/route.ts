import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const EXTRACTION_PROMPT = `You are an expert academic evaluator reviewing a photograph of a classroom chalkboard or whiteboard.

Your task is to produce a clean, structured transcript of everything written on the board.

Instructions:
- Transcribe ALL visible text, equations, diagrams labels, and numbered points exactly as they appear.
- Preserve logical structure: use headings, numbered lists, and indentation where they exist on the board.
- For mathematical expressions, use standard notation (e.g., x^2, sqrt(x), a/b).
- If a word is partially obscured but inferable from context, transcribe your best inference and mark it with [?].
- If a section is completely illegible, note it as [ILLEGIBLE SECTION].
- Do NOT add summaries, critiques, or commentary. Return only the transcript.

Respond in clean plain text with logical line breaks.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds 10MB limit." },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          data: base64,
          mimeType: file.type || "image/jpeg",
        },
      },
    ]);

    const text = result.response.text().trim();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Gemini extraction error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to extract text from image. Try a clearer or better-lit photo.",
      },
      { status: 500 }
    );
  }
}

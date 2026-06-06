const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// gemini-2.5-flash

const GEMINI_MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

/**
 * Sleep helper for retry backoff.
 */
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a conversation history to Gemini and returns the AI's text response.
 * Automatically retries on 429 (rate limit) with exponential backoff.
 *
 * @param history - Array of {role, parts} objects representing the conversation so far.
 * @param maxRetries - How many times to retry on 429 (default: 3).
 * @returns The AI's text reply.
 */
export async function sendToGemini(history: GeminiMessage[], maxRetries = 3): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set in your .env file.');
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: history,
                generationConfig: {
                    temperature: 0.9,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
            }),
        });

        // Success path
        if (response.ok) {
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('No response content from Gemini API.');
            return text;
        }

        // Retry on 429 (Too Many Requests) with exponential backoff
        if (response.status === 429 && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.warn(`Gemini 429 rate limit — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
            await sleep(delay);
            continue;
        }

        // Other errors — throw immediately
        const errorBody = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    throw new Error('Gemini API rate limit exceeded after retries. Please wait a moment and try again.');
}

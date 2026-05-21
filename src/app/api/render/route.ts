import { type NextRequest, NextResponse } from 'next/server'

const API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.5-flash-image'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RENDER_API_KEY || ''
    if (!apiKey) return NextResponse.json({ error: 'RENDER_API_KEY not configured' }, { status: 500 })

    const { images, prompt } = await request.json()

    const content: Record<string, unknown>[] = [
      { type: 'text', text: prompt || 'Architectural rendering, high quality' },
    ]
    if (images?.length > 0) {
      content.push({ type: 'image_url', image_url: { url: images[0] } })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000)

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content }], max_tokens: 4096 }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `OpenRouter: ${res.status} - ${err.slice(0, 300)}` }, { status: res.status })
    }

    const data = await res.json()
    const msg = data.choices?.[0]?.message
    const resultImages: string[] = []

    if (msg?.images && Array.isArray(msg.images)) {
      for (const img of msg.images) {
        if (typeof img === 'string') resultImages.push(img)
        else if (img?.image_url?.url) resultImages.push(img.image_url.url)
      }
    }

    return NextResponse.json({ images: resultImages })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return NextResponse.json({ error: '图片生成超时（3分钟），请重试' }, { status: 504 })
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

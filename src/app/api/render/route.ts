import { type NextRequest, NextResponse } from 'next/server'

const QUALITY_CONFIG: Record<string, { apiUrl: string; model: string }> = {
  flash:  { apiUrl: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemini-2.5-flash-image' },
  pro:    { apiUrl: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemini-3.1-flash-image-preview' },
  ultra:  { apiUrl: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemini-3-pro-image-preview' },
}

async function generateOne(apiKey: string, cfg: { apiUrl: string; model: string }, prompt: string, image?: string): Promise<string | null> {
  const content: Record<string, unknown>[] = [
    { type: 'text', text: prompt || 'Architectural rendering, high quality' },
  ]
  if (image) content.push({ type: 'image_url', image_url: { url: image } })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 180000)

  const res = await fetch(cfg.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content }], max_tokens: 4096 }),
    signal: controller.signal,
  })
  clearTimeout(timeout)

  if (!res.ok) return null
  const data = await res.json()
  const msg = data.choices?.[0]?.message
  if (msg?.images && Array.isArray(msg.images)) {
    for (const img of msg.images) {
      if (typeof img === 'string') return img
      if (img?.image_url?.url) return img.image_url.url
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RENDER_API_KEY || ''
    if (!apiKey) return NextResponse.json({ error: 'RENDER_API_KEY not set in .env.local' }, { status: 500 })

    const { images, prompt, quality } = await request.json()
    const cfg = QUALITY_CONFIG[quality] || QUALITY_CONFIG.flash

    // One request per reference image, all in parallel
    const refs: string[] = images?.length > 0 ? images : ['']
    const results = await Promise.all(refs.map(img => generateOne(apiKey, cfg, prompt, img || undefined)))
    const resultImages = results.filter((r): r is string => r !== null)

    return NextResponse.json({ images: resultImages })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return NextResponse.json({ error: '图片生成超时（3分钟），请重试' }, { status: 504 })
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

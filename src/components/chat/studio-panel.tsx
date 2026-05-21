'use client'

import { useCallback, useRef, useState } from 'react'

type RefImage = { id: string; src: string }

const VIEWS = [
  { key: 'isometric', zh: '等距', en: 'isometric view' },
  { key: 'interior', zh: '内部', en: 'interior view' },
  { key: 'bird-eye', zh: '鸟瞰', en: 'birds eye view' },
  { key: 'floorplan', zh: '平面图', en: 'floor plan view' },
  { key: 'structure', zh: '仅结构', en: 'structure only' },
]

const QUALITY = [
  { key: "flash", zh: "Flash", model: "google/gemini-2.5-flash-image" },
  { key: "pro", zh: "Pro", model: "google/gemini-3.1-flash-image-preview" },
  { key: "ultra", zh: "Ultra", model: "google/gemini-3-pro-image-preview" },
];

const INTERIOR = [
  { key: 'furnished', zh: '带家具', en: 'fully furnished interior' },
  { key: 'empty', zh: '仅房屋', en: 'empty room, no furniture' },
]

const EFFECT_STYLES = [
  { key: 'modern-natural', zh: '现代自然', en: 'modern natural style, organic materials, earthy tones' },
  { key: 'modern-simple', zh: '现代简约', en: 'modern simple style, clean lines, functional' },
  { key: 'minimalist', zh: '极简主义', en: 'minimalist design, essential elements only' },
  { key: 'light-luxury-warm', zh: '轻奢暖调', en: 'light luxury warm tone, elegant cozy' },
  { key: 'modern-luxury', zh: '现代奢侈', en: 'modern luxury, marble, gold accents, premium materials' },
  { key: 'mid-century-natural', zh: '中世纪自然', en: 'mid-century modern natural, retro wood tones' },
  { key: 'cream-minimalist', zh: '奶油极简', en: 'cream minimalist, soft beige, rounded forms' },
  { key: 'french-cream', zh: '法式奶油', en: 'French cream style, ornate moldings, warm ivory' },
  { key: 'industrial', zh: '工业风格', en: 'industrial style, exposed brick, metal, concrete' },
  { key: 'wabi-sabi', zh: '侘寂风格', en: 'wabi-sabi style, imperfect beauty, natural aged materials' },
]

const STYLES = [
  { key: "realistic", zh: "写实照片", en: "photorealistic" },
  { key: "sketch", zh: "草图/蓝图", en: "architectural sketch, blueprint style" },
  { key: "cel-shaded", zh: "单元格着色", en: "cel shaded, cartoon style" },
  { key: "watercolor", zh: "水彩画", en: "watercolor painting style" },
];

const WALL_TREATMENT = [
  { key: "white", zh: "白墙", en: "interior white walls, exterior always white" },
  { key: "color-match", zh: "配色", en: "auto color scheme for interior walls only (max 3 colors), exterior white" },
  { key: "wallpaper", zh: "壁纸", en: "interior wallpaper in living room and bedrooms, other rooms white, exterior white" },
  { key: "paint-panel", zh: "面漆护墙", en: "interior wainscoting in living room and bedrooms only, exterior white" },
  { key: "woodwork", zh: "木作", en: "interior wood paneling in living room and bedrooms, exterior white" },
];

const LIGHTINGS = [
  { key: 'daylight', zh: '白昼', en: 'bright daylight, noon sun' },
  { key: 'golden', zh: '晚霞时刻', en: 'sunset glow, warm evening light' },
  { key: 'night', zh: '夜晚', en: 'night scene, moonlight, warm interior lights' },
  { key: 'overcast', zh: '阴天', en: 'overcast, soft diffused light' },
]


function OptionGroup({ label, options, selected, onChange }: { label: string; options: typeof VIEWS; selected: string; onChange: (v: string) => void }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="border-border/50 border-b">
      <button className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => setCollapsed(!collapsed)} type="button">
        {label} <span className="text-[10px]">{collapsed ? '▶' : '▼'}</span>
      </button>
      {!collapsed && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {options.map(opt => (
            <button
              key={opt.key}
              className={`rounded-md px-2 py-1 text-[11px] transition-colors ${selected === opt.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              onClick={() => onChange(selected === opt.key ? '' : opt.key)}
              type="button"
            >
              {opt.zh}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function StudioPanel() {
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate')
  const [refImages, setRefImages] = useState<RefImage[]>([])
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [view, setView] = useState('isometric')
  const [style, setStyle] = useState("realistic")
  const [wallTreatment, setWallTreatment] = useState("white")
  const [quality, setQuality] = useState("flash")
  const [interior, setInterior] = useState('furnished')
  const [lighting, setLighting] = useState('daylight')
  const [effectStyle, setEffectStyle] = useState('modern-natural')
  const [isGenerating, setIsGenerating] = useState(false)
  const [genElapsed, setGenElapsed] = useState(0)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [showRefMenu, setShowRefMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const takeScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return alert('未找到 3D 画布')
    setRefImages(prev => [...prev, { id: Date.now().toString(), src: canvas.toDataURL('image/png') }])
    setShowRefMenu(false)
  }, [])

  const uploadImage = useCallback(() => { fileInputRef.current?.click(); setShowRefMenu(false) }, [])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRefImages(prev => [...prev, { id: Date.now().toString(), src: reader.result as string }])
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const buildPrompt = useCallback(() => {
    const parts: string[] = []
    const v = VIEWS.find(o => o.key === view)
    const inter = INTERIOR.find(o => o.key === interior)
    const s = STYLES.find(o => o.key === style)
    const l = LIGHTINGS.find(o => o.key === lighting)
    const w = WALL_TREATMENT.find(o => o.key === wallTreatment)
    const e = EFFECT_STYLES.find(o => o.key === effectStyle)
    parts.push('Architectural rendering')
    if (v) parts.push(v.en)
    if (s) parts.push(s.en)
    if (inter) parts.push(inter.en)
    if (e) parts.push(e.en)
    if (l) parts.push(l.en)
    if (w) parts.push(w.en)
    parts.push('high quality, detailed')
    return parts.join(', ')
  }, [view, style, interior, lighting, effectStyle, wallTreatment])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setGenElapsed(0)
    const timer = setInterval(() => setGenElapsed(e => e + 1), 1000)
    try {
      const prompt = buildPrompt()
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: refImages.map(r => r.src),
          prompt,
          view, style, interior, lighting, effectStyle, wallTreatment, quality,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.images) { setGeneratedImages(prev => [...data.images, ...prev]); setActiveTab('gallery') }
    } catch (err) { alert(`生成失败: ${(err as Error).message}`) }
    finally { setIsGenerating(false) }
      clearInterval(timer)
      setGenElapsed(0)  }, [refImages, buildPrompt, view, style, interior, lighting, effectStyle, wallTreatment, quality])

  const downloadImage = useCallback((src: string, i: number) => {
    const a = document.createElement('a'); a.href = src; a.download = `render-${Date.now()}-${i}.png`; a.click()
  }, [])

  const hasSelection = view || style || interior || lighting || effectStyle || wallTreatment || quality

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex shrink-0 border-border/50 border-b">
        {(['generate', 'gallery'] as const).map(tab => (
          <button key={tab} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab(tab)} type="button">
            {tab === 'generate' ? '生成' : '画廊'}
          </button>
        ))}
      </div>

      {activeTab === 'generate' ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Reference */}
          <div className="shrink-0 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">参考图</span>
              <div className="relative">
                <button className="rounded-md bg-accent px-3 py-1 text-xs hover:bg-accent/80" onClick={() => setShowRefMenu(!showRefMenu)} type="button">+ 添加</button>
                {showRefMenu && (
                  <div className="absolute right-0 top-8 z-50 w-32 rounded-lg border border-border bg-background py-1 shadow-lg" onClick={() => setShowRefMenu(false)}>
                    <button className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent" onClick={takeScreenshot} type="button">📷 截图</button>
                    <button className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent" onClick={uploadImage} type="button">📁 上传</button>
                  </div>
                )}
              </div>
            </div>
            {refImages.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 py-4 text-xs text-muted-foreground">截图或上传参考图</div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {refImages.map(img => (
                  <div key={img.id} className="relative shrink-0">
                    <img alt="" className="h-20 w-20 rounded-lg border border-border/50 object-cover cursor-pointer hover:opacity-80" src={img.src} onClick={() => setEnlargedImage(img.src)} />
                    <button className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white" onClick={() => setRefImages(prev => prev.filter(r => r.id !== img.id))} type="button">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <OptionGroup label="景观视角" onChange={setView} options={VIEWS} selected={view} />
            <OptionGroup label="风格" onChange={setStyle} options={STYLES} selected={style} />
            <OptionGroup label="内部" onChange={setInterior} options={INTERIOR} selected={interior} />
            <OptionGroup label="出图品质" onChange={setQuality} options={QUALITY} selected={quality} />
            <OptionGroup label="内墙方案" onChange={setWallTreatment} options={WALL_TREATMENT} selected={wallTreatment} />
            <OptionGroup label="灯光与氛围" onChange={setLighting} options={LIGHTINGS} selected={lighting} />
            <OptionGroup label="效果风格" onChange={setEffectStyle} options={EFFECT_STYLES} selected={effectStyle} />
          </div>

          {/* Prompt preview */}
          {hasSelection && (
            <div className="shrink-0 border-border/50 border-t px-3 py-2">
              <p className="text-[10px] text-muted-foreground leading-relaxed">{buildPrompt()}</p>
            </div>
          )}

          {/* Generate */}
          <div className="shrink-0 border-border/50 border-t p-3">
            <button className="w-full rounded-lg bg-primary py-2.5 text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50" disabled={isGenerating || !hasSelection} onClick={handleGenerate} type="button">
              {isGenerating ? '生成中...' : '生成效果图'}
            </button>
          </div>
          <input accept="image/*" className="hidden" onChange={handleFile} ref={fileInputRef} type="file" />
        </div>
      ) : (
        /* Gallery */
        <div className="flex flex-1 flex-col overflow-hidden">
          {generatedImages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">还没有生成的效果图</div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {generatedImages.map((src, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border border-border/50">
                    <img alt={`render-${i}`} className="aspect-video w-full cursor-pointer object-cover hover:scale-105 transition-transform" onClick={() => setEnlargedImage(src)} src={src} />
                    <button className="absolute right-1 top-1 hidden rounded bg-background/80 p-1 text-xs group-hover:block" onClick={() => downloadImage(src, i)} type="button">💾</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image lightbox */}
      {enlargedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setEnlargedImage(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <img alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" src={enlargedImage} />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button className="rounded-lg bg-background/80 px-3 py-1.5 text-xs" onClick={() => downloadImage(enlargedImage, 0)} type="button">保存</button>
              <button className="rounded-lg bg-background/80 px-3 py-1.5 text-xs" onClick={() => setEnlargedImage(null)} type="button">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

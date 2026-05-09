import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

export const maxDuration = 60

// ─────────────────────────────────────────────────────────────────────────────
// THEME DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const styleThemes: Record<string, {
  fonts: string; headingFont: string; bodyFont: string; primary: string
  primaryDark: string; accent: string; bg: string; surface: string
  text: string; textMuted: string; gradient: string; heroOverlay: string; navBg: string
}> = {
  modern: {
    fonts: "Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700",
    headingFont: "'Space Grotesk', sans-serif", bodyFont: "'Inter', sans-serif",
    primary: "#6366f1", primaryDark: "#4f46e5", accent: "#f59e0b",
    bg: "#0a0a0f", surface: "#13131a", text: "#f8fafc", textMuted: "#94a3b8",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
    heroOverlay: "linear-gradient(to bottom, rgba(10,10,15,0.45) 0%, rgba(10,10,15,0.82) 100%)",
    navBg: "rgba(10,10,15,0.85)",
  },
  minimal: {
    fonts: "Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700",
    headingFont: "'Playfair Display', serif", bodyFont: "'Inter', sans-serif",
    primary: "#1a1a1a", primaryDark: "#000000", accent: "#c9a84c",
    bg: "#fafaf8", surface: "#ffffff", text: "#1a1a1a", textMuted: "#6b7280",
    gradient: "linear-gradient(135deg, #1a1a1a, #404040)",
    heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.62) 100%)",
    navBg: "rgba(250,250,248,0.92)",
  },
  startup: {
    fonts: "Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800",
    headingFont: "'Syne', sans-serif", bodyFont: "'Plus Jakarta Sans', sans-serif",
    primary: "#0ea5e9", primaryDark: "#0284c7", accent: "#10b981",
    bg: "#020617", surface: "#0f172a", text: "#f1f5f9", textMuted: "#64748b",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)",
    heroOverlay: "linear-gradient(to bottom, rgba(2,6,23,0.35) 0%, rgba(2,6,23,0.82) 100%)",
    navBg: "rgba(2,6,23,0.88)",
  },
  creative: {
    fonts: "DM+Sans:wght@300;400;500;700&family=Cormorant+Garamond:wght@400;500;600;700",
    headingFont: "'Cormorant Garamond', serif", bodyFont: "'DM Sans', sans-serif",
    primary: "#ec4899", primaryDark: "#be185d", accent: "#f97316",
    bg: "#0c0c0c", surface: "#1a1a1a", text: "#fafafa", textMuted: "#a1a1aa",
    gradient: "linear-gradient(135deg, #ec4899, #f97316, #eab308)",
    heroOverlay: "linear-gradient(to bottom, rgba(12,12,12,0.28) 0%, rgba(12,12,12,0.78) 100%)",
    navBg: "rgba(12,12,12,0.88)",
  },
  corporate: {
    fonts: "Nunito+Sans:wght@300;400;600;700;800&family=Merriweather:wght@400;700",
    headingFont: "'Merriweather', serif", bodyFont: "'Nunito Sans', sans-serif",
    primary: "#1e40af", primaryDark: "#1e3a8a", accent: "#0891b2",
    bg: "#f8fafc", surface: "#ffffff", text: "#0f172a", textMuted: "#475569",
    gradient: "linear-gradient(135deg, #1e40af, #1e3a8a)",
    heroOverlay: "linear-gradient(to bottom, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.72) 100%)",
    navBg: "rgba(248,250,252,0.95)",
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE FETCHING
// ─────────────────────────────────────────────────────────────────────────────

function extractSearchQuery(name: string, description: string): string {
  const combined = `${name} ${description}`.toLowerCase()
  const stopWords = new Set([
    "a","an","the","with","and","or","for","to","of","in","on","at","by","from",
    "website","site","page","web","online","app","platform","create","build","make",
    "modern","professional","beautiful","stunning","elegant","design","style",
    "featuring","includes","has","have","that","this","is","are","was","were",
    "will","would","can","could","should","may","might","must","shall",
  ])
  const words = combined.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
  return [...new Set(words)].slice(0, 4).join(" ") || name
}

async function tryFetch(url: string, headers: Record<string, string> = {}): Promise<Response | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, { headers, signal: controller.signal })
    clearTimeout(timer)
    return res.ok ? res : null
  } catch {
    return null
  }
}

async function fetchImages(name: string, description: string, slug: string, count: number): Promise<string[]> {
  const query = extractSearchQuery(name, description)

  if (process.env.PEXELS_API_KEY) {
    const res = await tryFetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&size=large`,
      { Authorization: process.env.PEXELS_API_KEY }
    )
    if (res) {
      const data = await res.json()
      const urls: string[] = (data.photos ?? []).map((p: { src: { large2x?: string; large?: string } }) => p.src.large2x || p.src.large).filter(Boolean)
      if (urls.length >= Math.ceil(count / 2)) return urls
    }
  }

  if (process.env.PIXABAY_API_KEY) {
    const res = await tryFetch(
      `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${count}&safesearch=true&min_width=1200`
    )
    if (res) {
      const data = await res.json()
      const urls: string[] = (data.hits ?? []).map((h: { largeImageURL?: string; webformatURL?: string }) => h.largeImageURL || h.webformatURL).filter(Boolean)
      if (urls.length >= Math.ceil(count / 2)) return urls
    }
  }

  const ovRes = await tryFetch(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${count}&license_type=commercial,modification`
  )
  if (ovRes) {
    const data = await ovRes.json()
    const urls: string[] = (data.results ?? []).map((r: { url?: string }) => r.url).filter(Boolean)
    if (urls.length >= Math.ceil(count / 2)) return urls
  }

  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${slug}-${i}/1200/800`)
}

interface ImageSet {
  hero: string
  features: [string, string, string, string]
  galleryLarge: string
  gallerySmall: [string, string, string]
  all: string[]
}

async function fetchImageSet(name: string, description: string, slug: string): Promise<ImageSet> {
  const images = await fetchImages(name, description, slug, 12)
  const get = (i: number) => images[i] || `https://picsum.photos/seed/${slug}-fb${i}/1200/800`
  const all = Array.from({ length: 9 }, (_, i) => get(i))
  return {
    hero: get(0),
    features: [get(1), get(2), get(3), get(4)],
    galleryLarge: get(5),
    gallerySmall: [get(6), get(7), get(8)],
    all,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORCE REAL IMAGES
// ─────────────────────────────────────────────────────────────────────────────

function forceRealImages(html: string, imageSet: ImageSet): string {
  let idx = 0
  return html.replace(/https:\/\/picsum\.photos\/[^"'\s)]*/g, () => {
    const url = imageSet.all[idx % imageSet.all.length]
    idx++
    return url
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// BROKEN IMAGE FIXER
// ─────────────────────────────────────────────────────────────────────────────

const TRUSTED_IMAGE_DOMAINS = [
  "picsum.photos","images.pexels.com","cdn.pixabay.com","pixabay.com",
  "live.staticflickr.com","upload.wikimedia.org","wordpress.org","openverse.org",
]

async function fixBrokenImages(html: string, slug: string): Promise<string> {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*/g
  const matches = [...html.matchAll(imgRegex)]
  if (matches.length === 0) return html

  const uniqueUrls = [...new Set(matches.map(m => m[1]))]

  const checkUrl = async (url: string): Promise<{ url: string; ok: boolean }> => {
    if (TRUSTED_IMAGE_DOMAINS.some(d => url.includes(d))) return { url, ok: true }
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" })
      clearTimeout(timer)
      return { url, ok: res.ok }
    } catch {
      return { url, ok: false }
    }
  }

  const results = await Promise.race([
    Promise.all(uniqueUrls.map(checkUrl)),
    new Promise<{ url: string; ok: boolean }[]>((resolve) =>
      setTimeout(() => resolve(uniqueUrls.map(u => ({ url: u, ok: true }))), 5000)
    ),
  ])

  const broken = new Set(results.filter(r => !r.ok).map(r => r.url))
  if (broken.size === 0) return html

  let fixed = html
  let i = 0
  for (const url of broken) {
    fixed = fixed.split(url).join(`https://picsum.photos/seed/${slug}-fb${i}/800/600`)
    i++
  }
  return fixed
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML SANITIZER
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeGeneratedHtml(html: string, theme: typeof styleThemes[string]): string {
  let s = html

  const classFixes: [RegExp, string][] = [
    [/\btext-text-muted\b/g, "text-theme-muted"],
    [/\btext-muted\b/g, "text-theme-muted"],
    [/\btext-text\b/g, "text-theme-text"],
    [/\bbg-bg\b/g, "bg-theme-bg"],
    [/\bbg-muted\b/g, "bg-surface"],
    [/\bborder-muted\b/g, "border-surface"],
    [/\bhover:text-text-muted\b/g, "hover:text-theme-muted"],
    [/\bhover:text-muted\b/g, "hover:text-theme-muted"],
    [/\bfocus:text-muted\b/g, "focus:text-theme-muted"],
    [/\bplaceholder-muted\b/g, "placeholder-theme-muted"],
    [/\bdivide-muted\b/g, "divide-surface"],
  ]
  for (const [pattern, replacement] of classFixes) s = s.replace(pattern, replacement)

  s = s.replace(
    /(-webkit-text-fill-color\s*:\s*transparent)((?:(?!background-clip)[^}])*?)(})/g,
    (match, fill, middle, close) => {
      if (middle.includes("background-clip")) return match
      return `${fill}; background-clip: text${middle}${close}`
    }
  )

  if (s.includes("cdn.tailwindcss.com") && !s.includes("tailwind.config")) {
    const config = `<script>
tailwind.config={theme:{extend:{colors:{
  primary:'${theme.primary}','primary-dark':'${theme.primaryDark}',
  accent:'${theme.accent}',surface:'${theme.surface}',
  'theme-bg':'${theme.bg}','theme-text':'${theme.text}','theme-muted':'${theme.textMuted}'
}}}}
</script>\n`
    s = s.replace('<script src="https://cdn.tailwindcss.com"', config + '<script src="https://cdn.tailwindcss.com"')
  }

  s = s.replace(
    /(<img\b(?:(?!min-h)[^>])*class="(?:(?!min-h)[^"])*object-cover(?:[^"]*)"[^>]*>)/g,
    (match) => {
      if (match.includes("h-full") || match.includes("min-h")) return match
      return match.replace("object-cover", "object-cover min-h-[200px]")
    }
  )

  // Fix Alpine.js mobile menu flash
  if (!s.includes('[x-cloak]')) {
    s = s.replace('<style>', '<style>[x-cloak]{display:none!important}')
  }
  s = s.replace(/(<(?:div|nav|ul)\b[^>]*\bx-show\b[^>]*>)/g, (match) => {
    if (match.includes('x-cloak')) return match
    return match.replace(/^<(div|nav|ul)/, '<$1 x-cloak')
  })
  s = s.replace(/x-data=["']\{([^"']*)\bopen\s*:\s*true([^"']*)\}["']/g,
    (match) => match.replace('open: true', 'open: false').replace('open:true', 'open:false')
  )

  const safetyScript = `<script>
(function(){
  function revealFadeIns(){ document.querySelectorAll('.fade-in').forEach(function(el){ el.classList.add('visible'); }); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', revealFadeIns); } else { revealFadeIns(); }
  setTimeout(revealFadeIns, 900);
  window.addEventListener('load', revealFadeIns);
})();
</script>`

  s = s.includes("</body>") ? s.replace("</body>", safetyScript + "\n</body>") : s + safetyScript
  return s
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { name, description, style } = body
    if (!name || !description || !style) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from("profiles").select("credits, is_admin").eq("id", user.id).single()

    if (!profile || (!profile.is_admin && profile.credits < 1))
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })

    const theme = styleThemes[style] || styleThemes.modern
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    const imageSet = await fetchImageSet(name, description, slug)

    const systemPrompt = `You are a world-class senior frontend developer at a $500M/yr digital agency. Your job is to write ONE complete, self-contained HTML file that looks like a $50,000 custom website.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Business name: ${name}
Description:   ${description}
Visual style:  ${style}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULE — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY the raw HTML starting with <!DOCTYPE html>
NO markdown. NO code fences. NO explanation. NO truncation.
You MUST output ALL 9 sections listed below — no skipping, no placeholders.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEAD — copy this EXACTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="[write a real 1-sentence description for ${name}]">
<title>${name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${theme.fonts}&display=swap" rel="stylesheet">
<script>
  tailwind.config = {
    theme: { extend: { colors: {
      primary: '${theme.primary}',
      'primary-dark': '${theme.primaryDark}',
      accent: '${theme.accent}',
      surface: '${theme.surface}',
      'theme-bg': '${theme.bg}',
      'theme-text': '${theme.text}',
      'theme-muted': '${theme.textMuted}',
    }}}
  }
</script>
<script src="https://cdn.tailwindcss.com"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<style>
[x-cloak] { display: none !important; }
:root {
  --primary: ${theme.primary};
  --primary-dark: ${theme.primaryDark};
  --accent: ${theme.accent};
  --bg: ${theme.bg};
  --surface: ${theme.surface};
  --text: ${theme.text};
  --text-muted: ${theme.textMuted};
  --heading-font: ${theme.headingFont};
  --body-font: ${theme.bodyFont};
  --gradient: ${theme.gradient};
  --radius: 12px;
  --radius-lg: 20px;
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.08);
  --shadow: 0 4px 24px rgba(0,0,0,0.14);
  --shadow-lg: 0 12px 48px rgba(0,0,0,0.22);
  --transition: 0.3s cubic-bezier(0.4,0,0.2,1);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body {
  font-family: var(--body-font);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
h1, h2, h3, h4, h5, h6 { font-family: var(--heading-font); line-height: 1.15; }
a { text-decoration: none; color: inherit; }
img { display: block; max-width: 100%; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section { padding: 96px 0; }
.section-sm { padding: 72px 0; }

/* Eyebrow label */
.eyebrow {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
}

/* Section heading */
.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}
.section-subtitle {
  font-size: 1.125rem;
  color: var(--text-muted);
  max-width: 600px;
  line-height: 1.7;
  margin-bottom: 48px;
}

/* Gradient text */
.gradient-text {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Accent underline bar */
.accent-bar {
  display: block;
  width: 56px;
  height: 4px;
  background: var(--gradient);
  border-radius: 9999px;
  margin: 14px 0 40px;
}
.accent-bar.center { margin: 14px auto 40px; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  border: none;
  transition: transform var(--transition), opacity var(--transition), box-shadow var(--transition);
  white-space: nowrap;
}
.btn:hover { transform: translateY(-2px); }
.btn-primary {
  background: var(--gradient);
  color: #fff;
  box-shadow: 0 4px 20px rgba(99,102,241,0.35);
}
.btn-primary:hover { opacity: 0.92; box-shadow: 0 8px 30px rgba(99,102,241,0.45); }
.btn-outline {
  background: transparent;
  color: #fff;
  border: 2px solid rgba(255,255,255,0.35);
  backdrop-filter: blur(8px);
}
.btn-outline:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.6); }
.btn-accent {
  background: var(--accent);
  color: #fff;
}

/* Cards */
.card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);
}
.card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }

/* Feature icon */
.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 24px;
}

/* Star rating */
.stars { color: #f59e0b; font-size: 18px; letter-spacing: 2px; margin-bottom: 12px; }

/* Counter */
.stat-number {
  font-family: var(--heading-font);
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 900;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

/* Fade-in animation */
.fade-in {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.65s ease, transform 0.65s ease;
}
.fade-in.visible { opacity: 1; transform: none; }
.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }
.delay-4 { transition-delay: 0.4s; }

/* Nav link underline */
.nav-link { position: relative; transition: color var(--transition); }
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -3px; left: 0;
  width: 0; height: 2px;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}
.nav-link:hover::after { width: 100%; }

/* Gallery caption */
.gallery-item { position: relative; overflow: hidden; border-radius: var(--radius-lg); }
.gallery-item img { transition: transform 0.5s ease; width: 100%; height: 100%; object-fit: cover; }
.gallery-item:hover img { transform: scale(1.06); }
.gallery-caption {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
  display: flex; align-items: flex-end; padding: 20px;
  opacity: 0; transition: opacity 0.3s ease;
}
.gallery-item:hover .gallery-caption { opacity: 1; }

/* Testimonial avatar */
.avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex; align-items: center;
  font-weight: 700; font-size: 18px; color: #fff;
  background: var(--gradient);
  flex-shrink: 0;
  justify-content: center;
}

/* Scroll indicator */
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
.scroll-indicator { animation: bounce 1.6s ease-in-out infinite; }

/* Responsive grid helpers */
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
@media (max-width: 900px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
  .section { padding: 72px 0; }
}
@media (max-width: 600px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
  .section { padding: 56px 0; }
  .section-title { font-size: 1.875rem; }
  .btn { padding: 12px 24px; font-size: 0.875rem; }
}
</style>
</head>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED SECTIONS — ALL 9 ARE MANDATORY
Write each section in full. No placeholder text. All content must be relevant to "${name}" and "${description}".
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

════════════════════════════════════════
SECTION 1: NAVBAR
════════════════════════════════════════
- Fixed at top, glass morphism (backdrop-filter blur), z-index 9999
- Left: logo (brand name in heading font + optional SVG icon)
- Center/Right desktop: 5 nav links (Home, About, Services, Gallery, Contact) + CTA button
- Mobile: hamburger using Alpine.js x-data="{ open: false }"
- Hamburger button: class="md:hidden" ONLY
- Desktop links container: class="hidden md:flex items-center gap-8"
- Mobile dropdown: x-show="open" x-cloak — links stack vertically
- NEVER apply transform/filter/will-change to hero or its wrappers
- Style: style="position:fixed;top:0;left:0;right:0;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);background:${theme.navBg};z-index:9999;border-bottom:1px solid rgba(255,255,255,0.08);"

════════════════════════════════════════
SECTION 2: HERO (full viewport, NO fade-in on hero text)
════════════════════════════════════════
- Outer: style="position:relative;width:100%;height:100vh;overflow:hidden;margin-top:0"
- Image: <img src="https://picsum.photos/seed/${slug}-hero/1920/1080" alt="Hero" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;">
- Overlay: <div style="position:absolute;inset:0;background:${theme.heroOverlay}"></div>
- Content: position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px;z-index:2
- H1: clamp(3rem,7vw,5.5rem), font-weight:900, letter-spacing:-0.03em, color:#fff, margin-bottom:24px. Key words get gradient-text class
- Subheading: font-size:1.25rem, color:rgba(255,255,255,0.8), max-width:600px, margin:0 auto 40px
- 2 buttons: btn btn-primary + btn btn-outline side by side (flex gap-4 justify-center flex-wrap)
- Scroll arrow at bottom: position:absolute;bottom:32px;left:50%;transform:translateX(-50%)

════════════════════════════════════════
SECTION 3: STATS (4 animated counters)
════════════════════════════════════════
- Background contrasts with hero (use var(--surface) or a solid color)
- 4 stat blocks in a 4-column grid, each with:
  • <div class="stat-number counter" data-target="[NUMBER]" data-suffix="[+/%/k]">0</div>
  • Bold label below
  • Optional small description
- Pick realistic numbers relevant to "${name}"

════════════════════════════════════════
SECTION 4: ABOUT / INTRO
════════════════════════════════════════
- 2-column layout: left = text (eyebrow, h2, body copy 2–3 paragraphs, CTA button), right = image
- Image: https://picsum.photos/seed/${slug}-about/800/600  height: 480px, border-radius var(--radius-lg)
- Write genuine copy about the business

════════════════════════════════════════
SECTION 5: FEATURES / SERVICES (4 cards)
════════════════════════════════════════
- Centered header: eyebrow + h2 + accent-bar.center + subtitle
- 4 cards in a 4-column grid (responsive to 2-col then 1-col)
- Each card has:
  • Feature icon div with an emoji or SVG inside
  • h3 title (relevant service/feature)
  • p description (2–3 real sentences)
- Cards have fade-in delay-1 through delay-4
- Images for cards: https://picsum.photos/seed/${slug}-f1/600/400 etc.

════════════════════════════════════════
SECTION 6: GALLERY (1 large + 3 small)
════════════════════════════════════════
- Section background: use surface color
- Centered header
- CSS Grid layout:
  Left column (60% wide): 1 large gallery-item, height: 520px
  Right column (40% wide): 3 stacked gallery-items, each height: 160px, gap 12px
- Images:
  Large:  https://picsum.photos/seed/${slug}-g1/900/600
  Small1: https://picsum.photos/seed/${slug}-g2/600/400
  Small2: https://picsum.photos/seed/${slug}-g3/600/400
  Small3: https://picsum.photos/seed/${slug}-g4/600/400
- Each gallery-item has a gallery-caption div with a short white label

════════════════════════════════════════
SECTION 7: TESTIMONIALS (3 cards)
════════════════════════════════════════
- Centered header
- 3-column card grid
- Each card (bg: var(--surface), padding 32px, border-radius var(--radius-lg)):
  • Opening quote SVG icon (large, gradient color, 40px)
  • Stars: ★★★★★
  • Quote text (2–3 sentences, genuine-sounding)
  • Bottom: avatar div + name + title/company
- Write 3 completely different reviewers with different names, roles, companies

════════════════════════════════════════
SECTION 8: CALL TO ACTION
════════════════════════════════════════
- Full-width band: style="background:var(--gradient);padding:96px 24px;text-align:center"
- Large white heading (clamp 2rem to 3.5rem)
- White subtext paragraph
- 1–2 white/outline buttons
- Optional decorative background elements (CSS circles, blurs)

════════════════════════════════════════
SECTION 9: FOOTER
════════════════════════════════════════
- Dark background (var(--bg) or #0a0a0f)
- 4-column grid: Brand column + 3 link columns (Services, Company, Contact)
- Brand column: logo + 2-sentence description + social icons row
- Social icons (Facebook, X, Instagram, LinkedIn, YouTube) — use the exact SVGs below:
  Wrap each in: <a href="#" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);transition:all 0.2s;text-decoration:none;" onmouseover="this.style.color='#fff';this.style.borderColor='rgba(255,255,255,0.5)'" onmouseout="this.style.color='rgba(255,255,255,0.5)';this.style.borderColor='rgba(255,255,255,0.15)'">

  Facebook:
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>

  X (Twitter):
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>

  Instagram:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>

  LinkedIn:
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>

  YouTube:
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>

- Link columns: 5 links each (use real-sounding anchor tags with href="#")
- Bottom bar: border-top 1px solid rgba(255,255,255,0.08), flex row, "© 2025 ${name}. All rights reserved." + "Built with PNG Website Builders"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCRIPTS — place before </body>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<script>
// Intersection Observer for fade-in
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-in').forEach(el => {
  if (el.getBoundingClientRect().top < window.innerHeight) {
    el.classList.add('visible');
  } else {
    io.observe(el);
  }
});

// Navbar scroll shadow
const navbar = document.querySelector('nav') || document.querySelector('[data-nav]');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 50 ? '0 4px 32px rgba(0,0,0,0.28)' : 'none';
  }, { passive: true });
}

// Animated counters
document.querySelectorAll('.counter').forEach(el => {
  const target = parseInt(el.dataset.target || '0', 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const step = target / (duration / 16);
  let current = 0;
  const cio = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    cio.disconnect();
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString() + suffix;
    }, 16);
  }, { threshold: 0.5 });
  cio.observe(el);
});
</script>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY CHECKLIST — verify before outputting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ All 9 sections present and fully written (no "Lorem ipsum", no "Coming soon")
✓ All copy is specific to "${name}" and "${description}"
✓ Every <img> has: src, alt, style or class with explicit width/height/object-fit
✓ Hero is exactly 100vh, overlay present, text visible
✓ Navbar is fixed (position:fixed), z-index 9999, hamburger menu uses x-data="{open:false}"
✓ Stats have data-target and data-suffix on .counter elements
✓ Gallery has large image left + 3 small right
✓ 3 testimonial cards with different real-sounding names
✓ CTA section uses the gradient background
✓ Footer has 4 columns + social icons + bottom bar
✓ All scripts are before </body>
✓ No truncation — output the COMPLETE HTML file`

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pngwebsitebuilders.site",
        "X-Title": "PNG Website Builders",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Build the complete premium website for "${name}". Description: ${description}. Style: ${style}. Output the full HTML now — all 9 sections, no truncation, no placeholders.`,
          },
        ],
        max_tokens: 16000,
        temperature: 0.55,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: { error?: string } = {}
      try { errorData = JSON.parse(errorText) } catch { /* non-JSON body */ }
      console.error("OpenRouter error:", response.status, errorText)
      if (response.status === 429) return NextResponse.json({ error: "AI is rate limited. Please wait 30 seconds and try again." }, { status: 429 })
      if (response.status === 503 || response.status === 502) return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again shortly." }, { status: 503 })
      return NextResponse.json({ error: errorData.error || "Failed to generate website" }, { status: 500 })
    }

    const data = await response.json()
    const generatedHtml = data.choices?.[0]?.message?.content
    if (!generatedHtml) return NextResponse.json({ error: "No content generated" }, { status: 500 })

    let cleanHtml = generatedHtml.trim()
    if (cleanHtml.startsWith("```html")) cleanHtml = cleanHtml.slice(7)
    if (cleanHtml.startsWith("```")) cleanHtml = cleanHtml.slice(3)
    if (cleanHtml.endsWith("```")) cleanHtml = cleanHtml.slice(0, -3)
    cleanHtml = cleanHtml.trim()

    cleanHtml = sanitizeGeneratedHtml(cleanHtml, theme)
    cleanHtml = forceRealImages(cleanHtml, imageSet)
    cleanHtml = await fixBrokenImages(cleanHtml, slug)

    const previewSlug = nanoid(10)

    const { data: insertedSite, error: insertError } = await adminClient
      .from("generated_sites")
      .insert({ user_id: user.id, name, description, style, html_code: cleanHtml, preview_slug: previewSlug, credits_used: 1 })
      .select("id")
      .single()

    if (insertError) {
      console.error("Database error:", insertError)
      return NextResponse.json({ error: "Failed to save website" }, { status: 500 })
    }

    if (!profile.is_admin) {
      const { error: creditError } = await adminClient
        .from("profiles").update({ credits: profile.credits - 1 }).eq("id", user.id)
      if (creditError) console.error("Credit deduction error:", creditError)
    }

    return NextResponse.json({ success: true, previewSlug, siteId: insertedSite?.id || "", message: "Website generated successfully" })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

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
    heroOverlay: "linear-gradient(to bottom, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0.8) 100%)",
    navBg: "rgba(10,10,15,0.85)",
  },
  minimal: {
    fonts: "Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700",
    headingFont: "'Playfair Display', serif", bodyFont: "'Inter', sans-serif",
    primary: "#1a1a1a", primaryDark: "#000000", accent: "#c9a84c",
    bg: "#fafaf8", surface: "#ffffff", text: "#1a1a1a", textMuted: "#6b7280",
    gradient: "linear-gradient(135deg, #1a1a1a, #404040)",
    heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
    navBg: "rgba(250,250,248,0.92)",
  },
  startup: {
    fonts: "Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800",
    headingFont: "'Syne', sans-serif", bodyFont: "'Plus Jakarta Sans', sans-serif",
    primary: "#0ea5e9", primaryDark: "#0284c7", accent: "#10b981",
    bg: "#020617", surface: "#0f172a", text: "#f1f5f9", textMuted: "#64748b",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)",
    heroOverlay: "linear-gradient(to bottom, rgba(2,6,23,0.4) 0%, rgba(2,6,23,0.85) 100%)",
    navBg: "rgba(2,6,23,0.88)",
  },
  creative: {
    fonts: "DM+Sans:wght@300;400;500;700&family=Cormorant+Garamond:wght@400;500;600;700",
    headingFont: "'Cormorant Garamond', serif", bodyFont: "'DM Sans', sans-serif",
    primary: "#ec4899", primaryDark: "#be185d", accent: "#f97316",
    bg: "#0c0c0c", surface: "#1a1a1a", text: "#fafafa", textMuted: "#a1a1aa",
    gradient: "linear-gradient(135deg, #ec4899, #f97316, #eab308)",
    heroOverlay: "linear-gradient(to bottom, rgba(12,12,12,0.3) 0%, rgba(12,12,12,0.8) 100%)",
    navBg: "rgba(12,12,12,0.88)",
  },
  corporate: {
    fonts: "Nunito+Sans:wght@300;400;600;700;800&family=Merriweather:wght@400;700",
    headingFont: "'Merriweather', serif", bodyFont: "'Nunito Sans', sans-serif",
    primary: "#1e40af", primaryDark: "#1e3a8a", accent: "#0891b2",
    bg: "#f8fafc", surface: "#ffffff", text: "#0f172a", textMuted: "#475569",
    gradient: "linear-gradient(135deg, #1e40af, #1e3a8a)",
    heroOverlay: "linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.75) 100%)",
    navBg: "rgba(248,250,252,0.95)",
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE FETCHING — Pexels → Pixabay → Openverse → Picsum fallback
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

  // 1. Pexels
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

  // 2. Pixabay
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

  // 3. Openverse (no key)
  const ovRes = await tryFetch(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${count}&license_type=commercial,modification`
  )
  if (ovRes) {
    const data = await ovRes.json()
    const urls: string[] = (data.results ?? []).map((r: { url?: string }) => r.url).filter(Boolean)
    if (urls.length >= Math.ceil(count / 2)) return urls
  }

  // 4. Picsum fallback
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
// After AI generates HTML, replace every picsum URL the AI wrote
// with our real fetched images in order. Guarantees topic-relevant photos.
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
// BROKEN IMAGE FIXER — trusted CDN domains are never re-checked
// ─────────────────────────────────────────────────────────────────────────────

const TRUSTED_IMAGE_DOMAINS = [
  "picsum.photos",
  "images.pexels.com",
  "cdn.pixabay.com",
  "pixabay.com",
  "live.staticflickr.com",
  "upload.wikimedia.org",
  "wordpress.org",
  "openverse.org",
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
    const slug = name.toLowerCase().replace(/\s+/g, "-")

    // Fetch real topic-relevant images BEFORE building the prompt
    const imageSet = await fetchImageSet(name, description, slug)

    const systemPrompt = `You are a world-class UI/UX designer and senior frontend developer at a top-tier agency. Produce a stunning, professional, premium website. Every site should look like it cost $50,000 to build.

PROJECT:
- Name: ${name}
- Description: ${description}
- Style: ${style}

OUTPUT: Return ONLY a complete HTML document starting with <!DOCTYPE html>. No markdown, no code fences, no explanation.

═══════════════════════════════════════════
HEAD — exact order matters
═══════════════════════════════════════════
1. Meta tags (charset, viewport, description, title)
2. Google Fonts: <link href="https://fonts.googleapis.com/css2?family=${theme.fonts}&display=swap" rel="stylesheet">
3. Tailwind config BEFORE CDN:
<script>
  tailwind.config = {
    theme: { extend: { colors: {
      primary: '${theme.primary}', 'primary-dark': '${theme.primaryDark}',
      accent: '${theme.accent}', surface: '${theme.surface}',
      'theme-bg': '${theme.bg}', 'theme-text': '${theme.text}', 'theme-muted': '${theme.textMuted}',
    }}}
  }
</script>
4. Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
5. Alpine.js: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
6. <style> block

═══════════════════════════════════════════
DESIGN SYSTEM
═══════════════════════════════════════════
:root {
  --primary: ${theme.primary}; --primary-dark: ${theme.primaryDark}; --accent: ${theme.accent};
  --bg: ${theme.bg}; --surface: ${theme.surface}; --text: ${theme.text}; --text-muted: ${theme.textMuted};
  --heading-font: ${theme.headingFont}; --body-font: ${theme.bodyFont}; --gradient: ${theme.gradient};
  --radius: 12px; --radius-lg: 20px;
  --shadow: 0 4px 24px rgba(0,0,0,0.12); --shadow-lg: 0 12px 48px rgba(0,0,0,0.2);
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
body { font-family: var(--body-font); background: var(--bg); color: var(--text); scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
h1,h2,h3,h4 { font-family: var(--heading-font); }
.fade-in { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }
.delay-1 { transition-delay: 0.1s; } .delay-2 { transition-delay: 0.2s; } .delay-3 { transition-delay: 0.3s; } .delay-4 { transition-delay: 0.4s; }
.gradient-text { background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: inline-block; }
.accent-bar { display: block; width: 60px; height: 3px; background: var(--gradient); border-radius: 9999px; margin: 12px auto 0; }
.hover-lift { transition: transform var(--transition), box-shadow var(--transition); }
.hover-lift:hover { transform: translateY(-8px); box-shadow: var(--shadow-lg); }
.nav-link { position: relative; }
.nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: var(--primary); transition: width 0.3s ease; }
.nav-link:hover::after { width: 100%; }
.btn-primary { background: var(--gradient); color: white; border: none; border-radius: 9999px; padding: 14px 32px; font-weight: 600; cursor: pointer; transition: transform var(--transition), opacity var(--transition); }
.btn-primary:hover { transform: scale(1.05); opacity: 0.92; }
.btn-ghost { border: 2px solid rgba(255,255,255,0.35); backdrop-filter: blur(8px); color: white; border-radius: 9999px; padding: 14px 32px; font-weight: 600; cursor: pointer; transition: all var(--transition); }
.btn-ghost:hover { background: rgba(255,255,255,0.12); }

═══════════════════════════════════════════
COLOR CLASSES
═══════════════════════════════════════════
ONLY use: text-primary, text-accent, text-theme-muted, text-theme-text, bg-primary, bg-surface, bg-theme-bg, border-primary
FORBIDDEN: ✗ text-muted ✗ text-text-muted ✗ bg-bg ✗ bg-muted ✗ border-muted

═══════════════════════════════════════════
IMAGES — use picsum.photos for ALL images
Use unique seeds. Format: https://picsum.photos/seed/{descriptive-seed}/WIDTH/HEIGHT
Suggested seeds for "${name}":
- Hero:          https://picsum.photos/seed/${slug}-hero/1920/1080
- Feature 1:     https://picsum.photos/seed/${slug}-f1/800/600
- Feature 2:     https://picsum.photos/seed/${slug}-f2/800/600
- Feature 3:     https://picsum.photos/seed/${slug}-f3/800/600
- Feature 4:     https://picsum.photos/seed/${slug}-f4/800/600
- Gallery large: https://picsum.photos/seed/${slug}-g1/1200/800
- Gallery sm 1:  https://picsum.photos/seed/${slug}-g2/800/600
- Gallery sm 2:  https://picsum.photos/seed/${slug}-g3/800/600
- Gallery sm 3:  https://picsum.photos/seed/${slug}-g4/800/600

Image CSS rules:
- Every <img>: class="w-full h-full object-cover block"
- Every image container: explicit height ALWAYS
- Hero: style="height:100vh" class="relative w-full overflow-hidden"
- Cards: style="height:240px" class="w-full overflow-hidden"
- Gallery large: style="height:480px" | small: style="height:230px"
- loading="lazy" on every image except hero

═══════════════════════════════════════════
REQUIRED SECTIONS (8 total)
═══════════════════════════════════════════

1. NAVBAR — fixed, glass morphism, Alpine.js mobile menu
   style="position:fixed;top:0;width:100%;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);background:${theme.navBg};z-index:9999"
   CRITICAL: Never add z-index, transform, filter, will-change, or isolation to the <section> or <div> that wraps the hero image. These create stacking contexts that bury the fixed navbar.

2. HERO — full viewport, NO fade-in
   - Full-screen image height:100vh
   - Overlay: style="position:absolute;inset:0;background:${theme.heroOverlay}"
   - text-6xl md:text-8xl font-black with gradient-text on key words
   - btn-primary + btn-ghost buttons
   - Bouncing scroll arrow

3. STATS — 4 animated counters, contrasting bg

4. FEATURES — 4 cards, fade-in delay-1 through delay-4, hover-lift

5. GALLERY — 1 large left + 3 small right, group hover captions

6. TESTIMONIALS — 3 cards, quote SVG, 5 stars, gradient avatar initials

7. CTA — style="background:var(--gradient)", white text + button

8. FOOTER — 4-col dark, bottom bar "© 2025 ${name}" + "Built with PNG Website Builders"
   Social icons — copy these EXACT SVGs, each inside:
   <a href="#" class="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/60 transition-colors">

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

═══════════════════════════════════════════
SCRIPTS before </body>
═══════════════════════════════════════════
<script>
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObs.unobserve(entry.target); }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { el.classList.add('visible'); } else { revealObs.observe(el); }
  });
  const navbar = document.querySelector('nav');
  if (navbar) { window.addEventListener('scroll', () => { navbar.style.boxShadow = window.scrollY > 60 ? '0 4px 30px rgba(0,0,0,0.25)' : 'none'; }); }
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.getAttribute('data-target') || '0');
    const suffix = el.getAttribute('data-suffix') || '';
    const step = target / 120; let current = 0;
    const cObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const timer = setInterval(() => { current += step; if (current >= target) { current = target; clearInterval(timer); } el.textContent = Math.floor(current).toLocaleString() + suffix; }, 16);
        cObs.unobserve(el);
      }
    });
    cObs.observe(el);
  });
</script>

═══════════════════════════════════════════
PREMIUM QUALITY RULES
═══════════════════════════════════════════
- Section padding: py-24 minimum (py-32 for hero and CTA)
- All content: max-w-7xl mx-auto px-6
- Every section has an eyebrow label (text-xs uppercase tracking-widest font-semibold text-accent mb-3)
- Every section subtitle followed by: <span class="accent-bar"></span>
- Section headings: text-4xl md:text-5xl font-black tracking-tight
- Make it so impressive the user's first reaction is "wow"

Return the COMPLETE HTML document starting with <!DOCTYPE html>.`

    const response = await fetch(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pngwebsitebuilders.site",
        "X-Title": "PNG Website Builders",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a stunning, premium ${style} website for: ${name}. ${description}` },
        ],
        max_tokens: 16000,
        temperature: 0.65,
        route: "fallback",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenRouter error:", response.status, errorData)
      if (response.status === 429) return NextResponse.json({ error: "AI is rate limited. Please wait 30 seconds and try again." }, { status: 429 })
      if (response.status === 503 || response.status === 502) return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again shortly." }, { status: 503 })
      return NextResponse.json({ error: "Failed to generate website" }, { status: 500 })
    }

    const data = await response.json()
    const generatedHtml = data.choices?.[0]?.message?.content
    if (!generatedHtml) return NextResponse.json({ error: "No content generated" }, { status: 500 })

    let cleanHtml = generatedHtml.trim()
    if (cleanHtml.startsWith("```html")) cleanHtml = cleanHtml.slice(7)
    if (cleanHtml.startsWith("```")) cleanHtml = cleanHtml.slice(3)
    if (cleanHtml.endsWith("```")) cleanHtml = cleanHtml.slice(0, -3)
    cleanHtml = cleanHtml.trim()

    // Step 1: Fix class names, missing config, gradient text
    cleanHtml = sanitizeGeneratedHtml(cleanHtml, theme)

    // Step 2: Replace every picsum URL the AI used with our real fetched images
    cleanHtml = forceRealImages(cleanHtml, imageSet)

    // Step 3: Check any remaining unknown URLs — trusted CDN domains skipped
    cleanHtml = await fixBrokenImages(cleanHtml, slug)

    const previewSlug = nanoid(10)

    const { error: insertError } = await adminClient
      .from("generated_sites")
      .insert({ user_id: user.id, name, description, style, html_code: cleanHtml, preview_slug: previewSlug, credits_used: 1 })

    if (insertError) {
      console.error("Database error:", insertError)
      return NextResponse.json({ error: "Failed to save website" }, { status: 500 })
    }

    if (!profile.is_admin) {
      const { error: creditError } = await adminClient
        .from("profiles").update({ credits: profile.credits - 1 }).eq("id", user.id)
      if (creditError) console.error("Credit deduction error:", creditError)
    }

    return NextResponse.json({ success: true, previewSlug, message: "Website generated successfully" })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

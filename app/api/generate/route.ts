import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

// ─────────────────────────────────────────────────────────────────────────────
// THEME DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const styleThemes: Record<string, {
  fonts: string
  headingFont: string
  bodyFont: string
  primary: string
  primaryDark: string
  accent: string
  bg: string
  surface: string
  text: string
  textMuted: string
  gradient: string
  heroOverlay: string
  navBg: string
}> = {
  modern: {
    fonts: "Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700",
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Inter', sans-serif",
    primary: "#6366f1",
    primaryDark: "#4f46e5",
    accent: "#f59e0b",
    bg: "#0a0a0f",
    surface: "#13131a",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
    heroOverlay: "linear-gradient(to bottom, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0.8) 100%)",
    navBg: "rgba(10,10,15,0.85)",
  },
  minimal: {
    fonts: "Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    primary: "#1a1a1a",
    primaryDark: "#000000",
    accent: "#c9a84c",
    bg: "#fafaf8",
    surface: "#ffffff",
    text: "#1a1a1a",
    textMuted: "#6b7280",
    gradient: "linear-gradient(135deg, #1a1a1a, #404040)",
    heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
    navBg: "rgba(250,250,248,0.92)",
  },
  startup: {
    fonts: "Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800",
    headingFont: "'Syne', sans-serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    primary: "#0ea5e9",
    primaryDark: "#0284c7",
    accent: "#10b981",
    bg: "#020617",
    surface: "#0f172a",
    text: "#f1f5f9",
    textMuted: "#64748b",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)",
    heroOverlay: "linear-gradient(to bottom, rgba(2,6,23,0.4) 0%, rgba(2,6,23,0.85) 100%)",
    navBg: "rgba(2,6,23,0.88)",
  },
  creative: {
    fonts: "DM+Sans:wght@300;400;500;700&family=Cormorant+Garamond:wght@400;500;600;700",
    headingFont: "'Cormorant Garamond', serif",
    bodyFont: "'DM Sans', sans-serif",
    primary: "#ec4899",
    primaryDark: "#be185d",
    accent: "#f97316",
    bg: "#0c0c0c",
    surface: "#1a1a1a",
    text: "#fafafa",
    textMuted: "#a1a1aa",
    gradient: "linear-gradient(135deg, #ec4899, #f97316, #eab308)",
    heroOverlay: "linear-gradient(to bottom, rgba(12,12,12,0.3) 0%, rgba(12,12,12,0.8) 100%)",
    navBg: "rgba(12,12,12,0.88)",
  },
  corporate: {
    fonts: "Nunito+Sans:wght@300;400;600;700;800&family=Merriweather:wght@400;700",
    headingFont: "'Merriweather', serif",
    bodyFont: "'Nunito Sans', sans-serif",
    primary: "#1e40af",
    primaryDark: "#1e3a8a",
    accent: "#0891b2",
    bg: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    textMuted: "#475569",
    gradient: "linear-gradient(135deg, #1e40af, #1e3a8a)",
    heroOverlay: "linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.75) 100%)",
    navBg: "rgba(248,250,252,0.95)",
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// BROKEN IMAGE FIXER
// Checks every <img> src in the HTML concurrently and replaces non-200 URLs
// with guaranteed Picsum fallbacks. Capped at 5 seconds total.
// ─────────────────────────────────────────────────────────────────────────────

async function fixBrokenImages(html: string, slug: string): Promise<string> {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*/g
  const matches = [...html.matchAll(imgRegex)]
  if (matches.length === 0) return html

  // Deduplicate URLs to avoid redundant checks
  const uniqueUrls = [...new Set(matches.map(m => m[1]))]

  const timeoutMs = 5000
  const checkUrl = async (url: string): Promise<{ url: string; ok: boolean }> => {
    // Picsum URLs are always reliable — skip the network check
    if (url.includes("picsum.photos")) return { url, ok: true }
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      })
      clearTimeout(timer)
      return { url, ok: res.ok }
    } catch {
      return { url, ok: false }
    }
  }

  // Run all checks with an overall timeout
  const results = await Promise.race([
    Promise.all(uniqueUrls.map(checkUrl)),
    new Promise<{ url: string; ok: boolean }[]>((resolve) =>
      setTimeout(() => resolve(uniqueUrls.map(u => ({ url: u, ok: true }))), timeoutMs)
    ),
  ])

  const broken = new Set(results.filter(r => !r.ok).map(r => r.url))
  if (broken.size === 0) return html

  let fixed = html
  let i = 0
  for (const url of broken) {
    const fallback = `https://picsum.photos/seed/${slug}-fb${i}/800/600`
    // Replace all occurrences of this broken URL
    fixed = fixed.split(url).join(fallback)
    i++
  }

  return fixed
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML SANITIZER
// Fixes common AI output mistakes after generation, before saving to DB.
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeGeneratedHtml(html: string, theme: typeof styleThemes[string]): string {
  let s = html

  // ── Fix 1: Bad Tailwind color class names ────────────────────────────────
  const classFixes: [RegExp, string][] = [
    [/\btext-text-muted\b/g,          "text-theme-muted"],
    [/\btext-muted\b/g,               "text-theme-muted"],
    [/\btext-text\b/g,                "text-theme-text"],
    [/\bbg-bg\b/g,                    "bg-theme-bg"],
    [/\bbg-muted\b/g,                 "bg-surface"],
    [/\bborder-muted\b/g,             "border-surface"],
    [/\bhover:text-text-muted\b/g,    "hover:text-theme-muted"],
    [/\bhover:text-muted\b/g,         "hover:text-theme-muted"],
    [/\bfocus:text-muted\b/g,         "focus:text-theme-muted"],
    [/\bplaceholder-muted\b/g,        "placeholder-theme-muted"],
    [/\bdivide-muted\b/g,             "divide-surface"],
  ]
  for (const [pattern, replacement] of classFixes) {
    s = s.replace(pattern, replacement)
  }

  // ── Fix 2: Gradient text — ensure background-clip: text exists ───────────
  s = s.replace(
    /(-webkit-text-fill-color\s*:\s*transparent)((?:(?!background-clip)[^}])*?)(})/g,
    (match, fill, middle, close) => {
      if (middle.includes("background-clip")) return match
      return `${fill}; background-clip: text${middle}${close}`
    }
  )

  // ── Fix 3: Missing tailwind.config — inject before CDN script ────────────
  if (s.includes("cdn.tailwindcss.com") && !s.includes("tailwind.config")) {
    const config = `<script>
tailwind.config={theme:{extend:{colors:{
  primary:'${theme.primary}',
  'primary-dark':'${theme.primaryDark}',
  accent:'${theme.accent}',
  surface:'${theme.surface}',
  'theme-bg':'${theme.bg}',
  'theme-text':'${theme.text}',
  'theme-muted':'${theme.textMuted}'
}}}}
</script>\n`
    s = s.replace(
      '<script src="https://cdn.tailwindcss.com"',
      config + '<script src="https://cdn.tailwindcss.com"'
    )
  }

  // ── Fix 4: Images without explicit height — add min-height fallback ───────
  s = s.replace(
    /(<img\b(?:(?!min-h)[^>])*class="(?:(?!min-h)[^"])*object-cover(?:[^"]*)"[^>]*>)/g,
    (match) => {
      if (match.includes("h-full") || match.includes("min-h")) return match
      return match.replace("object-cover", "object-cover min-h-[200px]")
    }
  )

  // ── Fix 5: Fade-in safety fallback script ────────────────────────────────
  // Always inject — it's idempotent (classList.add is a no-op if already present)
  const safetyScript = `<script>
(function(){
  function revealFadeIns(){
    document.querySelectorAll('.fade-in').forEach(function(el){
      el.classList.add('visible');
    });
  }
  // Reveal immediately for anything already in viewport
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', revealFadeIns);
  } else {
    revealFadeIns();
  }
  // Fallback: force-reveal everything after 900ms no matter what
  setTimeout(revealFadeIns, 900);
  // Final fallback on full page load
  window.addEventListener('load', revealFadeIns);
})();
</script>`

  if (s.includes("</body>")) {
    s = s.replace("</body>", safetyScript + "\n</body>")
  } else {
    s = s + safetyScript
  }

  return s
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, style } = body

    if (!name || !description || !style) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from("profiles")
      .select("credits, is_admin")
      .eq("id", user.id)
      .single()

    if (!profile || (!profile.is_admin && profile.credits < 1)) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    const theme = styleThemes[style] || styleThemes.modern
    const slug = name.toLowerCase().replace(/\s+/g, "-")

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
2. Google Fonts link: <link href="https://fonts.googleapis.com/css2?family=${theme.fonts}&display=swap" rel="stylesheet">
3. Tailwind config (MUST come BEFORE Tailwind CDN):
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '${theme.primary}',
          'primary-dark': '${theme.primaryDark}',
          accent: '${theme.accent}',
          surface: '${theme.surface}',
          'theme-bg': '${theme.bg}',
          'theme-text': '${theme.text}',
          'theme-muted': '${theme.textMuted}',
        }
      }
    }
  }
</script>
4. Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
5. Alpine.js: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
6. <style> block with CSS variables and custom classes (see below)

═══════════════════════════════════════════
DESIGN SYSTEM — define in <style> block
═══════════════════════════════════════════
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
  --shadow: 0 4px 24px rgba(0,0,0,0.12);
  --shadow-lg: 0 12px 48px rgba(0,0,0,0.2);
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
body { font-family: var(--body-font); background: var(--bg); color: var(--text); scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
h1,h2,h3,h4 { font-family: var(--heading-font); }
.fade-in { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }
.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }
.delay-4 { transition-delay: 0.4s; }
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
COLOR CLASSES — use EXACTLY these names
═══════════════════════════════════════════
These map to the tailwind.config above. Only use these — nothing else.
  text-primary       → ${theme.primary}
  text-accent        → ${theme.accent}
  text-theme-muted   → ${theme.textMuted}   ← use for secondary/muted text
  text-theme-text    → ${theme.text}        ← use for body text when needed
  bg-primary         → background ${theme.primary}
  bg-surface         → background ${theme.surface}
  bg-theme-bg        → background ${theme.bg}
  border-primary     → border ${theme.primary}

FORBIDDEN — never use these (they don't exist in Tailwind):
  ✗ text-muted  ✗ text-text-muted  ✗ text-text  ✗ bg-bg  ✗ bg-muted  ✗ border-muted

═══════════════════════════════════════════
IMAGES — Picsum Photos (always reliable)
═══════════════════════════════════════════
URL format: https://picsum.photos/seed/{seed}/{width}/{height}
- Use unique descriptive seeds per image based on the site topic
- Example seeds: ${slug}-hero, ${slug}-f1, ${slug}-f2, ${slug}-f3, ${slug}-f4, ${slug}-g1, ${slug}-g2, ${slug}-g3, ${slug}-g4, ${slug}-t1, ${slug}-t2

Image CSS rules (non-negotiable):
- Every <img>: class="w-full h-full object-cover block"
- Every image container: explicit height ALWAYS — style="height:Xpx" or h-64/h-72/h-80/h-96
- NEVER put an img in a container without explicit height
- Hero container: style="height:100vh" class="relative w-full overflow-hidden"
- Card containers: style="height:240px" class="w-full overflow-hidden"
- Gallery large: style="height:480px" | Gallery small: style="height:230px"
- loading="lazy" and descriptive alt text on every image

═══════════════════════════════════════════
REQUIRED SECTIONS (8 total, in this order)
═══════════════════════════════════════════

1. NAVBAR — sticky glass morphism
   - style="position:fixed;top:0;width:100%;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);background:${theme.navBg};z-index:50"
   - Logo: heading font, font-black, text-primary + small accent dot
   - Nav links: class="nav-link text-theme-muted hover:text-primary transition"
   - Mobile: Alpine.js x-data="{ open: false }" animated hamburger
   - CTA: class="btn-primary text-sm px-5 py-2"

2. HERO — full viewport (DO NOT add fade-in here — must be immediately visible)
   - Full-screen image (height:100vh, object-cover)
   - Dark overlay: style="position:absolute;inset:0;background:${theme.heroOverlay}"
   - Eyebrow: text-accent text-xs tracking-widest uppercase font-semibold
   - Heading: text-6xl md:text-8xl font-black tracking-tight — use <span class="gradient-text"> on key word(s)
   - Subheadline: text-xl text-white/80 max-w-2xl leading-relaxed
   - Two buttons: <button class="btn-primary"> and <button class="btn-ghost">
   - Bouncing scroll arrow at bottom (CSS animation)

3. STATS — social proof band
   - Contrasting bg (bg-primary or dark surface)
   - 4 stats: <span class="counter text-5xl font-black text-white" data-target="NUMBER" data-suffix="+">0</span>
   - Label: text-sm text-white/70 mt-1

4. FEATURES — 4 cards (class="fade-in delay-X" on each card)
   - Eyebrow + heading + accent-bar
   - 2x2 grid desktop / 1-col mobile
   - Each: image + title + description, class="hover-lift bg-surface rounded-2xl overflow-hidden"
   - Card border: border border-white/10 (dark themes) or border-gray-100 (light themes)

5. GALLERY — asymmetric layout (class="fade-in" on images)
   - 1 large left (height:480px) + 3 small right stacked (height:230px each)
   - All: rounded-2xl overflow-hidden
   - group hover dark overlay with caption text

6. TESTIMONIALS — 3 cards (class="fade-in delay-X" on each)
   - SVG quote mark, 5 gold stars, review text
   - Gradient avatar circle with initials, name, role beneath
   - bg-surface border border-white/10 rounded-2xl p-8

7. CTA SECTION (class="fade-in" on content)
   - style="background:var(--gradient)"
   - Bold white heading, white/80 subtext, white filled button
   - Optional CSS dot-grid overlay

8. FOOTER — multi-column professional
   - Dark bg, 4 cols: logo+tagline, nav, services, contact
   - Social icons as SVG in bordered circles
   - Bottom bar: "© 2025 ${name}" + "Built with PNG Website Builders"

═══════════════════════════════════════════
SCRIPTS — add BEFORE </body>
═══════════════════════════════════════════
<script>
  // Scroll fade-in with viewport check
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('visible');
    } else {
      revealObs.observe(el);
    }
  });

  // Navbar scroll shadow
  const navbar = document.querySelector('nav');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.style.boxShadow = window.scrollY > 60 ? '0 4px 30px rgba(0,0,0,0.25)' : 'none';
    });
  }

  // Animated counters
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.getAttribute('data-target') || '0');
    const suffix = el.getAttribute('data-suffix') || '';
    const step = target / 120;
    let current = 0;
    const cObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = Math.floor(current).toLocaleString() + suffix;
        }, 16);
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
      if (response.status === 429) {
        return NextResponse.json({ error: "AI is rate limited. Please wait 30 seconds and try again." }, { status: 429 })
      }
      if (response.status === 503 || response.status === 502) {
        return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again shortly." }, { status: 503 })
      }
      return NextResponse.json({ error: "Failed to generate website" }, { status: 500 })
    }

    const data = await response.json()
    const generatedHtml = data.choices?.[0]?.message?.content

    if (!generatedHtml) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 })
    }

    // Strip markdown code fences if present
    let cleanHtml = generatedHtml.trim()
    if (cleanHtml.startsWith("```html")) cleanHtml = cleanHtml.slice(7)
    if (cleanHtml.startsWith("```")) cleanHtml = cleanHtml.slice(3)
    if (cleanHtml.endsWith("```")) cleanHtml = cleanHtml.slice(0, -3)
    cleanHtml = cleanHtml.trim()

    // Step 1: Sanitize — fix bad class names, missing config, gradient text, fade-in fallback
    cleanHtml = sanitizeGeneratedHtml(cleanHtml, theme)

    // Step 2: Fix broken image URLs — replace any non-200 src with Picsum fallbacks
    cleanHtml = await fixBrokenImages(cleanHtml, slug)

    const previewSlug = nanoid(10)

    const { error: insertError } = await adminClient
      .from("generated_sites")
      .insert({
        user_id: user.id,
        name,
        description,
        style,
        html_code: cleanHtml,
        preview_slug: previewSlug,
        credits_used: 1,
      })

    if (insertError) {
      console.error("Database error:", insertError)
      return NextResponse.json({ error: "Failed to save website" }, { status: 500 })
    }

    if (!profile.is_admin) {
      const { error: creditError } = await adminClient
        .from("profiles")
        .update({ credits: profile.credits - 1 })
        .eq("id", user.id)

      if (creditError) {
        console.error("Credit deduction error:", creditError)
      }
    }

    return NextResponse.json({ success: true, previewSlug, message: "Website generated successfully" })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

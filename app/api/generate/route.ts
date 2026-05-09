import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

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
2. Google Fonts link
3. Tailwind config script (MUST come BEFORE Tailwind CDN):
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
6. <style> block with CSS variables and custom classes

═══════════════════════════════════════════
DESIGN SYSTEM — CSS variables in <style>
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

/* Fade-in animation */
.fade-in { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }
.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }
.delay-4 { transition-delay: 0.4s; }

/* Gradient text utility */
.gradient-text {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}

/* Gradient accent bar */
.accent-bar {
  display: block;
  width: 60px;
  height: 3px;
  background: var(--gradient);
  border-radius: 9999px;
  margin: 12px auto 0;
}

/* Card hover */
.hover-lift { transition: transform var(--transition), box-shadow var(--transition); }
.hover-lift:hover { transform: translateY(-8px); box-shadow: var(--shadow-lg); }

/* Nav link underline animation */
.nav-link { position: relative; }
.nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: var(--primary); transition: width 0.3s ease; }
.nav-link:hover::after { width: 100%; }

═══════════════════════════════════════════
COLOR USAGE — CRITICAL RULES
═══════════════════════════════════════════
ALWAYS use Tailwind color classes with the exact names from tailwind.config above.
These are the ONLY valid custom color classes:
- text-primary         → uses ${theme.primary}
- text-primary-dark    → uses ${theme.primaryDark}
- text-accent          → uses ${theme.accent}
- text-surface         → uses ${theme.surface}
- text-theme-text      → uses ${theme.text}
- text-theme-muted     → uses ${theme.textMuted}
- bg-primary           → background ${theme.primary}
- bg-surface           → background ${theme.surface}
- bg-theme-bg          → background ${theme.bg}
- border-primary       → border ${theme.primary}

NEVER use: text-muted, text-text-muted, text-text, bg-bg, bg-muted — these do not exist.
For muted/secondary text: use text-theme-muted
For body text color: use text-theme-text or just rely on body CSS (already set to var(--text))
For gradient text on headings: use class="gradient-text" (defined in CSS above)

═══════════════════════════════════════════
IMAGES — Picsum Photos
═══════════════════════════════════════════
URL format: https://picsum.photos/seed/{seed}/{width}/{height}
Use descriptive, unique seeds for every image based on the site topic.
Example seeds for "${name}": ${slug}-hero, ${slug}-f1, ${slug}-f2, ${slug}-f3, ${slug}-f4, ${slug}-g1, ${slug}-g2, ${slug}-g3, ${slug}-g4, ${slug}-t1, ${slug}-t2

Image CSS rules (non-negotiable):
- Every <img>: class="w-full h-full object-cover block"
- Every image container: explicit height ALWAYS (style="height:Xpx" or h-64/h-72/h-80/h-96)
- Hero container: style="height:100vh" class="relative w-full overflow-hidden"
- Card image containers: style="height:240px" class="w-full overflow-hidden"
- Gallery large: style="height:480px" | Gallery small: style="height:230px"
- loading="lazy" and descriptive alt on every image

═══════════════════════════════════════════
REQUIRED SECTIONS (8 total, in this order)
═══════════════════════════════════════════

1. NAVBAR — sticky glass morphism
   - style="position:fixed;top:0;width:100%;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);background:${theme.navBg};z-index:50"
   - Logo: heading font, font-black, text-primary with small accent dot
   - Desktop nav: links with class="nav-link text-theme-muted hover:text-primary"
   - Mobile: Alpine.js x-data="{ open: false }" hamburger
   - CTA: rounded-full bg-primary text-white px-6 py-2.5 font-semibold hover:bg-primary-dark transition

2. HERO — full viewport, cinematic (DO NOT add fade-in to hero text — it must be visible immediately)
   - Full-screen image (height:100vh, object-cover)
   - Overlay: style="background:${theme.heroOverlay}"
   - Eyebrow: small uppercase text-accent tracking-widest font-semibold
   - Heading: text-6xl md:text-8xl font-black tracking-tight — use class="gradient-text" on key words
   - Subheadline: text-xl text-theme-muted max-w-2xl leading-relaxed (use text-white/80 if on dark overlay)
   - Two CTAs: primary gradient button + glass outline button
   - Scroll indicator: CSS bouncing arrow at bottom

3. STATS — social proof band
   - Contrasting background (bg-primary or dark surface)
   - 4 stats: <span class="counter text-5xl font-black" data-target="NUMBER" data-suffix="+">0</span>
   - Label below each: text-sm text-white/70

4. FEATURES — 4 cards
   - Centered heading + accent-bar + eyebrow
   - 2x2 grid desktop / 1-col mobile
   - Each card: image top + title + description, class="hover-lift"
   - Card bg: bg-surface, border border-white/10 (dark) or border-gray-100 (light), rounded-2xl overflow-hidden

5. GALLERY — asymmetric layout
   - Large image left (height:480px) + 3 small images right (height:230px) in a 2-col grid
   - All rounded-2xl overflow-hidden
   - Hover: dark overlay with caption text (group/group-hover pattern)

6. TESTIMONIALS — 3 cards
   - Large SVG quote mark, star rating (5 gold stars inline SVG), review text
   - Avatar: gradient circle div with initials, name, role
   - bg-surface border border-white/10 rounded-2xl p-8

7. CTA SECTION
   - style="background:var(--gradient)"
   - Bold heading (white), subtext (white/80), white filled CTA button
   - Optional CSS dot-grid overlay

8. FOOTER — multi-column professional
   - Dark bg (or theme-bg), 4 columns: logo+tagline, nav links, services, contact
   - Social icons as SVG inside bordered circles
   - Bottom bar: "© 2025 ${name}. All rights reserved." + "Built with PNG Website Builders"

═══════════════════════════════════════════
SCRIPTS — add BEFORE </body>
═══════════════════════════════════════════
<script>
  // Fade-in: handle both in-viewport and below-fold elements
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('visible'); // Already in viewport — show immediately
    } else {
      revealObserver.observe(el);
    }
  });

  // Safety fallback: ensure all fade-in elements visible after 1.2s
  setTimeout(() => {
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
  }, 1200);

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
    const duration = 2000;
    const step = target / (duration / 16);
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
- Every section has an eyebrow label (text-xs uppercase tracking-widest font-semibold text-accent)
- Every section subtitle has a class="accent-bar" span immediately after it
- Buttons: rounded-full px-8 py-4 font-semibold hover:scale-105 transition-transform
- Add class="fade-in delay-X" to cards and below-fold sections (NOT hero content)
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

    let cleanHtml = generatedHtml.trim()
    if (cleanHtml.startsWith("```html")) cleanHtml = cleanHtml.slice(7)
    if (cleanHtml.startsWith("```")) cleanHtml = cleanHtml.slice(3)
    if (cleanHtml.endsWith("```")) cleanHtml = cleanHtml.slice(0, -3)
    cleanHtml = cleanHtml.trim()

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

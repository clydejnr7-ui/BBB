import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

async function fetchTopicImages(name: string, description: string): Promise<{
  hero: string
  cards: string[]
  gallery: string[]
  about: string[]
}> {
  const allUrls: string[] = []

  const queries = [
    `${name} ${description}`.slice(0, 80),
    name,
    description.split(" ").slice(0, 4).join(" "),
  ]

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=6`,
        { headers: { "User-Agent": "WebsiteBuilder/1.0 (contact@pngwebsitebuilders.site)" } }
      )
      if (res.ok) {
        const data = await res.json()
        const urls: string[] = (data.results || [])
          .filter((r: { width: number; url: string }) => r.width >= 400 && r.url)
          .map((r: { url: string }) => r.url)
        allUrls.push(...urls)
      }
    } catch {
      // continue to next query
    }
  }

  const unique = [...new Set(allUrls)]

  const seed = encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))
  let i = unique.length
  while (unique.length < 12) {
    unique.push(`https://picsum.photos/seed/${seed}-${i}/800/600`)
    i++
  }

  return {
    hero: unique[0],
    cards: unique.slice(1, 5),
    gallery: unique.slice(5, 9),
    about: unique.slice(9, 12),
  }
}

const styleThemes: Record<string, {
  fonts: string
  fontImport: string
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
    fontImport: "Inter, sans-serif",
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
    fontImport: "Inter, sans-serif",
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
    fontImport: "Plus Jakarta Sans, sans-serif",
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
    fontImport: "DM Sans, sans-serif",
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
    fontImport: "Nunito Sans, sans-serif",
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

    const [images] = await Promise.all([fetchTopicImages(name, description)])
    const theme = styleThemes[style] || styleThemes.modern

    const systemPrompt = `You are a world-class UI/UX designer and senior frontend developer at a top-tier agency. Your job is to produce stunning, professional, premium websites that look like they were built by a $50,000 agency. Every site you produce should be immediately impressive — the kind that wins design awards.

PROJECT:
- Name: ${name}
- Description: ${description}
- Style: ${style}

OUTPUT: Return ONLY a complete HTML document starting with <!DOCTYPE html>. No markdown, no code fences, no explanation.

═══════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════
- Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts: <link href="https://fonts.googleapis.com/css2?family=${theme.fonts}&display=swap" rel="stylesheet">
- Lucide Icons (for SVG icons): use inline SVG from lucide.dev OR embed simple SVG paths directly
- Alpine.js for interactivity (optional but preferred for menus): <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

═══════════════════════════════════════════
DESIGN SYSTEM — use these CSS variables
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

body {
  font-family: var(--body-font);
  background: var(--bg);
  color: var(--text);
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: var(--heading-font);
}

═══════════════════════════════════════════
REQUIRED SECTIONS (all 8, in this order)
═══════════════════════════════════════════

1. NAVBAR — sticky, glass morphism, premium
   - backdrop-filter: blur(20px) + background: ${theme.navBg}
   - Logo (business name in heading font, bold, with small color accent)
   - Desktop nav links with hover underline animation
   - Mobile hamburger menu (Alpine.js x-data toggle)
   - CTA button (filled, primary color, rounded-full, px-6 py-2.5)
   - Smooth border-bottom on scroll (add via JS scroll listener)

2. HERO — full viewport height, cinematic, premium
   - Full-screen background using the hero image below (object-cover)
   - Overlay: ${theme.heroOverlay}
   - ABOVE THE FOLD: Large display heading (text-6xl md:text-8xl, font-black, tracking-tight)
   - Gradient text effect on key words: background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent
   - Subheadline (text-xl, muted, max-w-2xl, leading-relaxed)
   - Two CTA buttons: primary (filled gradient) + secondary (outline, glass)
   - Animated scroll indicator (bouncing chevron-down arrow at bottom)
   - Scroll-fade-in animation on all hero text (use IntersectionObserver or CSS animation)

3. STATS / NUMBERS — social proof band
   - Full-width, contrasting background (primary color or dark surface)
   - 4 stats with large numbers (text-5xl, font-black), labels below
   - Numbers relevant to the business (years experience, clients served, projects done, satisfaction %)
   - Subtle dividers between stats on desktop

4. FEATURES / SERVICES — what they offer
   - Section heading centered, with gradient accent line under it
   - Grid of exactly 4 cards (2x2 on desktop, 1 col on mobile)
   - Each card: image on top, icon badge, bold title, description
   - Cards have hover: translateY(-8px) + shadow-lg + border-color change
   - All card transitions use var(--transition)

5. GALLERY / SHOWCASE — visual proof
   - Masonry-style or asymmetric grid (not boring equal grid)
   - At least 4 images in an interesting layout (one large + three small, or 2+2 offset)
   - Light overlay on hover showing caption text
   - rounded-2xl overflow-hidden on all image containers

6. TESTIMONIALS — trust building
   - 3 testimonial cards with: quote icon, review text, avatar circle (use CSS gradient as avatar), name, title/company
   - Cards with subtle border and surface background
   - Star ratings (5 filled stars using SVG)

7. CALL TO ACTION — conversion section
   - Full-width, gradient background (var(--gradient))
   - Bold headline, subtext, large CTA button (white filled)
   - Optional: subtle background pattern or noise texture overlay using CSS

8. FOOTER — complete, professional
   - Dark background, multi-column layout (logo+desc, nav links, contact info)
   - Social icons (Twitter/X, Instagram, LinkedIn, Facebook) as SVG circles
   - Copyright bar at bottom with separator line
   - "Built with PNG Website Builders" credit in small muted text

═══════════════════════════════════════════
IMAGES — use ONLY these verified URLs
═══════════════════════════════════════════
Do NOT change, shorten, or invent any image URL. Use exactly as provided.

Hero: ${images.hero}
Card 1: ${images.cards[0]}
Card 2: ${images.cards[1]}
Card 3: ${images.cards[2]}
Card 4: ${images.cards[3]}
Gallery 1: ${images.gallery[0]}
Gallery 2: ${images.gallery[1]}
Gallery 3: ${images.gallery[2]}
Gallery 4: ${images.gallery[3]}
About/misc 1: ${images.about[0]}
About/misc 2: ${images.about[1]}

Image CSS rules (non-negotiable):
- Every <img>: class="w-full h-full object-cover block"
- Every image container: explicit height ALWAYS (style="height:Xpx" or h-64/h-72/h-80/h-96)
- Hero container: style="height:100vh" class="relative w-full overflow-hidden"
- Card image containers: style="height:240px" class="w-full overflow-hidden"
- Gallery large image: style="height:480px"
- Gallery small images: style="height:230px"
- loading="lazy" and descriptive alt text on every image

═══════════════════════════════════════════
ANIMATIONS & INTERACTIONS
═══════════════════════════════════════════
Add this IntersectionObserver script BEFORE closing </body>:
<script>
  // Fade-in on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => {
      if (el.isIntersecting) {
        el.target.classList.add('visible');
        observer.unobserve(el.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Navbar scroll effect
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
      nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
    } else {
      nav.style.borderBottom = 'none';
      nav.style.boxShadow = 'none';
    }
  });

  // Counter animation for stats section
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const counterObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = Math.floor(current).toLocaleString() + (el.getAttribute('data-suffix') || '');
        }, 16);
        counterObserver.unobserve(el);
      }
    });
    counterObserver.observe(el);
  });
</script>

Add this CSS in <style> tag in <head>:
.fade-in { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }
.fade-in-delay-1 { transition-delay: 0.1s; }
.fade-in-delay-2 { transition-delay: 0.2s; }
.fade-in-delay-3 { transition-delay: 0.3s; }
.fade-in-delay-4 { transition-delay: 0.4s; }

Add class="fade-in" to: section headings, cards, gallery images, testimonials, stat numbers.

═══════════════════════════════════════════
PREMIUM DETAILS — these separate good from great
═══════════════════════════════════════════
- Section spacing: py-24 minimum between sections (py-32 for hero, CTA)
- Headings: always tracking-tight or tracking-tighter, font-black or font-bold
- Buttons: rounded-full, px-8 py-4, font-semibold, with hover:scale-105 transition
- Primary gradient button CSS: background: var(--gradient); color: white; border: none
- Outline button: border: 2px solid rgba(255,255,255,0.4); color: white; backdrop-filter: blur(8px)
- Cards: border: 1px solid rgba(255,255,255,0.06); background: var(--surface); border-radius: var(--radius-lg)
- Gradient divider after section headings: a 3px tall, 60px wide, rounded bar using var(--gradient) centered below the subtitle
- Every section has a descriptive eyebrow label above the heading (small uppercase, letter-spacing, primary color)
- Content max-width: max-w-7xl mx-auto px-6 for all sections

═══════════════════════════════════════════
HTML STRUCTURE
═══════════════════════════════════════════
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="..." />
  <title>${name}</title>
  [Google Fonts link]
  [Tailwind CDN]
  [Alpine.js CDN]
  <style>
    [CSS variables + body + heading fonts + animation classes + any custom CSS]
  </style>
</head>
<body>
  [nav]
  [hero]
  [stats]
  [features]
  [gallery]
  [testimonials]
  [cta]
  [footer]
  [scripts]
</body>
</html>

Return the COMPLETE HTML document. Make it so impressive that a user's first reaction is "wow".`

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
          { role: "user", content: `Create a stunning, premium ${style} website for: ${name}. ${description}` }
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
        return NextResponse.json(
          { error: "AI is rate limited. Please wait 30 seconds and try again." },
          { status: 429 }
        )
      }

      if (response.status === 503 || response.status === 502) {
        return NextResponse.json(
          { error: "AI service is temporarily unavailable. Please try again shortly." },
          { status: 503 }
        )
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

    return NextResponse.json({
      success: true,
      previewSlug,
      message: "Website generated successfully",
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

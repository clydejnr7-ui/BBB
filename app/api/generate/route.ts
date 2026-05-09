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

    const systemPrompt = `You are a world-class UI/UX designer and senior frontend developer at a top-tier agency. Your job is to produce stunning, professional, premium websites that look like they were built by a $50,000 agency. Every site you produce should be immediately impressive.

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
- Alpine.js: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

═══════════════════════════════════════════
DESIGN SYSTEM — define these in <style>
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
.fade-in { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }
.fade-in-delay-1 { transition-delay: 0.1s; }
.fade-in-delay-2 { transition-delay: 0.2s; }
.fade-in-delay-3 { transition-delay: 0.3s; }
.fade-in-delay-4 { transition-delay: 0.4s; }

═══════════════════════════════════════════
IMAGES — Picsum Photos (always reliable)
═══════════════════════════════════════════
URL format: https://picsum.photos/seed/{seed}/{width}/{height}

Rules:
- {seed} must be a descriptive word or phrase tied directly to the image content and site topic
- Use different unique seeds for every single image so no two images are the same
- Derive seeds from the site's subject matter — if it's a travel site, use seeds like "jungle", "beach", "waterfall", "reef", "village"; if it's a restaurant, use "food", "dining", "chef", "kitchen", "dessert"
- Seeds are case-sensitive strings — keep them lowercase, no spaces (use hyphens)
- Required images with example seeds for a site about "${name}":
  - Hero (1400x700): seed = "${slug}-hero"
  - Feature card 1 (800x500): seed = "${slug}-feature1"
  - Feature card 2 (800x500): seed = "${slug}-feature2"
  - Feature card 3 (800x500): seed = "${slug}-feature3"
  - Feature card 4 (800x500): seed = "${slug}-feature4"
  - Gallery image 1 (600x400): seed = "${slug}-gallery1"
  - Gallery image 2 (600x400): seed = "${slug}-gallery2"
  - Gallery image 3 (600x400): seed = "${slug}-gallery3"
  - Gallery image 4 (600x400): seed = "${slug}-gallery4"
  - About/team (400x500): seed = "${slug}-team1"
  - About/team (400x500): seed = "${slug}-team2"

Image CSS rules (non-negotiable — follow exactly):
- Every <img>: class="w-full h-full object-cover block"
- Every image container: explicit height ALWAYS (style="height:Xpx" or Tailwind h-64 / h-72 / h-80 / h-96)
- NEVER put an image in a container without an explicit height
- Hero container: style="height:100vh" class="relative w-full overflow-hidden"
- Card image containers: style="height:240px" class="w-full overflow-hidden"
- Gallery large image: style="height:480px"
- Gallery small images: style="height:230px"
- Add loading="lazy" and descriptive alt text on every image

═══════════════════════════════════════════
REQUIRED SECTIONS (all 8, in this order)
═══════════════════════════════════════════

1. NAVBAR — sticky, glass morphism
   - position: fixed; top: 0; width: 100%; backdrop-filter: blur(20px); background: ${theme.navBg}; z-index: 50
   - Logo: business name in heading font, bold, with a small colored dot or accent
   - Desktop nav links with smooth hover underline animation
   - Mobile hamburger (Alpine.js x-data toggle, animated)
   - CTA button: rounded-full, px-6 py-2.5, gradient background, font-semibold

2. HERO — full viewport, cinematic
   - Full-screen background image (height: 100vh, object-cover)
   - Overlay: ${theme.heroOverlay}
   - Eyebrow label: small uppercase text, letter-spacing, primary color
   - Main heading: text-6xl md:text-8xl, font-black, tracking-tight
   - Gradient text on 1-2 key words: background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text
   - Subheadline: text-xl, muted color, max-w-2xl, leading-relaxed
   - Two CTAs: primary (gradient background) + secondary (glass outline)
   - Animated scroll indicator at bottom (CSS bouncing chevron)
   - Add class="fade-in" to heading and subtext

3. STATS / NUMBERS — social proof
   - Full-width contrasting band (primary or dark surface bg)
   - 4 meaningful stats with: large number (text-5xl, font-black, class="counter" data-target="X" data-suffix="+"), label below
   - Numbers relevant to the business type
   - Subtle vertical dividers between stats on desktop

4. FEATURES / SERVICES — 4 cards
   - Centered section heading with gradient accent bar underneath
   - Eyebrow label above heading
   - 2x2 grid (desktop), 1-col (mobile)
   - Each card: image top + icon badge + bold title + description
   - Hover: transform: translateY(-8px) + box-shadow upgrade
   - Card border: 1px solid rgba(255,255,255,0.06) (or light version for light themes)

5. GALLERY / SHOWCASE — asymmetric layout
   - One large image left + three smaller images right (or 2+2 offset)
   - rounded-2xl on all containers, overflow-hidden
   - Hover overlay with caption text (opacity transition)
   - "View Gallery" link at bottom

6. TESTIMONIALS — 3 cards
   - Large quote mark (SVG or CSS), review text, 5-star SVG rating
   - Avatar: CSS gradient circle with initials, name, title/company below
   - Cards: surface background, subtle border, rounded-2xl

7. CALL TO ACTION — conversion
   - Full-width, gradient background (var(--gradient))
   - Bold headline, subtext, large white CTA button
   - Optional: subtle dot-grid or noise overlay using CSS background-image

8. FOOTER — complete, multi-column
   - Dark background, 4 columns: logo+desc, navigation, services, contact
   - Social icons (Twitter/X, Instagram, LinkedIn, Facebook) as inline SVG in bordered circles
   - Bottom bar with copyright and "Built with PNG Website Builders"

═══════════════════════════════════════════
PREMIUM QUALITY RULES
═══════════════════════════════════════════
- Section padding: py-24 minimum, py-32 for hero and CTA
- All content inside: max-w-7xl mx-auto px-6
- Buttons: rounded-full, px-8 py-4, font-semibold, hover:scale-105 + transition
- Gradient button: background: var(--gradient); color: white
- Glass button: border: 2px solid rgba(255,255,255,0.3); backdrop-filter: blur(8px); color: white
- Every section has an eyebrow label (small, uppercase, letter-spacing-widest, primary color)
- Gradient accent divider after each section subtitle: a 3px × 60px bar, background: var(--gradient), border-radius: 9999px, centered
- Section headings: text-4xl md:text-5xl, font-black, tracking-tight
- Add class="fade-in fade-in-delay-X" to cards and images for staggered reveal

═══════════════════════════════════════════
SCRIPTS (add before </body>)
═══════════════════════════════════════════
<script>
  // Scroll fade-in
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => { if (el.isIntersecting) { el.target.classList.add('visible'); observer.unobserve(el.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Navbar scroll shadow
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 60 ? '0 4px 30px rgba(0,0,0,0.25)' : 'none';
  });

  // Animated counters
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const step = target / 120;
    let current = 0;
    const counterObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = Math.floor(current).toLocaleString() + suffix;
        }, 16);
        counterObs.unobserve(el);
      }
    });
    counterObs.observe(el);
  });
</script>

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

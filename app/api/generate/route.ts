import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

// Fetch real, working image URLs from Openverse (free, no API key needed)
// Falls back to Picsum if Openverse fails or returns too few results
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

  // Deduplicate
  const unique = [...new Set(allUrls)]

  // Pad with Picsum if we don't have enough (Picsum always works)
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

    // Pre-fetch real images before calling the AI
    const images = await fetchTopicImages(name, description)

    const systemPrompt = `You are an expert frontend developer. Generate a complete, responsive one-page website based on this request:
Project name: ${name}
Description: ${description}
Style: ${style}

Return only valid HTML/CSS/JS (no markdown wrappers, no \`\`\`html blocks). Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).

IMAGES — Use ONLY the pre-fetched image URLs listed below. Do NOT invent or modify any image URLs. These are real, verified, working photo URLs chosen to match the site topic.

Hero image (use for the main banner/header):
${images.hero}

Feature/service card images (use one per card in order):
- Card 1: ${images.cards[0]}
- Card 2: ${images.cards[1]}
- Card 3: ${images.cards[2]}
- Card 4: ${images.cards[3]}

Gallery images (use in the gallery/about section):
- Gallery 1: ${images.gallery[0]}
- Gallery 2: ${images.gallery[1]}
- Gallery 3: ${images.gallery[2]}
- Gallery 4: ${images.gallery[3]}

About/team images:
- About 1: ${images.about[0]}
- About 2: ${images.about[1]}

RULES — follow these exactly or images will break:
- Copy each URL above exactly as-is into the src attribute — do not change, shorten, or guess any URL
- Every <img> MUST have: class="w-full h-full object-cover block"
- Every image container MUST have an explicit height (e.g. style="height:400px" or Tailwind h-64, h-72, h-80, h-96)
- NEVER use a container without explicit height when it holds an image
- Hero container: style="height:600px" class="relative overflow-hidden w-full"
- Card containers: class="w-full overflow-hidden" style="height:220px"
- Add loading="lazy" and descriptive alt text to every img tag

Example hero section:
<section class="relative w-full overflow-hidden" style="height:600px">
  <img src="${images.hero}" alt="${name} hero image" loading="lazy" class="w-full h-full object-cover block" />
  <div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-center px-6">
    <h1 class="text-5xl font-bold mb-4">Discover ${name}</h1>
    <p class="text-xl max-w-2xl">Your compelling headline here</p>
  </div>
</section>

Example feature card:
<div class="rounded-xl overflow-hidden shadow-lg bg-white">
  <div class="w-full overflow-hidden" style="height:220px">
    <img src="${images.cards[0]}" alt="Feature image" loading="lazy" class="w-full h-full object-cover block" />
  </div>
  <div class="p-6">
    <h3 class="text-xl font-semibold mb-2">Feature Title</h3>
    <p class="text-gray-600">Feature description.</p>
  </div>
</div>

Page requirements:
- Navbar with project name and navigation links (all href="#")
- Hero section with the hero image and headline overlaid on it
- Features/services section with at least 3 image cards using the card images above
- Gallery or about section using the gallery images above
- Footer with copyright and links
- Use semantic HTML, smooth scroll, subtle animations and transitions
- Color scheme matching the "${style}" style
- Fully responsive for mobile, tablet, and desktop
- Appropriate meta tags in the head

Return the complete HTML document starting with <!DOCTYPE html>.`

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
          { role: "user", content: `Create a ${style} website for: ${name}. ${description}` }
        ],
        max_tokens: 16000,
        temperature: 0.7,
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

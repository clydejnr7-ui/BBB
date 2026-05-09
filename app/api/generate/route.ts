import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

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

    const systemPrompt = `You are an expert frontend developer. Generate a complete, responsive one-page website based on this request:
Project name: ${name}
Description: ${description}
Style: ${style}

Return only valid HTML/CSS/JS (no markdown wrappers, no \`\`\`html blocks). Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).

IMAGES — Use Unsplash Source URLs. These always return real, high-quality photos based on keywords.

URL format: https://source.unsplash.com/{width}x{height}/?{keyword1},{keyword2}

CRITICAL KEYWORD RULE — Never use specific country names, city names, or proper nouns as keywords. Unsplash does not index by location name. Instead, describe what you would VISUALLY SEE there:
- "Papua New Guinea travel" → use: jungle,rainforest,island,coral,reef,waterfall,tribe,culture
- "Paris travel" → use: city,architecture,cafe,street,eiffel
- "Dubai tourism" → use: skyscraper,desert,luxury,skyline,city
- "Nigerian food" → use: food,spices,cooking,market,cuisine
- "Maldives resort" → use: ocean,beach,tropical,island,turquoise

Keyword strategy — always think: "What would a photo of this LOOK LIKE?" and use those visual nouns.

More keyword examples by industry:
- Restaurant / food → food, cooking, restaurant, dining, cuisine, chef, meal
- Tech startup → technology, computer, office, innovation, coding, startup
- Gym / fitness → fitness, gym, exercise, workout, running, sport
- Law firm → office, law, professional, business, meeting, justice
- Real estate → house, architecture, interior, property, building, home
- Medical / clinic → medical, hospital, doctor, health, clinic, care
- Beauty salon → beauty, hair, makeup, salon, spa, skincare
- Photography studio → camera, photography, studio, portrait, light
- Coffee shop → coffee, cafe, espresso, barista, cup, beans
- Travel / adventure → travel, adventure, nature, landscape, mountain, beach
- Jungle / tropical → jungle, rainforest, waterfall, tropical, nature, green
- Ocean / marine → ocean, sea, coral, reef, underwater, beach, waves
- Cultural / indigenous → culture, traditional, art, craft, village, ceremony

Use 2-3 keywords per image, comma-separated, all lowercase. Each image on the page must have DIFFERENT keyword combinations so photos don't repeat.

Required images and sizes:
- Hero banner: 1600x800 — visual keywords matching the main site topic
- Feature/service cards: 800x500 each — unique keyword combos per card matching each specific feature
- About/team section: 400x500 each — "portrait,professional,team" or topic-specific
- Gallery images: 600x400 each — varied keyword combos, all on-topic

CRITICAL image CSS rules — every image MUST be fully visible, never clipped or broken:
- All <img> tags MUST have: class="w-full h-full object-cover block"
- Image containers MUST have explicit height: h-64, h-72, h-80, h-96, or style="height:400px"
- NEVER use a container without an explicit height when it holds an image
- Hero image container: style="height:600px" with class="relative overflow-hidden w-full"
- Card image containers: class="w-full overflow-hidden" with explicit height like h-56 or h-64
- Add loading="lazy" and descriptive alt text to every img tag

Example hero for a Papua New Guinea travel site:
<section class="relative w-full overflow-hidden" style="height:600px">
  <img src="https://source.unsplash.com/1600x800/?jungle,rainforest,tropical" alt="Papua New Guinea jungle landscape" loading="lazy" class="w-full h-full object-cover block" />
  <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center px-6">
    <h1 class="text-5xl font-bold mb-4">Discover Papua New Guinea</h1>
    <p class="text-xl max-w-2xl">Explore untouched wilderness and vibrant culture</p>
  </div>
</section>

Example card for the same site:
<div class="rounded-xl overflow-hidden shadow-lg bg-white">
  <div class="w-full overflow-hidden" style="height:220px">
    <img src="https://source.unsplash.com/800/500/?coral,reef,ocean" alt="Coral reef diving" loading="lazy" class="w-full h-full object-cover block" />
  </div>
  <div class="p-6">
    <h3 class="text-xl font-semibold mb-2">Coral Triangle Diving</h3>
    <p class="text-gray-600">World-class diving in pristine waters.</p>
  </div>
</div>

Requirements:
- The design must be modern, accessible, and visually stunning
- Include a navbar with the project name and navigation links
- Include a hero section with a full-width background image and compelling headline overlaid on it
- Include a features/services section with image cards (at least 3)
- Include a gallery or about section with additional images
- Include a footer with copyright and links
- All links should use href="#"
- Use semantic HTML elements
- Add smooth scroll behavior
- Include subtle animations and transitions
- The color scheme should match the "${style}" style preference
- Make it fully responsive for mobile, tablet, and desktop
- Add appropriate meta tags in the head

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

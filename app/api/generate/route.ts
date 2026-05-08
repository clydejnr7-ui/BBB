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

    // Check user credits
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (!profile || profile.credits < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    // Generate website using OpenRouter
    const systemPrompt = `You are an expert frontend developer. Generate a complete, responsive one-page website based on this request:
Project name: ${name}
Description: ${description}
Style: ${style}

Return only valid HTML/CSS/JS (no markdown wrappers, no \`\`\`html blocks). Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>). 

Requirements:
- The design must be modern, accessible, and visually stunning
- Include a navbar with the project name and navigation links
- Include a hero section with a compelling headline and CTA button
- Include a features section with at least 3 feature cards
- Include a testimonials or about section
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
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://siteforge.ai",
        "X-Title": "SiteForge AI",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a ${style} website for: ${name}. ${description}` }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenRouter error:", errorData)
      return NextResponse.json({ error: "Failed to generate website" }, { status: 500 })
    }

    const data = await response.json()
    const generatedHtml = data.choices?.[0]?.message?.content

    if (!generatedHtml) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 })
    }

    // Clean up the HTML (remove any markdown wrappers if present)
    let cleanHtml = generatedHtml.trim()
    if (cleanHtml.startsWith("```html")) {
      cleanHtml = cleanHtml.slice(7)
    }
    if (cleanHtml.startsWith("```")) {
      cleanHtml = cleanHtml.slice(3)
    }
    if (cleanHtml.endsWith("```")) {
      cleanHtml = cleanHtml.slice(0, -3)
    }
    cleanHtml = cleanHtml.trim()

    // Generate unique preview slug
    const previewSlug = nanoid(10)

    // Save to database
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

    // Deduct credit
    const { error: creditError } = await adminClient
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id)

    if (creditError) {
      console.error("Credit deduction error:", creditError)
      // Website was saved, so we don't return an error, but log it
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

import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PreviewFrame } from "@/components/preview/preview-frame"
import { PreviewHeader } from "@/components/preview/preview-header"

interface PreviewPageProps {
  params: Promise<{ slug: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: site } = await supabase
    .from("generated_sites")
    .select("*")
    .eq("preview_slug", slug)
    .single()

  if (!site) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <PreviewHeader site={site} />
      <div className="flex-1 p-4">
        <PreviewFrame htmlCode={site.html_code} />
      </div>
    </div>
  )
}

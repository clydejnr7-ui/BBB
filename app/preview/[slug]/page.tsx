import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"

interface PreviewPageProps {
  params: Promise<{ slug: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params

  const adminClient = createAdminClient()
  const { data: site } = await adminClient
    .from("generated_sites")
    .select("id")
    .eq("preview_slug", slug)
    .single()

  if (!site) notFound()

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <iframe
        src={`/api/preview/${slug}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="Website Preview"
      />
    </div>
  )
}

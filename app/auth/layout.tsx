import Link from "next/link"
import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="https://i.8upload.com/image/51e2eb5f6dbfb126/photo-2026-05-08-21-05-11.webp"
                alt="PNG Website Builders"
                width={48}
                height={48}
                className="rounded-lg object-contain"
              />
              <span className="text-xl font-bold">PNG Website Builders</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  )
}

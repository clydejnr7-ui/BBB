"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Sparkles, Loader2, Zap, AlertCircle } from "lucide-react"
import Link from "next/link"

const generateSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  style: z.enum(["modern", "minimal", "startup", "creative", "corporate"]),
})

type GenerateForm = z.infer<typeof generateSchema>

const styleOptions = [
  { value: "modern", label: "Modern", description: "Clean, contemporary design with bold typography" },
  { value: "minimal", label: "Minimal", description: "Simple, focused design with lots of whitespace" },
  { value: "startup", label: "Startup", description: "Dynamic, tech-forward design with vibrant colors" },
  { value: "creative", label: "Creative", description: "Artistic, unique design with custom elements" },
  { value: "corporate", label: "Corporate", description: "Professional, trustworthy design for businesses" },
]

export default function GeneratePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      style: "modern",
    },
  })

  const selectedStyle = watch("style")

  useEffect(() => {
    async function fetchCredits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single()
        setCredits(profile?.credits ?? 0)
      }
    }
    fetchCredits()
  }, [supabase])

  async function onSubmit(data: GenerateForm) {
    if (credits !== null && credits < 1) {
      toast.error("You need at least 1 credit to generate a website")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Generation failed")
      }

      toast.success("Website generated successfully!")
      router.push(`/preview/${result.previewSlug}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate website")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Website</h1>
        <p className="text-muted-foreground mt-1">
          Describe your vision and let AI create your website.
        </p>
      </div>

      {/* Credits Warning */}
      {credits !== null && credits === 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">No credits available</p>
              <p className="text-sm text-muted-foreground">
                You need credits to generate websites.
              </p>
            </div>
            <Link href="/billing">
              <Button size="sm">Buy Credits</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Credits Display */}
      {credits !== null && credits > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                You have <span className="text-primary">{credits} credits</span> available
              </p>
              <p className="text-sm text-muted-foreground">
                Each generation uses 1 credit
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Tell us about the website you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Startup"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your website... What is it for? What features should it have? What message should it convey?"
                rows={4}
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Be specific! The more details you provide, the better the result.
              </p>
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <Label>Style Preference</Label>
              <RadioGroup
                value={selectedStyle}
                onValueChange={(value) => setValue("style", value as GenerateForm["style"])}
                className="grid gap-3 sm:grid-cols-2"
                disabled={isLoading}
              >
                {styleOptions.map((style) => (
                  <div key={style.value}>
                    <RadioGroupItem
                      value={style.value}
                      id={style.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={style.value}
                      className="flex flex-col gap-1 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{style.label}</span>
                        {selectedStyle === style.value && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {style.description}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.style && (
                <p className="text-sm text-destructive">{errors.style.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || (credits !== null && credits < 1)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating your website...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Website (1 Credit)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

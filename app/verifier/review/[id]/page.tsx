import { ProjectReview } from "@/components/verifier/project-review"

interface ReviewPageProps {
  params: {
    id: string
  }
}

export default function ReviewPage({ params }: ReviewPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        <ProjectReview verificationId={params.id} />
      </div>
    </div>
  )
} 
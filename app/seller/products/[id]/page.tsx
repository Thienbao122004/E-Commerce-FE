"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function SellerProductDetailRedirect() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/seller/products?id=${id}`)
  }, [id, router])

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )
}
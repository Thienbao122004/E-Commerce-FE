import type { SellerProductReviewItem } from "@/types/seller-dashboard"

export type Review = {
  id: string
  buyerName: string
  buyerAvatar: string
  productName: string
  productImg: string
  rating: number
  comment: string
  images: string[]
  date: string
  sellerReply: string | null
  helpful: number
  orderId: string
}

/** Map từ API `/api/seller/reviews` (đánh giá sản phẩm đã duyệt). */
export function mapSellerReviewToReview(r: SellerProductReviewItem): Review {
  return {
    id: r.id,
    buyerName: r.buyerName?.trim() || "Khách hàng",
    buyerAvatar: "",
    productName: r.productName,
    productImg: r.productThumbnailUrl ?? "",
    rating: r.rating,
    comment: r.comment ?? "",
    images: Array.isArray(r.imageUrls) ? r.imageUrls : [],
    date: r.createdAt,
    sellerReply: null,
    helpful: 0,
    orderId: "",
  }
}

export const ratingColors: Record<number, string> = {
  5: "bg-green-100 text-green-700 border-green-200",
  4: "bg-lime-100 text-lime-700 border-lime-200",
  3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  2: "bg-orange-100 text-orange-700 border-orange-200",
  1: "bg-red-100 text-red-700 border-red-200",
}

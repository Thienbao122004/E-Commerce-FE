'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Star, Camera, ImageIcon } from 'lucide-react'
import type { OrderSummary, OrderItem } from '@/services/orders'
import { reviewsService } from '@/services/reviews'
import { toast } from 'sonner'

const RATING_LABELS = ['', 'Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời']

interface ReviewItemState {
  rating: number
  comment: string
  previewImages: string[]
}

interface ReviewModalProps {
  order: OrderSummary
  onClose: () => void
  onSuccess: () => void
}

export default function ReviewModal({ order, onClose, onSuccess }: ReviewModalProps) {
  const pendingItems = order.items.filter((i) => i.hasReviewedByUser !== true)

  const [reviews, setReviews] = useState<Record<string, ReviewItemState>>(() => {
    const init: Record<string, ReviewItemState> = {}
    for (const item of order.items.filter((i) => i.hasReviewedByUser !== true)) {
      init[item.productId] = { rating: 5, comment: '', previewImages: [] }
    }
    return init
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (order.items.length > 0 && order.items.every((i) => i.hasReviewedByUser === true)) {
      toast.info('Bạn đã đánh giá tất cả sản phẩm trong đơn này.')
      onClose()
    }
    // Chỉ khi mở modal: tránh lệ thuộc onClose thay đổi mỗi render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateReview = useCallback((productId: string, patch: Partial<ReviewItemState>) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ...patch },
    }))
  }, [])

  const handleStarClick = (productId: string, star: number) => {
    updateReview(productId, { rating: star })
  }

  const handleAddImage = (productId: string) => {
    setCurrentProductId(productId)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !currentProductId) return

    const productId = currentProductId
    const current = reviews[productId]
    const remaining = 5 - current.previewImages.length

    if (remaining <= 0) {
      toast.error('Tối đa 5 ảnh cho mỗi đánh giá')
      return
    }

    const filesToProcess = Array.from(files).slice(0, remaining)

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá 5MB`)
        continue
      }

      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            previewImages: [...prev[productId].previewImages, dataUrl],
          },
        }))
      }
      reader.readAsDataURL(file)
    }

    e.target.value = ''
  }

  const removeImage = (productId: string, index: number) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        previewImages: prev[productId].previewImages.filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    let successCount = 0
    let failedCount = 0

    for (const item of pendingItems) {
      const review = reviews[item.productId]
      if (!review) continue

      try {
        const res = await reviewsService.createProductReview({
          orderId: order.id,
          productId: item.productId,
          rating: review.rating,
          comment: review.comment || undefined,
          imageUrls: review.previewImages.length > 0 ? review.previewImages : undefined,
        })
        if (res.success) {
          successCount++
        } else {
          failedCount++
        }
      } catch {
        failedCount++
      }
    }

    setSubmitting(false)

    if (successCount > 0) {
      toast.success(`Đánh giá ${successCount} sản phẩm thành công!`)
      onSuccess()
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} sản phẩm đánh giá thất bại (có thể đã đánh giá trước đó)`)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#e5ded6' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-main)' }}>
            Đánh Giá Sản Phẩm
          </h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {pendingItems.map((item) => (
            <ReviewItemCard
              key={item.productId}
              item={item}
              review={reviews[item.productId]}
              onStarClick={(star) => handleStarClick(item.productId, star)}
              onCommentChange={(c) => updateReview(item.productId, { comment: c })}
              onAddImage={() => handleAddImage(item.productId)}
              onRemoveImage={(idx) => removeImage(item.productId, idx)}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: '#e5ded6' }}
        >
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2.5 rounded text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#d1c9c0', color: 'var(--color-text-secondary)' }}
          >
            TRỞ LẠI
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || pendingItems.length === 0}
            className="px-6 py-2.5 rounded text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {submitting ? 'Đang gửi...' : 'HOÀN THÀNH'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}

function ReviewItemCard({
  item,
  review,
  onStarClick,
  onCommentChange,
  onAddImage,
  onRemoveImage,
}: {
  item: OrderItem
  review: ReviewItemState
  onStarClick: (star: number) => void
  onCommentChange: (c: string) => void
  onAddImage: () => void
  onRemoveImage: (idx: number) => void
}) {
  return (
    <div className="space-y-4">
      {/* Product info */}
      <div className="flex items-center gap-3">
        <div
          className="size-16 shrink-0 rounded border bg-gray-50 overflow-hidden"
          style={{ borderColor: '#e5ded6' }}
        >
          {item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl} alt={item.productName} className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center">
              <ImageIcon size={24} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-main)' }}>
            {item.productName}
          </p>
          {item.variantName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Phân loại hàng: {item.variantName}
            </p>
          )}
        </div>
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">Chất lượng sản phẩm</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onStarClick(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                fill={star <= review.rating ? '#fbbf24' : 'none'}
                stroke={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        {review.rating > 0 && (
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            {RATING_LABELS[review.rating]}
          </span>
        )}
      </div>

      {/* Comment textarea */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: '#e5ded6' }}
      >
        <textarea
          value={review.comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé."
          className="w-full px-4 py-3 text-sm resize-none outline-none"
          style={{ color: 'var(--color-text-main)', minHeight: '100px' }}
          maxLength={500}
        />
      </div>

      {/* Image previews */}
      {review.previewImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.previewImages.map((src, idx) => (
            <div
              key={idx}
              className="relative size-20 rounded-lg border overflow-hidden group"
              style={{ borderColor: '#e5ded6' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Preview ${idx + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                className="absolute top-0.5 right-0.5 size-5 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add image button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAddImage}
          disabled={review.previewImages.length >= 5}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          <Camera size={16} />
          <span>Thêm Hình ảnh</span>
        </button>
        <span className="text-xs text-muted-foreground">
          {review.previewImages.length}/5 ảnh
        </span>
      </div>

      {/* Divider */}
      <hr style={{ borderColor: '#f0ebe5' }} />
    </div>
  )
}

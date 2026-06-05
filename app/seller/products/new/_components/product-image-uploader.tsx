"use client"

import * as React from "react"
import { IconUpload, IconX, IconPlus, IconPhoto } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProductImageUploaderProps {
  imageUrls: string[]
  onImageUrlsChange: (urls: string[]) => void
  imageInput: string
  onImageInputChange: (val: string) => void
  isDragging: boolean
  onIsDraggingChange: (v: boolean) => void
  brokenUrls: Set<string>
  onBrokenUrlsChange: (s: Set<string>) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export function ProductImageUploader({
  imageUrls,
  onImageUrlsChange,
  imageInput,
  onImageInputChange,
  isDragging,
  onIsDraggingChange,
  brokenUrls,
  onBrokenUrlsChange,
  fileInputRef,
}: ProductImageUploaderProps) {
  const mainImage = imageUrls[0]
  const hasMainPreview = Boolean(mainImage && !brokenUrls.has(mainImage))
  const extraSlots = Array.from({ length: 5 })

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6 - imageUrls.length)
      .forEach((f) => onImageUrlsChange([...imageUrls, URL.createObjectURL(f)].slice(0, 6)))
  }

  const addImageUrl = () => {
    let v = imageInput.trim()
    if (!v) return
    try {
      if (v.includes("google.com/imgres")) {
        const u = new URL(v)
        const raw = u.searchParams.get("imgurl")
        if (raw) v = decodeURIComponent(raw)
      }
    } catch { /* ignore */ }
    if (!v.startsWith("http://") && !v.startsWith("https://")) {
      onImageInputChange("")
      return
    }
    if (imageUrls.length < 6) {
      onImageUrlsChange([...imageUrls, v])
      onBrokenUrlsChange((() => { const s = new Set(brokenUrls); s.delete(v); return s })())
      onImageInputChange("")
    }
  }

  const removeImage = (i: number) => {
    const url = imageUrls[i]
    onImageUrlsChange(imageUrls.filter((_, j) => j !== i))
    onBrokenUrlsChange((() => { const s = new Set(brokenUrls); s.delete(url); return s })())
  }

  return (
    <>
      <div className="relative w-full">
        <div
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer select-none w-full ${
            imageUrls.length >= 6
              ? "cursor-not-allowed border-muted-foreground/25"
              : isDragging
              ? "border-primary"
              : "border-muted-foreground/25 hover:border-primary/50"
          } ${hasMainPreview ? "aspect-[3/2] sm:aspect-[4/3] overflow-hidden p-0" : "min-h-[160px] p-5 sm:min-h-[180px] sm:p-6"}`}
          onClick={() => { if (imageUrls.length < 6) fileInputRef.current?.click() }}
          onDragOver={(e) => { e.preventDefault(); if (imageUrls.length < 6) onIsDraggingChange(true) }}
          onDragLeave={() => onIsDraggingChange(false)}
          onDrop={(e) => { e.preventDefault(); onIsDraggingChange(false); handleFilesSelected(e.dataTransfer.files) }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          {hasMainPreview ? (
            <div className="relative h-full w-full bg-muted/30">
              <img
                src={mainImage}
                alt="Ảnh chính"
                className="absolute inset-0 h-full w-full object-contain"
                onError={() => onBrokenUrlsChange(new Set(brokenUrls).add(mainImage))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white">
                Ảnh chính
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(0) }}
                className="absolute right-3 top-3 flex items-center justify-center size-6 rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors"
              >
                <IconX className="size-3" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-black/65"
              >
                <IconUpload className="size-3.5" />
                Thêm ảnh
              </button>
              <p className="absolute bottom-3 left-3 text-[11px] font-medium text-white/95">
                Ảnh phụ thêm ở các ô bên dưới
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center justify-center size-10 rounded-full bg-muted">
                <IconUpload className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary">
                  {isDragging ? "Thả ảnh vào đây" : "Tải ảnh lên"}
                  {!isDragging && <span className="text-foreground font-normal"> hoặc kéo thả</span>}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, GIF tối đa 10MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {extraSlots.map((_, i) => {
          const url = imageUrls[i + 1]
          if (url && !brokenUrls.has(url)) {
            return (
              <div key={i} className="relative aspect-square rounded-lg border overflow-hidden group">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => onBrokenUrlsChange(new Set(brokenUrls).add(url))}
                />
                <button
                  type="button"
                  onClick={() => removeImage(i + 1)}
                  className="absolute top-0.5 right-0.5 flex items-center justify-center size-4 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconX className="size-2.5" />
                </button>
              </div>
            )
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground/40 bg-muted/20 hover:bg-muted/40 transition-all"
            >
              <IconPhoto className="size-4" />
            </button>
          )
        })}
      </div>

      <div className="flex w-full min-w-0 gap-2">
        <Input
          placeholder="Hoặc dán URL ảnh vào đây..."
          value={imageInput}
          onChange={(e) => onImageInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl() } }}
          className="h-8 min-w-0 flex-1 text-xs"
          disabled={imageUrls.length >= 6}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={addImageUrl}
          disabled={!imageInput.trim() || imageUrls.length >= 6}
        >
          <IconPlus className="size-3.5" />
        </Button>
      </div>
    </>
  )
}

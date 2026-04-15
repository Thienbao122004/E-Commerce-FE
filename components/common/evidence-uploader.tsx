"use client"

import React, { useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

const MAX_FILES = 10
const MAX_SIZE_MB = 20
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"]
const BUCKET = "product-images"

interface UploadingItem {
  localId: string
  name: string
  progress: "uploading" | "done" | "error"
  error?: string
}

interface EvidenceUploaderProps {
  urls: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
  maxFiles?: number
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)
}

async function uploadEvidenceFile(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(`Không hỗ trợ loại file: ${file.type}`)
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File quá lớn (tối đa ${MAX_SIZE_MB}MB)`)
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
  const path = `dispute-evidence/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false })
  if (error) throw error
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return pub.publicUrl
}

export function EvidenceUploader({
  urls,
  onChange,
  disabled = false,
  maxFiles = MAX_FILES,
}: EvidenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<UploadingItem[]>([])
  const [dragOver, setDragOver] = useState(false)

  const remaining = maxFiles - urls.length
  const isMaxed = urls.length >= maxFiles

  const processFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    if (arr.length === 0) return

    const slots = Math.min(arr.length, remaining)
    const toUpload = arr.slice(0, slots)

    const drafts: UploadingItem[] = toUpload.map((f) => ({
      localId: Math.random().toString(36).slice(2),
      name: f.name,
      progress: "uploading",
    }))
    setUploading((prev) => [...prev, ...drafts])

    const results = await Promise.allSettled(
      toUpload.map((f, i) =>
        uploadEvidenceFile(f).then((url) => ({ localId: drafts[i].localId, url }))
      )
    )

    // Tính toán kết quả ngoài updater để tránh side-effect bên trong setState
    const newUrls: string[] = []
    const errorMap: Record<string, string> = {}

    results.forEach((res, i) => {
      if (res.status === "fulfilled") {
        newUrls.push(res.value.url)
      } else {
        errorMap[drafts[i].localId] =
          res.reason instanceof Error ? res.reason.message : "Lỗi upload"
      }
    })

    setUploading((prev) =>
      prev.map((item) => {
        const isDraft = drafts.some((d) => d.localId === item.localId)
        if (!isDraft) return item
        if (errorMap[item.localId]) {
          return { ...item, progress: "error", error: errorMap[item.localId] }
        }
        return { ...item, progress: "done" }
      })
    )

    if (newUrls.length > 0) {
      onChange([...urls, ...newUrls])
    }

    // Auto-clear done/error sau 2.5s
    setTimeout(() => {
      setUploading((prev) => prev.filter((it) => it.progress === "uploading"))
    }, 2500)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files)
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!disabled && e.dataTransfer.files) processFiles(e.dataTransfer.files)
  }

  const removeUrl = (idx: number) => {
    onChange(urls.filter((_, i) => i !== idx))
  }

  const hasItems = urls.length > 0 || uploading.length > 0
  const isUploading = uploading.some((it) => it.progress === "uploading")

  return (
    <div className="space-y-3">
      {/* File grid — luôn hiển thị khi có file đã upload HOẶC đang upload */}
      {hasItems && (
        <div className="flex flex-wrap gap-2">
          {/* Đã upload thành công */}
          {urls.map((url, i) => (
            <div
              key={i}
              className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
              style={{ width: 80, height: 80 }}
            >
              {isImageUrl(url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={`Bằng chứng ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-2xl text-gray-400">videocam</span>
                  <span className="text-[10px] text-gray-400 text-center px-1 leading-tight truncate w-full text-center">
                    Video {i + 1}
                  </span>
                </div>
              )}
              {/* Overlay: view + delete */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded bg-white/80 hover:bg-white"
                  title="Xem"
                >
                  <span className="material-symbols-outlined text-sm text-gray-700">open_in_new</span>
                </a>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    className="p-1 rounded bg-white/80 hover:bg-red-100"
                    title="Xóa"
                  >
                    <span className="material-symbols-outlined text-sm text-red-500">delete</span>
                  </button>
                )}
              </div>
              <span className="absolute top-1 left-1 text-[10px] bg-black/50 text-white rounded px-1 leading-4">
                {i + 1}
              </span>
            </div>
          ))}

          {/* Đang upload / vừa xong / lỗi — luôn render kể cả khi urls rỗng */}
          {uploading.map((it) => (
            <div
              key={it.localId}
              className="relative rounded-lg border-2 border-dashed overflow-hidden flex flex-col items-center justify-center gap-1"
              style={{
                width: 80,
                height: 80,
                borderColor: it.progress === "error" ? "#ef4444" : it.progress === "done" ? "#22c55e" : "#94a3b8",
                backgroundColor:
                  it.progress === "error"
                    ? "rgba(239,68,68,0.06)"
                    : it.progress === "done"
                    ? "rgba(34,197,94,0.06)"
                    : "rgba(148,163,184,0.08)",
              }}
            >
              {it.progress === "uploading" ? (
                <>
                  <span
                    className="material-symbols-outlined text-2xl text-slate-400 animate-spin"
                    style={{ animationDuration: "0.9s" }}
                  >
                    progress_activity
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight text-center px-1 truncate w-full text-center">
                    Đang tải...
                  </span>
                </>
              ) : it.progress === "done" ? (
                <>
                  <span className="material-symbols-outlined text-2xl text-green-500">check_circle</span>
                  <span className="text-[10px] text-green-600 leading-tight text-center px-1">Xong!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl text-red-400">error</span>
                  <span className="text-[10px] text-red-400 text-center px-1 leading-tight line-clamp-2">
                    {it.error ?? "Lỗi"}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — ẩn khi đang upload để tránh người dùng thêm đồng thời */}
      {!isMaxed && !disabled && !isUploading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-5 select-none"
          style={{
            borderColor: dragOver ? "var(--color-primary)" : "#d1d5db",
            backgroundColor: dragOver ? "rgba(236,127,19,0.05)" : "transparent",
          }}
        >
          <span
            className="material-symbols-outlined text-3xl transition-colors"
            style={{ color: dragOver ? "var(--color-primary)" : "#9ca3af" }}
          >
            cloud_upload
          </span>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: dragOver ? "var(--color-primary)" : "#374151" }}>
              Kéo thả hoặc{" "}
              <span className="underline" style={{ color: "var(--color-primary)" }}>
                chọn file
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Ảnh (JPG, PNG, GIF, WEBP) · Video (MP4) · Tối đa {MAX_SIZE_MB}MB/file
            </p>
            <p className="text-xs text-gray-400">
              {urls.length}/{maxFiles} · còn {remaining} chỗ
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Khi đang upload: thông báo trạng thái thay cho drop zone */}
      {isUploading && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5 py-1">
          <span className="material-symbols-outlined text-sm animate-spin" style={{ animationDuration: "0.9s" }}>
            progress_activity
          </span>
          Đang tải lên {uploading.filter((it) => it.progress === "uploading").length} file, vui lòng chờ...
        </p>
      )}

      {isMaxed && !isUploading && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">info</span>
          Đã đạt tối đa {maxFiles} bằng chứng. Xóa bớt để thêm mới.
        </p>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import {
  IconAward,
  IconCheck,
  IconChevronRight,
  IconCircle,
  IconMapPin,
  IconAlertTriangle,
  IconInfoCircle,
} from "@tabler/icons-react"
import { Label } from "@/components/ui/label"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer"
import type { LocalSpecialtyProfile } from "@/services/local-specialty"

const MIN_TRAITS = 3

interface ProductLocalBrandProps {
  localProfiles: LocalSpecialtyProfile[]
  selLocalProfileId: number | null
  onSelectProfile: (id: number) => void
  selLocalTraits: string[]
  onToggleTrait: (trait: string) => void
  name: string
  description: string
  isMeaningfulDescription: boolean
  verificationScore: number
  scoreColor: string
  scoreLabel: string
  localMismatch: string | null
}

export function ProductLocalBrand({
  localProfiles,
  selLocalProfileId,
  onSelectProfile,
  selLocalTraits,
  onToggleTrait,
  isMeaningfulDescription,
  verificationScore,
  scoreColor,
  scoreLabel,
  localMismatch,
}: ProductLocalBrandProps) {
  const [open, setOpen] = React.useState(false)
  const selLocalProfile = localProfiles.find((p) => p.id === selLocalProfileId) ?? null

  const checklistItems = [
    { label: "Chọn loại", done: !!selLocalProfile },
    { label: "Vùng miền", done: !!selLocalProfile },
    { label: `Đủ ${MIN_TRAITS} đặc điểm`, done: selLocalTraits.length >= MIN_TRAITS },
    { label: "Mô tả chuẩn hóa", done: isMeaningfulDescription },
  ]

  return (
    <>
      {/* Trigger — dạng button nhất quán với các picker khác */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-2.5 rounded border px-3 py-2.5 text-left transition-colors hover:border-primary/40 ${selLocalProfileId
          ? "border-[#e8b37f] bg-white"
          : "border-dashed border-[#c6d1bc] bg-[#fffdfb] hover:border-[#a9bc95]"
          }`}
      >
        <IconAward className="size-4 shrink-0 text-[#b06017]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">Xác thực Local Brand</p>
          {selLocalProfile ? (
            <p className="text-[11px] text-muted-foreground truncate">
              {selLocalProfile.archetypeName} · {verificationScore}% ({scoreLabel})
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">Chưa chọn — bắt buộc</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {selLocalProfileId && (
            <span className="text-[10px] font-semibold tabular-nums text-[#b06017]">
              {verificationScore}%
            </span>
          )}
          <span className="rounded-full border border-[#f0c890] bg-[#fde8c8] px-1.5 py-0.5 text-[9px] font-semibold text-[#b06017]">
            Bắt buộc
          </span>
          <IconChevronRight className="size-3.5 text-muted-foreground/60" />
        </div>
      </button>

      {/* Right Drawer */}
      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerContent
          style={{ maxWidth: 400, width: "90vw" }}
          className="flex flex-col overflow-hidden"
        >
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-2">
              <IconAward className="size-4 shrink-0 text-[#b06017]" />
              <DrawerTitle className="text-sm">Xác thực Local Brand</DrawerTitle>
              <span className="ml-auto rounded-full border border-[#f0c890] bg-[#fde8c8] px-1.5 py-0.5 text-[9px] font-semibold text-[#b06017]">
                Bắt buộc
              </span>
            </div>

            {/* Progress */}
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Mức độ xác thực</span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor }}>
                  {verificationScore}% · {scoreLabel}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${verificationScore}%`, background: scoreColor }}
                />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                {checklistItems.map(({ label, done }) => (
                  <span
                    key={label}
                    className={`flex items-center gap-1 text-[10px] ${done ? "text-emerald-600" : "text-muted-foreground/70"
                      }`}
                  >
                    {done ? (
                      <IconCheck className="size-3" />
                    ) : (
                      <IconCircle className="size-3" />
                    )}
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </DrawerHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-5 px-4 py-4">

              {/* 1. Chọn loại */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs">
                  1. Loại cà phê đặc sản <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {localProfiles.map((p) => {
                    const active = selLocalProfileId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectProfile(p.id)}
                        className={`flex flex-col rounded-xl border px-2.5 py-2 text-left text-xs transition-all ${active
                          ? "border-[#e8b37f] bg-white font-semibold text-[#b06017]"
                          : "border-[#d7dfcf] bg-white text-[#5f7253] hover:border-[#a9bc95]"
                          }`}
                      >
                        <span>{p.archetypeName}</span>
                        <span className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <IconMapPin className="size-2.5" />
                          {p.provinceName}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Đặc điểm */}
              {selLocalProfile && (
                <div className="flex flex-col gap-2">
                  <Label className="text-xs">2. Đặc điểm nổi bật vùng miền</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {selLocalProfile.expectedTraits.map((trait) => {
                      const active = selLocalTraits.includes(trait)
                      return (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => onToggleTrait(trait)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all ${active
                            ? "border-[#e8b37f] bg-white text-[#b06017]"
                            : "border-[#d7dfcf] bg-white text-[#718267] hover:border-[#a9bc95]"
                            }`}
                        >
                          {active ? (
                            <IconCheck className="size-3 text-[#b06017]" />
                          ) : (
                            <IconCircle className="size-3 text-muted-foreground/30" />
                          )}
                          {trait}
                        </button>
                      )
                    })}
                  </div>
                  <p
                    className={`text-[11px] ${selLocalTraits.length >= MIN_TRAITS
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                      }`}
                  >
                    {selLocalTraits.length >= MIN_TRAITS
                      ? `✓ Đã chọn đủ đặc tính (${selLocalTraits.length})`
                      : `Chọn tối thiểu ${MIN_TRAITS} đặc điểm (${selLocalTraits.length}/${MIN_TRAITS})`}
                  </p>
                </div>
              )}

              {/* 3. Nhãn dự kiến */}
              {selLocalProfile && (
                <div className="flex flex-col gap-2">
                  <Label className="text-xs">3. Nhãn hiển thị dự kiến</Label>
                  <div className="flex items-center gap-2 rounded-xl border border-[#efd4b7] bg-white px-3 py-2">
                    <IconAward className="size-4 shrink-0 text-[#b06017]" />
                    <span className="text-xs font-semibold text-foreground">
                      {selLocalProfile.archetypeName}
                    </span>
                    <span className="ml-auto rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                      Local Brand · Chờ duyệt
                    </span>
                  </div>
                </div>
              )}

              {/* Mismatch */}
              {localMismatch && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <IconAlertTriangle className="size-3.5 mt-0.5 shrink-0 text-red-500" />
                  <p className="text-[11px] leading-relaxed text-red-700">{localMismatch}</p>
                </div>
              )}

              {/* Why local brand */}
              {selLocalProfile && (
                <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                    <IconInfoCircle className="size-3.5" />
                    Vì sao được xác thực Local Brand?
                  </p>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                      <IconCheck className="size-3.5 shrink-0" />
                      Thuộc nhóm cà phê đặc sản vùng miền của nền tảng
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                      <IconCheck className="size-3.5 shrink-0" />
                      Vùng xuất xứ:{" "}
                      <strong>{selLocalProfile.provinceName}</strong>
                    </span>
                  </div>
                  <p className="border-t border-emerald-200 pt-2 text-[10px] leading-normal text-emerald-600">
                    Nhãn Local Brand sẽ được admin xem xét trước khi hiển thị chính thức.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DrawerFooter className="border-t">
            <DrawerClose asChild>
              <button
                type="button"
                className="w-full rounded-xl bg-foreground py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Xong
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

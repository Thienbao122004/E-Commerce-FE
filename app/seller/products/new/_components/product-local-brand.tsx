"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
  const selLocalProfile = localProfiles.find((p) => p.id === selLocalProfileId) ?? null

  return (
    <Card 
      className="border-[#c8a56d] shadow-sm" 
      style={{ background: "linear-gradient(145deg, #fffbf2 0%, #fef6e8 100%)" }}
    >
      <CardHeader className="px-4">
        <div className="flex items-center gap-">
          <span className="material-symbols-outlined text-[16px]" style={{ color: "#b06017" }}>workspace_premium</span>
          <CardTitle className="text-xs font-bold" style={{ color: "#7a4a1e" }}>Xác thực Local Brand</CardTitle>
          <span className="ml-auto text-[8px] font-semibold px-1.5 py-0.5 rounded-full border"
            style={{ background: "#fde8c8", color: "#b06017", borderColor: "#f0c890" }}>
            Bắt buộc
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 flex flex-col gap-3">
        {/* Bước 1: Chọn loại */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-bold" style={{ color: "#7a4a1e" }}>
            1. Loại cà phê đặc sản <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-wrap gap-1">
            {localProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProfile(p.id)}
                className={`px-2 py-1 rounded-lg border text-left text-[11px] transition-all flex flex-col ${
                  selLocalProfileId === p.id
                    ? "border-[#b06017] bg-[#fde8c8] text-[#7a3a0e] font-bold shadow-sm"
                    : "border-[#e8d5b4] bg-white text-[#8a6030] hover:border-[#c8a56d] hover:bg-[#fdf5eb]"
                }`}
              >
                <span>{p.archetypeName}</span>
                <span className="text-[9px] opacity-75 mt-0.5 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[9px]">location_on</span>
                  {p.provinceName}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bước 2: Đặc điểm (Bước 3 cũ) */}
        {selLocalProfile && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-bold" style={{ color: "#7a4a1e" }}>
              2. Đặc điểm nổi bật vùng miền
            </Label>
            <div className="flex flex-wrap gap-1">
              {selLocalProfile.expectedTraits.map((trait) => {
                const active = selLocalTraits.includes(trait)
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => onToggleTrait(trait)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? "border-[#b06017] bg-[#fde8c8] text-[#7a3a0e] shadow-sm"
                        : "border-[#e8d5b4] bg-white text-[#8a6030] hover:border-[#c8a56d]"
                    }`}
                  >
                    {active
                      ? <span className="material-symbols-outlined text-[11px]" style={{ color: "#b06017" }}>check_circle</span>
                      : <span className="material-symbols-outlined text-[11px] opacity-30">radio_button_unchecked</span>}
                    {trait}
                  </button>
                )
              })}
            </div>
            <p className="text-[9px] leading-tight" style={{ color: selLocalTraits.length >= MIN_TRAITS ? "#3a6b30" : "#c07030" }}>
              {selLocalTraits.length >= MIN_TRAITS
                ? `✓ Đã chọn đủ đặc tính (${selLocalTraits.length} đặc điểm)`
                : `Chọn tối thiểu ${MIN_TRAITS} đặc điểm (hiện: ${selLocalTraits.length}/${MIN_TRAITS})`}
            </p>
          </div>
        )}

        {/* Bước 3: Nhãn hiển thị dự kiến (Bước 4 cũ) */}
        {selLocalProfile && (
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-bold" style={{ color: "#7a4a1e" }}>
              3. Nhãn hiển thị dự kiến
            </Label>
            <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 bg-yellow-50/50"
              style={{ borderColor: "#fde8c8" }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: "#a16207" }}>workspace_premium</span>
              <span className="text-[11px] font-bold" style={{ color: "#7a4a1e" }}>{selLocalProfile.archetypeName}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-yellow-200 bg-yellow-100 text-yellow-800 shrink-0 ml-auto">
                Local Brand · Chờ duyệt
              </span>
            </div>
          </div>
        )}

        {/* Mismatch warnings */}
        {localMismatch && (
          <div className="rounded-lg border px-2.5 py-1.5 flex items-start gap-1.5 bg-red-50"
            style={{ borderColor: "#f5c2c2" }}>
            <span className="material-symbols-outlined text-[13px] shrink-0 mt-0.5 text-red-600">warning</span>
            <p className="text-[9px] leading-relaxed text-red-800">{localMismatch}</p>
          </div>
        )}

        {/* Bước 4: Mức độ xác thực (Bước 5 cũ) */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e8d5b4]">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-bold" style={{ color: "#7a4a1e" }}>
              Mức độ xác thực
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold" style={{ color: scoreColor }}>{verificationScore}%</span>
              <span className="text-[9px] font-semibold" style={{ color: scoreColor }}>({scoreLabel})</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#f0e0c0" }}>
            <div 
              className="h-full rounded-full transition-all duration-300" 
              style={{ width: `${verificationScore}%`, background: scoreColor }} 
            />
          </div>

          {/* Mini checklists */}
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[9px]">
            {[
              { label: "Chọn loại", done: !!selLocalProfile },
              { label: "Vùng miền", done: !!selLocalProfile },
              { label: `Đủ ${MIN_TRAITS} đặc điểm`, done: selLocalTraits.length >= MIN_TRAITS },
              { label: "Mô tả chuẩn hóa", done: isMeaningfulDescription },
            ].map(({ label, done }) => (
              <span key={label} className="flex items-center gap-0.5" style={{ color: done ? "#3a6b30" : "#a07040" }}>
                <span className="material-symbols-outlined text-[10px]">
                  {done ? "check_circle" : "radio_button_unchecked"}
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Why local brand box */}
        {selLocalProfile && (
          <div className="rounded-lg border px-3 py-2.5 flex flex-col gap-1.5 mt-1 bg-[#f2faf0] border-[#a5c89a]">
            <p className="text-[11px] font-semibold flex items-center gap-1.5 text-[#3a6b30]">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Vì sao sản phẩm này được xác thực Local Brand?
            </p>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] flex items-center gap-1 text-[#3a6b30]">
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                Thuộc nhóm cà phê đặc sản vùng miền của nền tảng
              </span>
              <span className="text-[10px] flex items-center gap-1 text-[#3a6b30]">
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                Vùng xuất xứ chuẩn hóa: <strong>{selLocalProfile.provinceName}</strong>
              </span>
            </div>
            <p className="text-[9px] pt-1.5 border-t border-[#c5e0be] text-[#6a8060] leading-normal">
              Lưu ý: Nhãn Local Brand sẽ được admin xem xét trước khi hiển thị chính thức. Điểm xác thực này là tự đánh giá ban đầu của hệ thống.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

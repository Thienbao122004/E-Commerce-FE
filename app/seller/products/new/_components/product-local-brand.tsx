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
    <Card className="border-[#c8a56d]" style={{ background: "linear-gradient(145deg,#fffbf2 0%,#fef6e8 100%)" }}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ color: "#b06017" }}>workspace_premium</span>
          <CardTitle className="text-sm font-bold" style={{ color: "#7a4a1e" }}>Xác thực Local Brand</CardTitle>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{ background: "#fde8c8", color: "#b06017", borderColor: "#f0c890" }}>
            Bắt buộc
          </span>
        </div>
        <p className="text-[11px] mt-1" style={{ color: "#8a6030" }}>
          Chọn <strong>loại cà phê</strong> và <strong>vùng miền xuất xứ</strong> — hệ thống sẽ gắn nhãn
          phân biệt sản phẩm của bạn với các địa phương khác.
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex flex-col gap-4">
        {/* Bước 1: Chọn loại */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold text-white" style={{ background: "#b06017" }}>1</span>
            <Label className="text-xs font-semibold" style={{ color: "#7a4a1e" }}>
              Loại cà phê đặc sản <span className="text-red-500">*</span>
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {localProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProfile(p.id)}
                className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left text-xs transition-all ${
                  selLocalProfileId === p.id
                    ? "border-[#b06017] bg-[#fde8c8] text-[#7a3a0e] shadow-sm"
                    : "border-[#e8d5b4] bg-white text-[#8a6030] hover:border-[#c8a56d] hover:bg-[#fdf5eb]"
                }`}
              >
                <span className="font-bold text-[12px]">{p.archetypeName}</span>
                <span className="text-[10px] mt-0.5 flex items-center gap-0.5 opacity-80">
                  <span className="material-symbols-outlined text-[10px]">location_on</span>
                  {p.provinceName}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bước 2: Vùng miền (locked) */}
        {selLocalProfile && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold text-white" style={{ background: "#b06017" }}>2</span>
              <Label className="text-xs font-semibold" style={{ color: "#7a4a1e" }}>Vùng miền xuất xứ</Label>
            </div>
            <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
              style={{ borderColor: "#d4a96a", background: "#fff7ed" }}>
              <span className="material-symbols-outlined text-[20px]" style={{ color: "#b06017" }}>location_on</span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "#7a4a1e" }}>{selLocalProfile.provinceName}</p>
                <p className="text-[10px]" style={{ color: "#a07040" }}>Được chuẩn hóa theo vùng đặc trưng nhất</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border"
                style={{ background: "#fde8c8", color: "#b06017", borderColor: "#f0c890" }}>
                <span className="material-symbols-outlined text-[12px]">lock</span>
                Không thể thay đổi
              </div>
            </div>
          </div>
        )}

        {/* Bước 3: Đặc điểm */}
        {selLocalProfile && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold text-white" style={{ background: "#b06017" }}>3</span>
              <Label className="text-xs font-semibold" style={{ color: "#7a4a1e" }}>Đặc điểm nổi bật vùng miền</Label>
            </div>
            {selLocalProfile.displayNote && (
              <p className="text-[11px] italic px-1 rounded-lg py-1.5 border"
                style={{ color: "#8a6030", background: "#fffdf5", borderColor: "#f0e0c0" }}>
                💡 {selLocalProfile.displayNote}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {selLocalProfile.expectedTraits.map((trait) => {
                const active = selLocalTraits.includes(trait)
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => onToggleTrait(trait)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? "border-[#b06017] bg-[#fde8c8] text-[#7a3a0e] shadow-sm"
                        : "border-[#e8d5b4] bg-white text-[#8a6030] hover:border-[#c8a56d]"
                    }`}
                  >
                    {active
                      ? <span className="material-symbols-outlined text-[13px]" style={{ color: "#b06017" }}>check_circle</span>
                      : <span className="material-symbols-outlined text-[13px] opacity-30">radio_button_unchecked</span>}
                    {trait}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] px-1" style={{ color: selLocalTraits.length >= MIN_TRAITS ? "#3a6b30" : "#c07030" }}>
              {selLocalTraits.length >= MIN_TRAITS
                ? `✓ Đã chọn ${selLocalTraits.length} đặc điểm — đủ điều kiện xác thực`
                : `Chọn tối thiểu ${MIN_TRAITS} đặc điểm để xác thực Local Brand (hiện: ${selLocalTraits.length}/${MIN_TRAITS})`}
            </p>
          </div>
        )}

        {/* Mismatch warning */}
        {localMismatch && (
          <div className="rounded-xl border px-3 py-2.5 flex items-start gap-2"
            style={{ borderColor: "#f0a030", background: "#fffbf0" }}>
            <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5" style={{ color: "#c07030" }}>warning</span>
            <div>
              <p className="text-[11px] font-semibold" style={{ color: "#8a4010" }}>Phát hiện mâu thuẫn thông tin</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#a05020" }}>{localMismatch}</p>
            </div>
          </div>
        )}

        {/* Bước 4: Badge preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold text-white" style={{ background: "#b06017" }}>4</span>
            <Label className="text-xs font-semibold" style={{ color: "#7a4a1e" }}>Nhãn sản phẩm sẽ hiển thị</Label>
          </div>
          {selLocalProfile ? (
            <div className="rounded-2xl border p-4 flex flex-col gap-3"
              style={{ borderColor: "#d4a96a", background: "linear-gradient(135deg,#fffbf2 0%,#fef0d0 100%)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="rounded-xl px-3 py-1.5 flex items-center gap-1.5 border shadow-sm"
                  style={{ background: "#fef9c3", borderColor: "#fde047" }}>
                  <span className="material-symbols-outlined text-[15px]" style={{ color: "#a16207" }}>schedule</span>
                  <span className="text-[12px] font-bold tracking-wide" style={{ color: "#854d0e" }}>Local Brand · Chờ duyệt</span>
                </div>
                <span className="text-[10px]" style={{ color: "#92400e" }}>Sẽ hiển thị sau khi admin xác nhận</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold" style={{ color: "#7a4a1e" }}>{selLocalProfile.archetypeName}</p>
                <p className="text-[12px] flex items-center gap-1" style={{ color: "#a07040" }}>
                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                  {selLocalProfile.provinceName}
                </p>
              </div>
              {selLocalTraits.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#a07040" }}>Đặc điểm nổi bật</p>
                  <div className="flex flex-col gap-0.5">
                    {selLocalTraits.map((t) => (
                      <span key={t} className="text-[11px] flex items-center gap-1.5" style={{ color: "#7a4a1e" }}>
                        <span style={{ color: "#b06017" }}>•</span> {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-3 py-4 text-center text-[11px] italic"
              style={{ borderColor: "#d4a96a", color: "#a07040" }}>
              Chọn loại cà phê để xem trước nhãn Local Brand
            </div>
          )}
        </div>

        {/* Bước 5: Điểm xác thực */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold text-white" style={{ background: "#b06017" }}>5</span>
            <Label className="text-xs font-semibold" style={{ color: "#7a4a1e" }}>Mức độ xác thực Local Brand</Label>
          </div>
          <div className="rounded-xl border p-3 flex flex-col gap-2.5" style={{ borderColor: "#d4a96a", background: "#fffdf8" }}>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#f0e0c0" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${verificationScore}%`, background: scoreColor }} />
              </div>
              <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: scoreColor }}>{verificationScore}%</span>
              <span className="text-[10px] font-semibold shrink-0" style={{ color: scoreColor }}>{scoreLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { label: "Chọn loại cà phê đặc sản", done: !!selLocalProfile },
                { label: "Vùng miền xác định (tự động)", done: !!selLocalProfile },
                { label: `Đủ ${MIN_TRAITS} đặc điểm nổi bật`, done: selLocalTraits.length >= MIN_TRAITS },
                { label: "Mô tả có nội dung thực (≥30 ký tự, ≥4 từ)", done: isMeaningfulDescription },
              ].map(({ label, done }) => (
                <span key={label} className="text-[10px] flex items-center gap-1"
                  style={{ color: done ? "#3a6b30" : "#a07040" }}>
                  <span className="material-symbols-outlined text-[12px]">
                    {done ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Why local brand box */}
        {selLocalProfile && verificationScore >= 50 && (
          <div className="rounded-xl border px-3 py-3 flex flex-col gap-2"
            style={{ borderColor: "#a5c89a", background: "#f2faf0" }}>
            <p className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "#3a6b30" }}>
              <span className="material-symbols-outlined text-[14px]">info</span>
              Vì sao sản phẩm này được xác thực Local Brand?
            </p>
            <div className="flex flex-col gap-1">
              {["Thuộc nhóm cà phê đặc sản vùng miền của nền tảng",
                `Vùng xuất xứ chuẩn hóa: ${selLocalProfile.provinceName}`,
              ].map((txt) => (
                <span key={txt} className="text-[11px] flex items-center gap-1.5" style={{ color: "#3a6b30" }}>
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  {txt}
                </span>
              ))}
              {selLocalTraits.length >= MIN_TRAITS && (
                <span className="text-[11px] flex items-center gap-1.5" style={{ color: "#3a6b30" }}>
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  Có đặc điểm đặc trưng của <strong>{selLocalProfile.archetypeName}</strong>
                </span>
              )}
            </div>
            <p className="text-[10px] pt-1 border-t" style={{ color: "#6a8060", borderColor: "#c5e0be" }}>
              Lưu ý: Nhãn Local Brand sẽ được admin xem xét trước khi hiển thị chính thức.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import { IconRefresh, IconDeviceFloppy, IconHistory } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import {
  fetchPlatformFeeSettings,
  updatePlatformFeeSettings,
  fetchPlatformFeeSettingsHistory,
} from "@/services/admin-platform-fees"
import type { PlatformFeeConfigDto } from "@/types/admin-platform-fees"
import { SetHeaderActions } from "@/hooks/use-header-actions"
import { formatDateTimeVN } from "@/lib/formatters"

const PAGE_SIZE = 10

export default function AdminPlatformFeeConfigPage() {
  const [current, setCurrent] = React.useState<PlatformFeeConfigDto | null>(null)
  const [loadingCurrent, setLoadingCurrent] = React.useState(true)

  const [newPercent, setNewPercent] = React.useState("")
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const [history, setHistory] = React.useState<PlatformFeeConfigDto[]>([])
  const [historyTotal, setHistoryTotal] = React.useState(0)
  const [historyPage, setHistoryPage] = React.useState(1)
  const [loadingHistory, setLoadingHistory] = React.useState(true)

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const loadCurrent = React.useCallback(async () => {
    setLoadingCurrent(true)
    const tk = await getToken()
    if (!tk) { setLoadingCurrent(false); return }
    try {
      const res = await fetchPlatformFeeSettings(tk)
      if (res.success && res.data) {
        setCurrent(res.data)
        setNewPercent(String(res.data.commissionPercent))
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải cấu hình phí sàn")
    } finally {
      setLoadingCurrent(false)
    }
  }, [])

  const loadHistory = React.useCallback(async () => {
    setLoadingHistory(true)
    const tk = await getToken()
    if (!tk) { setLoadingHistory(false); return }
    try {
      const res = await fetchPlatformFeeSettingsHistory(tk, historyPage, PAGE_SIZE)
      if (res.success && res.data) {
        setHistory(res.data.items)
        setHistoryTotal(res.data.totalCount)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải lịch sử phí sàn")
    } finally {
      setLoadingHistory(false)
    }
  }, [historyPage])

  React.useEffect(() => { loadCurrent() }, [loadCurrent])
  React.useEffect(() => { loadHistory() }, [loadHistory])

  const handleSave = async () => {
    const percent = parseFloat(newPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Tỷ lệ phí phải trong khoảng 0 – 100")
      return
    }
    setSaving(true)
    const tk = await getToken()
    if (!tk) { setSaving(false); return }
    try {
      const res = await updatePlatformFeeSettings(tk, {
        commissionPercent: percent,
        note: note.trim() || null,
      })
      if (res.success && res.data) {
        setCurrent(res.data)
        setNote("")
        toast.success(`Đã cập nhật phí sàn thành ${percent}%`)
        setHistoryPage(1)
        loadHistory()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi cập nhật phí sàn")
    } finally {
      setSaving(false)
    }
  }

  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE))
  const hasChanged =
    current !== null && parseFloat(newPercent) !== current.commissionPercent

  return (
    <>
      <SetHeaderActions>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { loadCurrent(); setHistoryPage(1); loadHistory() }}
          disabled={loadingCurrent}
        >
          <IconRefresh className={`mr-1.5 size-4 ${loadingCurrent ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </SetHeaderActions>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

        {/* Current setting banner */}
        <div
          className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: "linear-gradient(135deg, rgba(236,127,19,0.08) 0%, rgba(236,127,19,0.03) 100%)", borderColor: "rgba(236,127,19,0.25)" }}
        >
          <div
            className="size-14 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(236,127,19,0.15)" }}
          >
            <span className="text-2xl font-black" style={{ color: "var(--color-text-secondary)" }}>%</span>
          </div>
          <div className="flex-1">
            {loadingCurrent ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-56" />
              </div>
            ) : current ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
                    {current.commissionPercent}%
                  </span>
                  <span className="text-sm text-gray-500">tỷ lệ hoa hồng hiện tại</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Cập nhật lần cuối {formatDateTimeVN(current.createdAt)}
                  {current.changedByName ? ` bởi ${current.changedByName}` : ""}
                  {current.note ? ` — "${current.note}"` : ""}
                </p>
              </>
            ) : null}
          </div>
          {!loadingCurrent && current && (
            <Badge
              variant="secondary"
              className="self-start sm:self-center text-xs px-3 py-1"
              style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              Đang áp dụng
            </Badge>
          )}
        </div>

        {/* Update form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconDeviceFloppy className="size-4" />
              Cập nhật tỷ lệ phí sàn
            </CardTitle>
            <CardDescription>
              Tỷ lệ hoa hồng mới sẽ được áp dụng cho tất cả đơn hàng hoàn thành sau thời điểm lưu.
              Mỗi lần thay đổi đều được lưu vào lịch sử bên dưới.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fee-percent">
                  Tỷ lệ hoa hồng mới (%)
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="fee-percent"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={newPercent}
                    onChange={(e) => setNewPercent(e.target.value)}
                    placeholder="Ví dụ: 10"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-400">Giá trị từ 0 đến 100. Seller nhận (100 - %) của subtotal.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fee-note">Ghi chú lý do thay đổi</Label>
                <Textarea
                  id="fee-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Điều chỉnh theo chính sách Q2/2025..."
                  className="resize-none h-[78px]"
                  maxLength={300}
                />
              </div>
            </div>

            {/* Preview */}
            {newPercent !== "" && !isNaN(parseFloat(newPercent)) && (
              <div className="rounded-lg p-3 bg-amber-50 border border-amber-100 text-sm space-y-1">
                <p className="font-semibold text-amber-800">Xem trước tác động</p>
                <p className="text-amber-700">
                  Đơn hàng <span className="font-mono font-bold">100.000₫</span>:
                  phí sàn <span className="font-mono font-bold text-amber-900">{(100000 * parseFloat(newPercent || "0") / 100).toLocaleString("vi-VN")}₫</span>{" "}
                  · seller nhận <span className="font-mono font-bold text-green-700">{(100000 * (1 - parseFloat(newPercent || "0") / 100)).toLocaleString("vi-VN")}₫</span>
                </p>
              </div>
            )}

            <Separator />

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving || loadingCurrent || newPercent === ""}
                className="gap-2"
                style={
                  hasChanged
                    ? { backgroundColor: "var(--color-primary)", color: "white" }
                    : {}
                }
              >
                {saving ? (
                  <>
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy className="size-4" />
                    {hasChanged ? "Lưu thay đổi" : "Lưu (không đổi)"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconHistory className="size-4" />
              Lịch sử thay đổi
            </CardTitle>
            <CardDescription>
              {historyTotal} lần thay đổi — trang {historyPage}/{historyTotalPages}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời điểm</TableHead>
                    <TableHead className="text-right">Tỷ lệ (%)</TableHead>
                    <TableHead>Người thay đổi</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHistory ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Đang tải…
                      </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Chưa có lịch sử thay đổi
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDateTimeVN(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold tabular-nums"
                            style={{
                              backgroundColor:
                                historyPage === 1 && idx === 0
                                  ? "rgba(34,197,94,0.12)"
                                  : "rgba(236,127,19,0.1)",
                              color:
                                historyPage === 1 && idx === 0 ? "#16a34a" : "var(--color-text-secondary)",
                            }}
                          >
                            {item.commissionPercent}%
                            {historyPage === 1 && idx === 0 && (
                              <span className="ml-1 text-[10px] font-semibold text-green-600">(hiện tại)</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {item.changedByName ?? <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell className="text-sm max-w-[220px] truncate text-gray-500">
                          {item.note ?? <span className="text-gray-300">—</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage <= 1 || loadingHistory}
                  onClick={() => setHistoryPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {historyPage} / {historyTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage >= historyTotalPages || loadingHistory}
                  onClick={() => setHistoryPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

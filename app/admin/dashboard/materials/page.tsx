"use client"

import * as React from "react"
import {
  IconPlus, IconEdit, IconTrash, IconToggleLeft, IconToggleRight,
  IconRefresh, IconPackage,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { SetHeaderActions } from "@/hooks/use-header-actions"
import { formatDateVN } from "@/lib/formatters"
import {
  fetchAdminMaterials,
  createMaterial,
  updateMaterial,
  toggleMaterialActive,
  deleteMaterial,
} from "@/services/admin-materials"
import type { MaterialDto } from "@/services/admin-materials"
import FilterBar from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { useDebounce } from "@/hooks/use-debounce"

const PAGE_SIZE = 20

type ActiveFilter = "all" | "active" | "inactive"

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = React.useState<MaterialDto[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput)
  const [activeFilter, setActiveFilter] = React.useState<ActiveFilter>("all")

  // Sheet (create / edit)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<MaterialDto | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formDesc, setFormDesc] = React.useState("")

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = React.useState<MaterialDto | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const load = React.useCallback(async () => {
    setLoading(true)
    const tk = await getToken()
    if (!tk) { setLoading(false); return }
    try {
      const isActive =
        activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined
      const res = await fetchAdminMaterials(tk, page, PAGE_SIZE, debouncedSearch || undefined, isActive)
      if (res.success) {
        setMaterials(res.materials)
        setTotal(res.totalCount)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải danh sách chất liệu")
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, activeFilter])

  React.useEffect(() => { load() }, [load])
  React.useEffect(() => { setPage(1) }, [debouncedSearch, activeFilter])

  const openCreate = () => {
    setEditTarget(null)
    setFormName("")
    setFormDesc("")
    setSheetOpen(true)
  }

  const openEdit = (m: MaterialDto) => {
    setEditTarget(m)
    setFormName(m.name)
    setFormDesc(m.description ?? "")
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Tên chất liệu không được để trống"); return }
    setActionLoading(true)
    const tk = await getToken()
    if (!tk) { setActionLoading(false); return }
    try {
      const data = { name: formName.trim(), description: formDesc.trim() || null }
      const res = editTarget
        ? await updateMaterial(tk, editTarget.id, data)
        : await createMaterial(tk, data)
      if (res.success) {
        toast.success(editTarget ? "Đã cập nhật chất liệu" : "Đã tạo chất liệu mới")
        setSheetOpen(false)
        load()
      } else {
        toast.error(res.message ?? "Lỗi lưu chất liệu")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle = async (m: MaterialDto) => {
    setActionLoading(true)
    const tk = await getToken()
    if (!tk) { setActionLoading(false); return }
    try {
      const res = await toggleMaterialActive(tk, m.id)
      if (res.success) {
        toast.success(m.isActive ? `Đã vô hiệu hóa "${m.name}"` : `Đã kích hoạt "${m.name}"`)
        load()
      } else {
        toast.error(res.message ?? "Lỗi thay đổi trạng thái")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    const tk = await getToken()
    if (!tk) { setActionLoading(false); return }
    try {
      const res = await deleteMaterial(tk, deleteTarget.id)
      if (res.success) {
        toast.success(`Đã xóa chất liệu "${deleteTarget.name}"`)
        setDeleteTarget(null)
        load()
      } else {
        toast.error(res.message ?? "Lỗi xóa chất liệu")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setActionLoading(false)
    }
  }

  const filterConfigs = React.useMemo(() => [
    {
      key: "active",
      label: "Trạng thái",
      value: activeFilter,
      onChange: (v: string) => setActiveFilter(v as ActiveFilter),
      width: "w-[160px]",
      options: [
        { value: "all", label: "Tất cả" },
        { value: "active", label: "Đang hoạt động" },
        { value: "inactive", label: "Vô hiệu hóa" },
      ],
    },
  ], [activeFilter])

  return (
    <>
      <SetHeaderActions>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <IconRefresh className={`mr-1.5 size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <IconPlus className="size-4" />
          Thêm chất liệu
        </Button>
      </SetHeaderActions>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {/* Stats banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Tổng chất liệu", value: loading ? "—" : total },
            {
              label: "Đang hoạt động",
              value: loading ? "—" : materials.filter((m) => m.isActive).length,
              color: "text-green-600",
            },
            {
              label: "Vô hiệu hóa",
              value: loading ? "—" : materials.filter((m) => !m.isActive).length,
              color: "text-gray-400",
            },
            {
              label: "Đang dùng",
              value: loading ? "—" : materials.filter((m) => m.productCount > 0).length,
              color: "text-blue-600",
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-xl font-bold tabular-nums ${s.color ?? ""}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <FilterBar
          searchPlaceholder="Tìm chất liệu..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearch={load}
          filters={filterConfigs}
        />

        <div className="overflow-hidden rounded-lg border bg-white">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-10 text-center">STT</TableHead>
                <TableHead>Tên chất liệu</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-center">Sản phẩm</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : materials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <IconPackage className="size-10 opacity-30" />
                      <p>Không tìm thấy chất liệu nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                materials.map((m, idx) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm">{m.name}</span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {m.slug}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm text-muted-foreground truncate block">
                        {m.description ?? <span className="italic opacity-40">—</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {m.isActive ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs">
                          Vô hiệu
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-semibold tabular-nums ${m.productCount > 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                        {m.productCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateVN(m.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title={m.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          onClick={() => handleToggle(m)}
                          disabled={actionLoading}
                        >
                          {m.isActive
                            ? <IconToggleRight className="size-4 text-green-600" />
                            : <IconToggleLeft className="size-4 text-gray-400" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Chỉnh sửa"
                          onClick={() => openEdit(m)}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          title="Xóa"
                          onClick={() => setDeleteTarget(m)}
                          disabled={m.productCount > 0}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && (
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
            itemLabel="chất liệu"
          />
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!v) setSheetOpen(false) }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Chỉnh sửa chất liệu" : "Thêm chất liệu mới"}</SheetTitle>
            <SheetDescription>
              {editTarget
                ? `Cập nhật thông tin cho "${editTarget.name}"`
                : "Tạo chất liệu mới cho hệ thống. Slug sẽ được tự động tạo từ tên."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 py-6 px-6">
            <div className="space-y-1.5">
              <Label htmlFor="mat-name">
                Tên chất liệu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mat-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ví dụ: Cotton, Lụa, Polyester..."
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mat-desc">Mô tả</Label>
              <Textarea
                id="mat-desc"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Mô tả ngắn về chất liệu này..."
                className="resize-none h-28"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{formDesc.length}/500 ký tự</p>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={actionLoading || !formName.trim()}>
              {actionLoading ? "Đang lưu..." : editTarget ? "Cập nhật" : "Tạo mới"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa chất liệu</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa chất liệu{" "}
              <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>?
              Chỉ có thể xóa khi không có sản phẩm nào đang sử dụng. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

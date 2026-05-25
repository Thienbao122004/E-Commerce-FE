"use client"

import * as React from "react"
import {
  IconPlus, IconEdit, IconTrash, IconToggleLeft, IconToggleRight,
  IconRefresh, IconTag,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { SetHeaderActions } from "@/hooks/use-header-actions"
import { formatDateVN } from "@/lib/formatters"
import { fetchTags, createTag, updateTag, deleteTag, toggleTagActive } from "@/services/tags"
import type { Tag } from "@/types/tag"
import FilterBar from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { useDebounce } from "@/hooks/use-debounce"

const PAGE_SIZE = 20
type ActiveFilter = "all" | "active" | "inactive"

export default function TagsPage() {
  const [tags, setTags] = React.useState<Tag[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput)
  const [activeFilter, setActiveFilter] = React.useState<ActiveFilter>("all")

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editTag, setEditTag] = React.useState<Tag | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formIsActive, setFormIsActive] = React.useState(true)
  const [deleteDlg, setDeleteDlg] = React.useState<Tag | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const isActiveParam =
        activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined
      const r = await fetchTags(page, PAGE_SIZE, debouncedSearch || undefined, isActiveParam)
      if (r.success) { setTags(r.tags); setTotal(r.totalCount) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi tải danh sách tag") }
    finally { setLoading(false) }
  }, [page, debouncedSearch, activeFilter])

  React.useEffect(() => { load() }, [load])
  React.useEffect(() => { setPage(1) }, [debouncedSearch, activeFilter])

  const openCreate = () => {
    setEditTag(null)
    setFormName("")
    setFormIsActive(true)
    setSheetOpen(true)
  }

  const openEdit = (t: Tag) => {
    setEditTag(t)
    setFormName(t.name)
    setFormIsActive(t.isActive)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Tên tag không được để trống"); return }
    setActionLoading(true)
    try {
      const r = editTag
        ? await updateTag(editTag.id, formName.trim(), formIsActive)
        : await createTag(formName.trim())
      if (r.success) {
        toast.success(editTag ? "Đã cập nhật tag" : "Đã tạo tag mới")
        setSheetOpen(false)
        load()
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setActionLoading(false) }
  }

  const handleToggle = async (t: Tag) => {
    setActionLoading(true)
    try {
      const r = await toggleTagActive(t.id, !t.isActive)
      if (r.success) {
        toast.success(t.isActive ? `Đã vô hiệu hóa "${t.name}"` : `Đã kích hoạt "${t.name}"`)
        load()
      } else toast.error(r.message ?? "Lỗi thay đổi trạng thái")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteDlg) return
    setActionLoading(true)
    try {
      const r = await deleteTag(deleteDlg.id)
      if (r.success) { toast.success(`Đã xóa tag "${deleteDlg.name}"`); setDeleteDlg(null); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setActionLoading(false) }
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
          Thêm tag
        </Button>
      </SetHeaderActions>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {/* Stats banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Tổng tag", value: loading ? "—" : total },
            { label: "Đang hoạt động", value: loading ? "—" : tags.filter((t) => t.isActive).length, color: "text-green-600" },
            { label: "Vô hiệu hóa", value: loading ? "—" : tags.filter((t) => !t.isActive).length, color: "text-gray-400" },
            { label: "Đang dùng", value: loading ? "—" : tags.filter((t) => t.productCount > 0).length, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-xl font-bold tabular-nums ${s.color ?? ""}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <FilterBar
          searchPlaceholder="Tìm theo tên tag..."
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
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Tên tag</TableHead>
                <TableHead>Slug</TableHead>
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
              ) : tags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <IconTag className="size-10 opacity-30" />
                      <p>Không tìm thấy tag nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((t, idx) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">{t.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-sm">{t.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {t.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      {t.isActive ? (
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
                      <span className={`text-sm font-semibold tabular-nums ${t.productCount > 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                        {t.productCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateVN(t.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="size-8"
                          title={t.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          onClick={() => handleToggle(t)}
                          disabled={actionLoading}
                        >
                          {t.isActive
                            ? <IconToggleRight className="size-4 text-green-600" />
                            : <IconToggleLeft className="size-4 text-gray-400" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="size-8"
                          title="Chỉnh sửa"
                          onClick={() => openEdit(t)}
                          disabled={actionLoading}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive"
                          title="Xóa"
                          onClick={() => setDeleteDlg(t)}
                          disabled={actionLoading || t.productCount > 0}
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
            itemLabel="tags"
          />
        )}
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!v) setSheetOpen(false) }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editTag ? "Chỉnh sửa tag" : "Thêm tag mới"}</SheetTitle>
            <SheetDescription>
              {editTag ? `Cập nhật thông tin cho "${editTag.name}"` : "Tạo tag mới cho hệ thống."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 py-6 px-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tên tag <span className="text-red-500">*</span></label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Arabica, Robusta, Rang mộc..."
                maxLength={100}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Hiển thị (active)</p>
                <p className="text-xs text-muted-foreground">Bật để tag xuất hiện trên storefront và AI gợi ý</p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={actionLoading}>Hủy</Button>
            <Button onClick={handleSave} disabled={actionLoading || !formName.trim()}>
              {actionLoading ? "Đang lưu..." : editTag ? "Cập nhật" : "Tạo mới"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={deleteDlg !== null} onOpenChange={(v) => { if (!v) setDeleteDlg(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tag</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa tag <strong>&ldquo;{deleteDlg?.name}&rdquo;</strong>?
              Chỉ có thể xóa khi không có sản phẩm nào đang sử dụng. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDlg(null)} disabled={actionLoading}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

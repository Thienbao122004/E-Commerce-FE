"use client"

import * as React from "react"
import {
  IconPlus, IconTrash, IconEdit, IconTag,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchTags, createTag, updateTag, deleteTag } from "@/services/tags"
import type { Tag } from "@/types/tag"
import FilterBar from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { SortableTableHead, getNextSort } from "@/components/common/table-sorting"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import type { SortConfig } from "@/components/common/table-sorting"
import { SetHeaderActions } from "@/hooks/use-header-actions"

const fmtDate = (t: string) => new Date(t).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

export default function TagsPage() {
  const [tags, setTags] = React.useState<Tag[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput)
  const [sort, setSort] = React.useState<SortConfig | null>(null)
  const ps = 10
  const tp = Math.ceil(total / ps)

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editTag, setEditTag] = React.useState<Tag | null>(null)
  const [formName, setFormName] = React.useState("")
  const [deleteDlg, setDeleteDlg] = React.useState<Tag | null>(null)

  React.useEffect(() => { setPg(1) }, [debouncedSearch])

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setLoading(false); return }
    try {
      const r = await fetchTags(tk, pg, ps, debouncedSearch || null)
      if (r.success) { setTags(r.tags); setTotal(r.totalCount) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg, debouncedSearch])

  React.useEffect(() => { load() }, [load])

  const sortAccessor = React.useCallback((row: Tag, key: string): string | number => {
    switch (key) {
      case "name": return row.name
      case "slug": return row.slug
      case "productCount": return row.productCount
      case "createdAt": return row.createdAt
      default: return ""
    }
  }, [])

  const { filtered: sorted } = useTableData<Tag>({
    data: tags,
    sort,
    sortAccessor,
  })

  const handleSort = (key: string) => setSort(getNextSort(sort, key))

  const openCreate = () => {
    setEditTag(null)
    setFormName("")
    setSheetOpen(true)
  }

  const openEdit = (t: Tag) => {
    setEditTag(t)
    setFormName(t.name)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!formName) return
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setActionLoading(false); return }
    try {
      const r = editTag
        ? await updateTag(tk, editTag.id, formName)
        : await createTag(tk, formName)
      if (r.success) {
        toast.success(r.message ?? (editTag ? "Cập nhật thành công" : "Tạo thành công"))
        setSheetOpen(false)
        load()
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteDlg) return
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setActionLoading(false); return }
    try {
      const r = await deleteTag(tk, deleteDlg.id)
      if (r.success) { toast.success(r.message ?? "Đã xóa"); setDeleteDlg(null); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setActionLoading(false) }
  }

  return (
    <>
      <SetHeaderActions>
        <Button size="sm" onClick={openCreate}>
          <IconPlus className="mr-1.5 size-4" />
          Thêm mới
        </Button>
      </SetHeaderActions>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4">
          <FilterBar
            searchPlaceholder="Tìm theo tên tag..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={load}
          />

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead className="w-16">ID</TableHead>
                  <SortableTableHead sortKey="name" currentSort={sort} onSort={handleSort} className="w-48">Tên tag</SortableTableHead>
                  <SortableTableHead sortKey="slug" currentSort={sort} onSort={handleSort}>Slug</SortableTableHead>
                  <SortableTableHead sortKey="productCount" currentSort={sort} onSort={handleSort} className="text-center w-24">Sản phẩm</SortableTableHead>
                  <SortableTableHead sortKey="createdAt" currentSort={sort} onSort={handleSort} className="w-28">Ngày tạo</SortableTableHead>
                  <TableHead className="w-24 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                )) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <IconTag className="mx-auto mb-2 size-8 opacity-50" />
                      Chưa có tag nào.
                    </TableCell>
                  </TableRow>
                ) : sorted.map((t, idx) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(pg - 1) * ps + idx + 1}</TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">{t.id}</TableCell>
                    <TableCell className="font-medium"><Badge variant="outline" className="text-sm">{t.name}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.slug}</TableCell>
                    <TableCell className="text-center tabular-nums">{t.productCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{fmtDate(t.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(t)} disabled={actionLoading}><IconEdit className="size-4" /></Button>
                        <Button variant="ghost" size="icon" className="size-8 text-red-600" onClick={() => setDeleteDlg(t)} disabled={actionLoading || t.productCount > 0}><IconTrash className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!loading && (
            <TablePagination
              currentPage={pg}
              totalPages={tp}
              totalItems={total}
              onPageChange={setPg}
              itemLabel="tags"
            />
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editTag ? "Chỉnh sửa tag" : "Thêm tag mới"}</SheetTitle>
            <SheetDescription>
              {editTag ? `Đang sửa: ${editTag.name}` : "Nhập tên tag mới"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên tag *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Thời trang"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={actionLoading}>Hủy</Button>
            <Button onClick={handleSave} disabled={actionLoading || !formName}>
              {actionLoading ? "Đang xử lý..." : editTag ? "Cập nhật" : "Tạo mới"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDlg !== null} onOpenChange={(v) => { if (!v) setDeleteDlg(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa tag</DialogTitle>
            <DialogDescription>Bạn có chắc muốn xóa tag &quot;{deleteDlg?.name}&quot;?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDlg(null)} disabled={actionLoading}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>{actionLoading ? "Đang xóa..." : "Xóa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

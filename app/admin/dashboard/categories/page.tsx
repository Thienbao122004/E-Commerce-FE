"use client"

import * as React from "react"
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconToggleLeft,
  IconToggleRight,
  IconFolderOpen,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchCategories,
  createCategory,
  updateCategory,
  activateCategory,
  deactivateCategory,
  deleteCategory,
} from "@/services/categories"
import type { Category } from "@/types/category"
import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { SortableTableHead, getNextSort } from "@/components/common/table-sorting"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import type { SortConfig } from "@/components/common/table-sorting"
import { SetHeaderActions } from "@/hooks/use-header-actions"

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput)
  const [sort, setSort] = React.useState<SortConfig | null>(null)
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [levelFilter, setLevelFilter] = React.useState("all")
  const ps = 10
  const tp = Math.ceil(totalCount / ps)

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editCat, setEditCat] = React.useState<Category | null>(null)
  const [formCode, setFormCode] = React.useState("")
  const [formName, setFormName] = React.useState("")
  const [formParentId, setFormParentId] = React.useState("")

  const [deleteCat, setDeleteCat] = React.useState<Category | null>(null)

  React.useEffect(() => { setPg(1) }, [debouncedSearch])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchCategories(pg, ps)
      if (res.success) {
        setCategories(res.categories)
        setTotalCount(res.totalCount)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải danh mục")
    } finally {
      setLoading(false)
    }
  }, [pg])

  React.useEffect(() => { load() }, [load])

  const sortAccessor = React.useCallback((row: Category, key: string): string | number => {
    switch (key) {
      case "code": return row.code
      case "name": return row.name
      case "level": return row.level
      case "productCount": return row.productCount
      case "isActive": return row.isActive ? 1 : 0
      case "id": return row.id
      default: return ""
    }
  }, [])

  const tableFilters = React.useMemo(() => [
    { key: "isActive", value: activeFilter, match: (r: Record<string, unknown>) => r.isActive ? "active" : "inactive" },
    { key: "level", value: levelFilter, match: (r: Record<string, unknown>) => r.level },
  ], [activeFilter, levelFilter])

  const { filtered: sorted } = useTableData<Category>({
    data: categories,
    search: debouncedSearch,
    searchKeys: ["code", "name", "parentName"],
    filters: tableFilters,
    sort,
    sortAccessor,
  })

  const handleSort = (key: string) => setSort(getNextSort(sort, key))

  const filters: FilterConfig[] = React.useMemo(() => [
    {
      key: "isActive",
      label: "Trạng thái",
      value: activeFilter,
      onChange: (v: string) => { setActiveFilter(v); setPg(1) },
      width: "w-[160px]",
      options: [
        { value: "all", label: "Tất cả trạng thái" },
        { value: "active", label: "Hoạt động" },
        { value: "inactive", label: "Vô hiệu" },
      ],
    },
    {
      key: "level",
      label: "Cấp",
      value: levelFilter,
      onChange: (v: string) => { setLevelFilter(v); setPg(1) },
      width: "w-[140px]",
      options: [
        { value: "all", label: "Tất cả cấp" },
        { value: "1", label: "Cấp 1" },
        { value: "2", label: "Cấp 2" },
        { value: "3", label: "Cấp 3" },
      ],
    },
  ], [activeFilter, levelFilter])

  const openCreate = () => {
    setEditCat(null)
    setFormCode("")
    setFormName("")
    setFormParentId("")
    setSheetOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditCat(c)
    setFormCode(c.code)
    setFormName(c.name)
    setFormParentId(c.parentId ? String(c.parentId) : "")
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!formCode || !formName) return
    setActionLoading(true)
    try {
      const parentId = formParentId ? Number(formParentId) : null
      const res = editCat
        ? await updateCategory(editCat.id, { code: formCode, name: formName, parentId })
        : await createCategory({ code: formCode, name: formName, parentId })
      if (res.success) {
        toast.success(res.message ?? (editCat ? "Cập nhật thành công" : "Tạo thành công"))
        setSheetOpen(false)
        load()
      } else {
        toast.error(res.message ?? "Lỗi")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle = async (c: Category) => {
    setActionLoading(true)
    try {
      const res = c.isActive
        ? await deactivateCategory(c.id)
        : await activateCategory(c.id)
      if (res.success) {
        toast.success(res.message ?? "Thành công")
        load()
      } else {
        toast.error(res.message ?? "Lỗi")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCat) return
    setActionLoading(true)
    try {
      const res = await deleteCategory(deleteCat.id)
      if (res.success) {
        toast.success(res.message ?? "Đã xóa")
        setDeleteCat(null)
        load()
      } else {
        toast.error(res.message ?? "Lỗi xóa")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa")
    } finally {
      setActionLoading(false)
    }
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
            searchPlaceholder="Tìm theo mã, tên danh mục..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={load}
            filters={filters}
          />

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <SortableTableHead sortKey="id" currentSort={sort} onSort={handleSort} className="w-12 text-center">ID</SortableTableHead>
                  <SortableTableHead sortKey="code" currentSort={sort} onSort={handleSort} className="w-24">Mã</SortableTableHead>
                  <SortableTableHead sortKey="name" currentSort={sort} onSort={handleSort} className="w-48">Tên danh mục</SortableTableHead>
                  <TableHead className="w-24">Cấp</TableHead>
                  <TableHead className="w-48">Danh mục cha</TableHead>
                  <SortableTableHead sortKey="productCount" currentSort={sort} onSort={handleSort} className="text-center w-12">Sản phẩm</SortableTableHead>
                  <SortableTableHead sortKey="isActive" currentSort={sort} onSort={handleSort} className="w-24">Trạng thái</SortableTableHead>
                  <TableHead className="w-24 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <IconFolderOpen className="mx-auto mb-2 size-8 opacity-50" />
                      Chưa có danh mục nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((c, idx) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(pg - 1) * ps + idx + 1}</TableCell>
                      <TableCell className="tabular-nums">{c.id}</TableCell>
                      <TableCell className="font-mono text-sm">{c.code}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">Cấp {c.level}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.parentName ?? "—"}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{c.productCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${c.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                        >
                          {c.isActive ? "Hoạt động" : "Vô hiệu"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(c)} disabled={actionLoading}>
                            <IconEdit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => handleToggle(c)} disabled={actionLoading}>
                            {c.isActive ? <IconToggleRight className="size-4 text-green-600" /> : <IconToggleLeft className="size-4 text-red-600" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-red-600" onClick={() => setDeleteCat(c)} disabled={actionLoading || c.productCount > 0}>
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
              currentPage={pg}
              totalPages={tp}
              totalItems={totalCount}
              onPageChange={setPg}
              itemLabel="danh mục"
            />
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editCat ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</SheetTitle>
            <SheetDescription>
              {editCat ? `Đang sửa: ${editCat.name}` : "Nhập thông tin danh mục mới"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mã danh mục *</label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="VD: electronics" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên danh mục *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Điện tử" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">ID danh mục cha (tùy chọn)</label>
              <Input value={formParentId} onChange={(e) => setFormParentId(e.target.value)} placeholder="Để trống nếu là cấp cao nhất" />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={actionLoading}>Hủy</Button>
            <Button onClick={handleSave} disabled={actionLoading || !formCode || !formName}>
              {actionLoading ? "Đang xử lý..." : editCat ? "Cập nhật" : "Tạo mới"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteCat !== null} onOpenChange={(v) => { if (!v) setDeleteCat(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa danh mục</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa danh mục &quot;{deleteCat?.name}&quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCat(null)} disabled={actionLoading}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

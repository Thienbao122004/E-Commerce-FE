import type {
  CategoryListResponse,
  CategoryResponse,
  CategoryTreeResponse,
  MigrateProductsResponse,
} from "@/lib/types/category"

const API = process.env.NEXT_PUBLIC_API_URL

// ---------- List ----------
export async function fetchCategories(
  token: string,
  page = 1,
  pageSize = 20,
  level?: number | null,
  isActive?: boolean | null
): Promise<CategoryListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (level !== null && level !== undefined) params.set("level", String(level))
  if (isActive !== null && isActive !== undefined) params.set("isActive", String(isActive))

  const res = await fetch(`${API}/api/admin/categories?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh mục")
  return res.json()
}

// ---------- Tree ----------
export async function fetchCategoryTree(
  token: string
): Promise<CategoryTreeResponse> {
  const res = await fetch(`${API}/api/admin/categories/tree`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải cây danh mục")
  return res.json()
}

// ---------- Detail ----------
export async function fetchCategoryById(
  token: string,
  id: number
): Promise<CategoryResponse> {
  const res = await fetch(`${API}/api/admin/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải chi tiết danh mục")
  return res.json()
}

// ---------- Create ----------
export async function createCategory(
  token: string,
  data: { parentId?: number | null; code: string; name: string }
): Promise<CategoryResponse> {
  const res = await fetch(`${API}/api/admin/categories`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Lỗi tạo danh mục")
  return res.json()
}

// ---------- Update ----------
export async function updateCategory(
  token: string,
  id: number,
  data: { code?: string; name?: string; parentId?: number | null }
): Promise<CategoryResponse> {
  const res = await fetch(`${API}/api/admin/categories/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Lỗi cập nhật danh mục")
  return res.json()
}

// ---------- Activate ----------
export async function activateCategory(
  token: string,
  id: number
): Promise<CategoryResponse> {
  const res = await fetch(`${API}/api/admin/categories/${id}/activate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi kích hoạt danh mục")
  return res.json()
}

// ---------- Deactivate ----------
export async function deactivateCategory(
  token: string,
  id: number,
  reason?: string
): Promise<CategoryResponse> {
  const res = await fetch(`${API}/api/admin/categories/${id}/deactivate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error("Lỗi vô hiệu hóa danh mục")
  return res.json()
}

// ---------- Delete ----------
export async function deleteCategory(
  token: string,
  id: number
): Promise<CategoryResponse> {
  const res = await fetch(`${API}/api/admin/categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi xóa danh mục")
  return res.json()
}

// ---------- Migrate Products ----------
export async function migrateProducts(
  token: string,
  fromId: number,
  targetCategoryId: number
): Promise<MigrateProductsResponse> {
  const res = await fetch(
    `${API}/api/admin/categories/${fromId}/migrate-products`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targetCategoryId }),
    }
  )
  if (!res.ok) throw new Error("Lỗi di chuyển sản phẩm")
  return res.json()
}

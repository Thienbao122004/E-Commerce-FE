import type { TagListResponse, TagResponse } from "@/types/tag"

const API = process.env.NEXT_PUBLIC_API_URL

// ---------- List ----------
export async function fetchTags(
  token: string,
  page = 1,
  pageSize = 20,
  search?: string | null
): Promise<TagListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (search) params.set("search", search)

  const res = await fetch(`${API}/api/admin/tags?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách tags")
  return res.json()
}

// ---------- Detail ----------
export async function fetchTagById(
  token: string,
  id: number
): Promise<TagResponse> {
  const res = await fetch(`${API}/api/admin/tags/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải chi tiết tag")
  return res.json()
}

// ---------- Create ----------
export async function createTag(
  token: string,
  name: string
): Promise<TagResponse> {
  const res = await fetch(`${API}/api/admin/tags`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error("Lỗi tạo tag")
  return res.json()
}

// ---------- Update ----------
export async function updateTag(
  token: string,
  id: number,
  name: string
): Promise<TagResponse> {
  const res = await fetch(`${API}/api/admin/tags/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error("Lỗi cập nhật tag")
  return res.json()
}

// ---------- Delete ----------
export async function deleteTag(
  token: string,
  id: number
): Promise<TagResponse> {
  const res = await fetch(`${API}/api/admin/tags/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi xóa tag")
  return res.json()
}

export interface ApiDataResponse<T> {
  success: boolean
  message?: string
  data: T
}

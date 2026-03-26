import { getAccessToken } from "@/lib/auth"

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL

async function aiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? "AI request failed")
  }
  return res.json()
}

async function aiGet<T>(endpoint: string): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? "AI request failed")
  }
  return res.json()
}

export type GenerateReportRequest = {
  reportType: "sales" | "sellers" | "products" | "customers" | "disputes"
  fromDate: string
  toDate: string
  additionalContext?: string
}

export type GenerateReportResponse = {
  reportType: string
  fromDate: string
  toDate: string
  statistics: unknown
  aiInsights: string
  keyFindings: string[]
  recommendations: string[]
  generatedAt: string
}

export type AnalyzeTrendsRequest = {
  metricTypes: string[]
  fromDate: string
  toDate: string
  granularity: "daily" | "weekly" | "monthly"
}

export type TrendDataPoint = {
  date: string
  values: Record<string, number>
}

export type AnalyzeTrendsResponse = {
  dataPoints: TrendDataPoint[]
  aiAnalysis: string
  growthRates: Record<string, number>
  trendInsights: string[]
}

export type DetectAnomaliesRequest = {
  dataType: "orders" | "revenue" | "users"
  lookbackDays: number
}

export type AnomalyItem = {
  detectedAt: string
  type: "spike" | "drop" | "pattern_break"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  expectedValue: number
  actualValue: number
  deviationPercent: number
}

export type DetectAnomaliesResponse = {
  anomalies: AnomalyItem[]
  aiExplanation: string
}

export type PredictMetricsRequest = {
  metric: "revenue" | "orders" | "users"
  forecastDays: number
}

export type PredictionPoint = {
  date: string
  predictedValue: number
  lowerBound: number
  upperBound: number
}

export type PredictMetricsResponse = {
  metric: string
  predictions: PredictionPoint[]
  aiAnalysis: string
  confidenceLevel: number
}

export type SummarizeDisputesRequest = {
  fromDate: string
  toDate: string
  maxItems?: number
}

export type SummarizeDisputesResponse = {
  totalDisputes: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  aiSummary: string
  commonIssues: string[]
  recommendations: string[]
}

export type DashboardInsightsResponse = {
  keyAlerts: string[]
  positiveHighlights: string[]
  actionItems: string[]
  aiSummary: string
  generatedAt: string
}

// ── API calls ──────────────────────────────────────────────────────────────

export const getDashboardInsights = () =>
  aiGet<DashboardInsightsResponse>("/api/ai/admin/insights/dashboard")

export const generateReport = (body: GenerateReportRequest) =>
  aiPost<GenerateReportResponse>("/api/ai/admin/generate-report", body)

export const analyzeTrends = (body: AnalyzeTrendsRequest) =>
  aiPost<AnalyzeTrendsResponse>("/api/ai/admin/analyze-trends", body)

export const detectAnomalies = (body: DetectAnomaliesRequest) =>
  aiPost<DetectAnomaliesResponse>("/api/ai/admin/detect-anomalies", body)

export const predictMetrics = (body: PredictMetricsRequest) =>
  aiPost<PredictMetricsResponse>("/api/ai/admin/predict-metrics", body)

export const summarizeDisputes = (body: SummarizeDisputesRequest) =>
  aiPost<SummarizeDisputesResponse>("/api/ai/admin/summarize-disputes", body)

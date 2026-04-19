import { getAccessToken } from "@/lib/auth"

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL

import type {
  GenerateReportRequest,
  GenerateReportResponse,
  AnalyzeTrendsRequest,
  AnalyzeTrendsResponse,
  DetectAnomaliesRequest,
  DetectAnomaliesResponse,
  PredictMetricsRequest,
  PredictMetricsResponse,
  SummarizeDisputesRequest,
  SummarizeDisputesResponse,
  DashboardInsightsResponse,
} from "@/types/ai-admin"

export type {
  GenerateReportRequest,
  GenerateReportResponse,
  AnalyzeTrendsRequest,
  TrendDataPoint,
  AnalyzeTrendsResponse,
  DetectAnomaliesRequest,
  AnomalyItem,
  DetectAnomaliesResponse,
  PredictMetricsRequest,
  PredictionPoint,
  PredictMetricsResponse,
  SummarizeDisputesRequest,
  SummarizeDisputesResponse,
  DashboardInsightsResponse,
} from "@/types/ai-admin"

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

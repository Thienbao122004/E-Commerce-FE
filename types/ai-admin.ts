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

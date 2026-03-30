"use client"

import {
  IconBrain,
  IconChartBar,
  IconChartLine,
  IconAlertTriangle,
  IconTrendingUp,
  IconGavel,
  IconSparkles,
  IconLayoutDashboard,
} from "@tabler/icons-react"

import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionCards } from "@/components/section-cards"
import { useDashboard } from "@/hooks/use-dashboard"

import { OverviewTab }  from "./components/overview-tab"
import { InsightsTab }  from "./components/insights-tab"
import { ReportTab }    from "./components/report-tab"
import { TrendsTab }    from "./components/trends-tab"
import { AnomaliesTab } from "./components/anomalies-tab"
import { PredictTab }   from "./components/predict-tab"
import { DisputesTab }  from "./components/disputes-tab"

export default function DashboardPage() {
  const { stats, statsLoading } = useDashboard()

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-6 py-4 md:py-6">
        <SectionCards stats={stats ?? undefined} loading={statsLoading} />

        <div className="px-4 lg:px-6">
          <Tabs defaultValue="overview">
            <TabsList className="h-auto w-full gap-1 bg-muted/60">
              <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-background">
                <IconLayoutDashboard className="size-3.5" />Tổng quan
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5 data-[state=active]:bg-background">
                <IconSparkles className="size-3.5 text-purple-500" />AI Insights
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-1.5 data-[state=active]:bg-background">
                <IconChartBar className="size-3.5" />Báo cáo
              </TabsTrigger>
              <TabsTrigger value="trends" className="gap-1.5 data-[state=active]:bg-background">
                <IconChartLine className="size-3.5" />Xu hướng
              </TabsTrigger>
              <TabsTrigger value="anomalies" className="gap-1.5 data-[state=active]:bg-background">
                <IconAlertTriangle className="size-3.5" />Bất thường
              </TabsTrigger>
              <TabsTrigger value="predict" className="gap-1.5 data-[state=active]:bg-background">
                <IconTrendingUp className="size-3.5" />Dự báo
              </TabsTrigger>
              <TabsTrigger value="disputes" className="gap-1.5 data-[state=active]:bg-background">
                <IconGavel className="size-3.5" />Tranh chấp AI
              </TabsTrigger>
            </TabsList>

            <Separator className="my-4" />

            <TabsContent value="overview">  <OverviewTab  /></TabsContent>
            <TabsContent value="insights">  <InsightsTab  /></TabsContent>
            <TabsContent value="report">    <ReportTab    /></TabsContent>
            <TabsContent value="trends">    <TrendsTab    /></TabsContent>
            <TabsContent value="anomalies"> <AnomaliesTab /></TabsContent>
            <TabsContent value="predict">   <PredictTab   /></TabsContent>
            <TabsContent value="disputes">  <DisputesTab  /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

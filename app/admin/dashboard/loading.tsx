import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <Skeleton className="h-10 flex-1 min-w-[200px] max-w-sm" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-[140px]" />
                        <Skeleton className="h-10 w-[160px]" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <div className="flex flex-col">
                        <div className="border-b bg-muted p-3">
                            <div className="flex gap-4 items-center">
                                <Skeleton className="h-5 w-12" />
                                <Skeleton className="h-5 flex-1" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                        </div>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex border-b p-3 gap-4 items-center last:border-0">
                                <Skeleton className="h-6 w-12" />
                                <Skeleton className="h-10 w-10 rounded" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-[60%]" />
                                    <Skeleton className="h-3 w-[40%]" />
                                </div>
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

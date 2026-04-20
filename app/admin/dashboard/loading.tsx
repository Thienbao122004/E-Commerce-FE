import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-col gap-4 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <Skeleton className="mb-2 h-8 w-48 max-w-full" />
                        <Skeleton className="h-4 w-32 max-w-full" />
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <Skeleton className="h-10 min-w-0 flex-1 sm:min-w-[200px] sm:max-w-sm" />
                    <div className="flex w-full min-w-0 gap-2 sm:w-auto">
                        <Skeleton className="h-10 min-w-0 flex-1 sm:w-[140px] sm:flex-none" />
                        <Skeleton className="h-10 min-w-0 flex-1 sm:w-[160px] sm:flex-none" />
                    </div>
                </div>

                <div className="rounded-lg border bg-background shadow-sm">
                    <div className="relative w-full overflow-x-auto">
                        <table className="w-full min-w-[560px] caption-bottom text-sm">
                            <thead className="border-b bg-muted [&_tr]:border-b">
                                <tr>
                                    <th className="h-10 px-2 text-left align-middle font-medium">
                                        <Skeleton className="h-5 w-8" />
                                    </th>
                                    <th className="h-10 px-2 text-left align-middle font-medium">
                                        <Skeleton className="h-5 w-32" />
                                    </th>
                                    <th className="hidden h-10 px-2 text-left align-middle font-medium md:table-cell">
                                        <Skeleton className="h-5 w-20" />
                                    </th>
                                    <th className="h-10 px-2 text-right align-middle font-medium">
                                        <Skeleton className="ml-auto h-5 w-14" />
                                    </th>
                                    <th className="h-10 px-2 text-right align-middle font-medium">
                                        <Skeleton className="ml-auto h-5 w-16" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-2 align-middle">
                                            <Skeleton className="h-5 w-8" />
                                        </td>
                                        <td className="p-2 align-middle">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full max-w-[220px]" />
                                                <Skeleton className="h-3 w-full max-w-[140px] sm:hidden" />
                                            </div>
                                        </td>
                                        <td className="hidden p-2 align-middle md:table-cell">
                                            <Skeleton className="h-8 w-20 rounded-md" />
                                        </td>
                                        <td className="p-2 text-right align-middle">
                                            <Skeleton className="ml-auto h-4 w-12" />
                                        </td>
                                        <td className="p-2 text-right align-middle">
                                            <Skeleton className="ml-auto h-8 w-16" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

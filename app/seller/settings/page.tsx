"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const themeOptions = [
        {
            value: "light",
            label: "Sáng",
            icon: IconSun,
            description: "Giao diện sáng, phù hợp ban ngày",
        },
        {
            value: "dark",
            label: "Tối",
            icon: IconMoon,
            description: "Giao diện tối, dễ chịu cho mắt",
        },
        {
            value: "system",
            label: "Hệ thống",
            icon: IconDeviceDesktop,
            description: "Tự động theo cài đặt hệ thống",
        },
    ]

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="flex flex-col gap-6 p-6 md:p-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
                        <p className="text-muted-foreground mt-1">
                            Quản lý cài đặt và tùy chọn của bạn.
                        </p>
                    </div>

                    <div className="border rounded-xl p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold">Giao diện</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Tùy chỉnh giao diện hiển thị của ứng dụng.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {themeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setTheme(option.value)}
                                    className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-md cursor-pointer ${theme === option.value
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border hover:border-primary/40"
                                        }`}
                                >
                                    <div
                                        className={`flex size-12 items-center justify-center rounded-full transition-colors ${theme === option.value
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        <option.icon className="size-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium">{option.label}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {option.description}
                                        </p>
                                    </div>
                                    {theme === option.value && (
                                        <div className="absolute top-3 right-3 size-2.5 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

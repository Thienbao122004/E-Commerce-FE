"use client"

import * as React from "react"

type HeaderActionsContextType = {
    actions: React.ReactNode
    setActions: (actions: React.ReactNode) => void
}

const HeaderActionsContext = React.createContext<HeaderActionsContextType>({
    actions: null,
    setActions: () => { },
})

export function HeaderActionsProvider({ children }: { children: React.ReactNode }) {
    const [actions, setActions] = React.useState<React.ReactNode>(null)
    return (
        <HeaderActionsContext.Provider value={{ actions, setActions }}>
            {children}
        </HeaderActionsContext.Provider>
    )
}

export function useHeaderActions() {
    return React.useContext(HeaderActionsContext)
}

/**
 * Component con dùng trong page để đăng ký action buttons lên header.
 * Tự cleanup khi page unmount.
 */
export function SetHeaderActions({ children }: { children: React.ReactNode }) {
    const { setActions } = useHeaderActions()

    React.useEffect(() => {
        setActions(children)
        return () => setActions(null)
    }, [children, setActions])

    return null
}

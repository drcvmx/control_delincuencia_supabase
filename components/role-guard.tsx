"use client"

import type React from "react"

import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: ("ADMIN" | "VIEWER")[]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const [user, setUser] = useState(getCurrentUser())

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Search, Users, UserCheck, Menu, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/role-guard"
import { getCurrentUser } from "@/lib/auth"
import { useState, useEffect } from "react"

export function MainNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(getCurrentUser())

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const publicRoutes = [
    {
      href: "/",
      label: "Inicio",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/busqueda",
      label: "Búsqueda",
      icon: Search,
      active: pathname === "/busqueda",
    },
     
  ]

  const adminOnlyRoutes = [
    {
      href: "/personas/nuevo",
      label: "Nueva Persona",
      icon: Plus,
      active: pathname === "/personas/nuevo",
    },
    {
      href: "/delincuentes/nuevo",
      label: "Nuevo Delincuente",
      icon: Plus,
      active: pathname === "/delincuentes/nuevo",
    },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
        {publicRoutes.map((route) => {
          const Icon = route.icon
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {route.label}
            </Link>
          )
        })}

        {/* Admin Only Routes - Desktop */}
        <RoleGuard allowedRoles={["ADMIN"]}>
          <div className="flex items-center space-x-4 lg:space-x-6 border-l pl-4 ml-4">
            {adminOnlyRoutes.map((route) => {
              const Icon = route.icon
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-primary",
                    route.active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Link>
              )
            })}
          </div>
        </RoleGuard>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-muted-foreground">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {isOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b z-50 shadow-lg">
            <div className="flex flex-col p-4 space-y-2">
              {/* Public Routes - Mobile */}
              {publicRoutes.map((route) => {
                const Icon = route.icon
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center text-sm font-medium transition-colors hover:text-primary p-3 rounded-md",
                      route.active ? "text-primary bg-muted" : "text-muted-foreground hover:bg-muted/50",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {route.label}
                  </Link>
                )
              })}

              {/* Admin Only Routes - Mobile */}
              <RoleGuard allowedRoles={["ADMIN"]}>
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-3">ADMINISTRACIÓN</div>
                  {adminOnlyRoutes.map((route) => {
                    const Icon = route.icon
                    return (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                          "flex items-center text-sm font-medium transition-colors hover:text-primary p-3 rounded-md",
                          route.active ? "text-primary bg-muted" : "text-muted-foreground hover:bg-muted/50",
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {route.label}
                      </Link>
                    )
                  })}
                </div>
              </RoleGuard>

              {/* User Info - Mobile */}
              {user && (
                <div className="border-t pt-2 mt-2">
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Conectado como: <span className="font-medium text-foreground">{user.name}</span>
                  </div>
                  <div className="px-3 py-1 text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        user.role === "ADMIN"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                      )}
                    >
                      {user.role === "ADMIN" ? "Administrador" : "Visualizador"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}


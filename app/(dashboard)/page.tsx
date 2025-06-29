import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/role-guard"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Users, UserCheck, Search, Plus, Eye } from "lucide-react"
import Link from "next/link"

export const revalidate = 0

// Modificar la función getStats para eliminar estatusCount y crimenesCount
async function getStats() {
  const supabase = createServerSupabaseClient()

  const [{ count: personasCount }, { count: delincuentesCount }] = await Promise.all([
    supabase.from("persona").select("*", { count: "exact", head: true }),
    supabase.from("delincuente").select("*", { count: "exact", head: true }),
  ])

  return {
    personasCount: personasCount || 0,
    delincuentesCount: delincuentesCount || 0,
  }
}

export default async function Home() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground">Bienvenido al Sistema de Control de Delincuencia</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/personas">
          <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Personas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.personasCount}</div>
              <p className="text-xs text-muted-foreground">Personas registradas en el sistema</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/delincuentes">
          <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delincuentes</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delincuentesCount}</div>
              <p className="text-xs text-muted-foreground">Delincuentes registrados</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Gestión de Personas
            </CardTitle>
            <CardDescription>Administra el registro de personas en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow">
            <div className="flex-grow space-y-4">
              <p className="text-sm">Desde aquí puedes:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Ver listado completo de personas</li>
                <li>Buscar por múltiples criterios</li>
                <li>Filtrar por tipo (civil/delincuente)</li>
                <RoleGuard allowedRoles={["ADMIN"]}>
                  <li>Registrar nuevas personas</li>
                  <li>Editar información personal</li>
                  <li>Asociar personas como delincuentes</li>
                </RoleGuard>
              </ul>
            </div>
            <div className="pt-4 space-y-2 flex-shrink-0">
              <Link href="/personas" className="block">
                <Button variant="outline" size="default" className="w-full h-10 bg-transparent">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Personas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Búsqueda Avanzada
            </CardTitle>
            <CardDescription>Busca personas por múltiples criterios</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow">
            <div className="flex-grow space-y-4">
              <p className="text-sm">Realiza búsquedas por:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Nombre completo</li>
                <li>Apellidos</li>
                <li>Fecha de nacimiento</li>
                <li>ID específico</li>
                <li>Fecha de fin</li>
              </ul>
            </div>
            <div className="pt-4 flex-shrink-0">
              <Link href="/busqueda" className="block">
                <Button variant="outline" size="default" className="w-full h-10 bg-transparent">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Personas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5" />
              Control de Delincuentes
            </CardTitle>
            <CardDescription>Gestiona el registro de delincuentes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow">
            <div className="flex-grow space-y-4">
              <p className="text-sm">Funcionalidades disponibles:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Ver listado de delincuentes</li>
                <li>Consultar estatus penitenciario</li>
                <li>Revisar antecedentes</li>
                <RoleGuard allowedRoles={["ADMIN"]}>
                  <li>Registrar nuevos delincuentes</li>
                  <li>Actualizar información</li>
                </RoleGuard>
              </ul>
            </div>
            <div className="pt-4 space-y-2 flex-shrink-0">
              <Link href="/delincuentes" className="block">
                <Button variant="outline" size="default" className="w-full h-10 bg-transparent">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Delincuentes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




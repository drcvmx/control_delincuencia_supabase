import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Users, UserCheck } from "lucide-react"
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

// Modificar el JSX para eliminar las tarjetas de estatus penitenciario y crímenes
export default async function Home() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground">Bienvenido al Sistema de Control de Delincuencia</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/personas">
          <Card className="hover:bg-muted/50 transition-colors">
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
          <Card className="hover:bg-muted/50 transition-colors">
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Personas</CardTitle>
            <CardDescription>Administra el registro de personas en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Desde aquí puedes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Registrar nuevas personas</li>
              <li>Editar información personal</li>
              <li>Ver detalles completos</li>
              <li>Asociar personas como delincuentes</li>
            </ul>
            <div className="pt-2">
              <Link href="/personas" className="text-primary hover:underline">
                Ir a gestión de personas →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Búsqueda Avanzada</CardTitle>
            <CardDescription>Busca personas por múltiples criterios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Realiza búsquedas por:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre</li>
              <li>Apellidos</li>
              <li>Fecha de nacimiento</li>
              <li>Y otros criterios</li>
            </ul>
            <div className="pt-2">
              <Link href="/busqueda" className="text-primary hover:underline">
                Ir a búsqueda avanzada →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

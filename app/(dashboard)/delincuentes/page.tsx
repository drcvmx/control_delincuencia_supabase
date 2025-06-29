import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/role-guard"
import { createServerSupabaseClient } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus } from "lucide-react"
import Link from "next/link"

export const revalidate = 0

interface Delincuente {
  id_persona: number
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  alias: string | null
  fecha_detencion: string | null
  id_carcel: number | null
  id_celda: string | null
  fecha_ingreso: string | null
}

async function getDelincuentes() {
  const supabase = createServerSupabaseClient()

  // Primero obtenemos los delincuentes con sus datos básicos
  const { data: delincuentesData, error: delincuentesError } = await supabase
    .from("delincuente")
    .select("*")
    .order("id_persona", { ascending: true })

  if (delincuentesError) {
    console.error("Error fetching delincuentes:", delincuentesError)
    return []
  }

  if (!delincuentesData || delincuentesData.length === 0) {
    return []
  }

  // Obtenemos los IDs de los delincuentes
  const delincuentesIds = delincuentesData.map((d) => d.id_persona)

  // Obtenemos los datos de las personas correspondientes
  const { data: personasData, error: personasError } = await supabase
    .from("persona")
    .select("*")
    .in("id", delincuentesIds)

  if (personasError) {
    console.error("Error fetching personas:", personasError)
    return []
  }

  // Obtenemos los datos de estatus penitenciario
  const { data: estatusData, error: estatusError } = await supabase
    .from("estatus_penitenciario")
    .select("*")
    .in("id_delincuente", delincuentesIds)

  if (estatusError) {
    console.error("Error fetching estatus penitenciario:", estatusError)
    return []
  }

  // Creamos un mapa para acceder fácilmente a los datos de persona y estatus
  const personasMap = new Map(personasData.map((p) => [p.id, p]))
  const estatusMap = new Map(estatusData.map((e) => [e.id_delincuente, e]))

  // Combinamos los datos
  const delincuentes = delincuentesData
    .map((delincuente) => {
      const persona = personasMap.get(delincuente.id_persona)
      const estatus = estatusMap.get(delincuente.id_persona)

      if (!persona) {
        return null // Esto no debería ocurrir si las relaciones son correctas
      }

      return {
        id_persona: delincuente.id_persona,
        nombre: persona.nombre,
        apellido_paterno: persona.apellido_paterno,
        apellido_materno: persona.apellido_materno,
        alias: delincuente.alias,
        fecha_detencion: delincuente.fecha_detencion,
        id_carcel: estatus?.id_carcel || null,
        id_celda: estatus?.id_celda || null,
        fecha_ingreso: estatus?.fecha_ingreso || null,
      }
    })
    .filter(Boolean) as Delincuente[]

  return delincuentes
}

export default async function DelincuentesPage() {
  const delincuentes = await getDelincuentes()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delincuentes</h1>
          <p className="text-muted-foreground">Listado de delincuentes registrados en el sistema</p>
        </div>
        <RoleGuard allowedRoles={["ADMIN"]}>
          <Link href="/delincuentes/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Delincuente
            </Button>
          </Link>
        </RoleGuard>
      </div>

      <div className="border rounded-md">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Nombre</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Alias</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Fecha Detención</th>
                <th className="h-12 px-4 text-left align-middle font-medium">ID Cárcel</th>
                <th className="h-12 px-4 text-left align-middle font-medium">ID Celda</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Fecha Ingreso</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {delincuentes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-muted-foreground">
                    No hay delincuentes registrados
                  </td>
                </tr>
              ) : (
                delincuentes.map((delincuente) => (
                  <tr
                    key={delincuente.id_persona}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">{delincuente.id_persona}</td>
                    <td className="p-4 align-middle">
                      {delincuente.nombre} {delincuente.apellido_paterno} {delincuente.apellido_materno}
                    </td>
                    <td className="p-4 align-middle">{delincuente.alias || "N/A"}</td>
                    <td className="p-4 align-middle">
                      {delincuente.fecha_detencion
                        ? format(new Date(delincuente.fecha_detencion), "dd/MM/yyyy", { locale: es })
                        : "N/A"}
                    </td>
                    <td className="p-4 align-middle">{delincuente.id_carcel || "N/A"}</td>
                    <td className="p-4 align-middle">{delincuente.id_celda || "N/A"}</td>
                    <td className="p-4 align-middle">
                      {delincuente.fecha_ingreso
                        ? format(new Date(delincuente.fecha_ingreso), "dd/MM/yyyy", { locale: es })
                        : "N/A"}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Link href={`/personas/${delincuente.id_persona}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}



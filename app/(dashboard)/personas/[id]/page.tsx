import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import type { PersonaCompleta } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Edit, UserCheck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const revalidate = 0

async function getPersona(id: string) {
  const supabase = createServerSupabaseClient()

  // Obtener persona
  const { data: persona, error } = await supabase.from("persona").select("*").eq("id", id).single()

  if (error || !persona) {
    return null
  }

  // Obtener delincuente si existe
  const { data: delincuente } = await supabase.from("delincuente").select("*").eq("id_persona", id).single()

  // Obtener estatus penitenciario si existe
  const { data: estatus } = await supabase.from("estatus_penitenciario").select("*").eq("id_delincuente", id).single()

  // Obtener crímenes asociados si es delincuente
  let crimenes = []
  if (delincuente) {
    const { data: delincuenteCrimen } = await supabase
      .from("delincuente_crimen")
      .select("id_crimen")
      .eq("id_delincuente", id)

    if (delincuenteCrimen && delincuenteCrimen.length > 0) {
      const crimenesIds = delincuenteCrimen.map((dc) => dc.id_crimen)

      const { data: crimenesData } = await supabase.from("crimen").select("*").in("id", crimenesIds)

      crimenes = crimenesData || []
    }
  }

  return {
    ...persona,
    delincuente,
    estatus_penitenciario: estatus,
    crimenes,
  } as PersonaCompleta
}

export default async function PersonaPage({ params }: { params: { id: string } }) {
  const persona = await getPersona(params.id)

  if (!persona) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/personas" className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {persona.nombre} {persona.apellido_paterno} {persona.apellido_materno}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/personas/${persona.id}/editar`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>

          {!persona.delincuente && (
            <Link href={`/delincuentes/nuevo?personaId=${persona.id}`}>
              <Button>
                <UserCheck className="mr-2 h-4 w-4" />
                Registrar como Delincuente
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Datos personales registrados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p>{persona.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                <p>
                  {persona.nombre} {persona.apellido_paterno} {persona.apellido_materno}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                <p>
                  {persona.fecha_de_nacimiento
                    ? format(new Date(persona.fecha_de_nacimiento), "dd MMMM yyyy", { locale: es })
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Fin</p>
                <p>
                  {persona.fecha_de_fin
                    ? format(new Date(persona.fecha_de_fin), "dd MMMM yyyy", { locale: es })
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {persona.delincuente && (
          <Card>
            <CardHeader>
              <CardTitle>Información de Delincuente</CardTitle>
              <CardDescription>Datos del registro como delincuente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Alta</p>
                  <p>
                    {persona.delincuente.fecha_alta_delincuente
                      ? format(new Date(persona.delincuente.fecha_alta_delincuente), "dd MMMM yyyy", { locale: es })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alias</p>
                  <p>{persona.delincuente.alias || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Detención</p>
                  <p>
                    {persona.delincuente.fecha_detencion
                      ? format(new Date(persona.delincuente.fecha_detencion), "dd MMMM yyyy", { locale: es })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lugar de Detención</p>
                  <p>{persona.delincuente.lugar_detencion || "N/A"}</p>
                </div>
              </div>

              {persona.delincuente.antecedentes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Antecedentes</p>
                  <p className="whitespace-pre-line">{persona.delincuente.antecedentes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {persona.estatus_penitenciario && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Estatus Penitenciario</CardTitle>
              <CardDescription>Información sobre el estado penitenciario actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID Cárcel</p>
                  <p>{persona.estatus_penitenciario.id_carcel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID Celda</p>
                  <p>{persona.estatus_penitenciario.id_celda}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Ingreso</p>
                  <p>
                    {persona.estatus_penitenciario.fecha_ingreso
                      ? format(new Date(persona.estatus_penitenciario.fecha_ingreso), "dd MMMM yyyy", { locale: es })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Salida Prevista</p>
                  <p>
                    {persona.estatus_penitenciario.fecha_salida_prevista
                      ? format(new Date(persona.estatus_penitenciario.fecha_salida_prevista), "dd MMMM yyyy", {
                          locale: es,
                        })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Salida Real</p>
                  <p>
                    {persona.estatus_penitenciario.fecha_salida_real
                      ? format(new Date(persona.estatus_penitenciario.fecha_salida_real), "dd MMMM yyyy", {
                          locale: es,
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Motivo de Encarcelamiento</p>
                <p>{persona.estatus_penitenciario.motivo_encarcelamiento}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {persona.crimenes && persona.crimenes.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Crímenes Asociados</CardTitle>
              <CardDescription>Listado de crímenes en los que ha participado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Descripción</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Fecha</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {persona.crimenes.map((crimen) => (
                        <tr
                          key={crimen.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-4 align-middle">{crimen.id}</td>
                          <td className="p-4 align-middle">{crimen.descripcion}</td>
                          <td className="p-4 align-middle">
                            {crimen.fecha_ocurrencia
                              ? format(new Date(crimen.fecha_ocurrencia), "dd/MM/yyyy", { locale: es })
                              : "N/A"}
                          </td>
                          <td className="p-4 align-middle">{crimen.ubicacion || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

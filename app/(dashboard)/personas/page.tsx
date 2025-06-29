"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RoleGuard } from "@/components/role-guard"
import { supabase } from "@/lib/supabase"
import type { Persona } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [delincuentesIds, setDelincuentesIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [orderBy, setOrderBy] = useState<"id" | "fecha_salida">("id")
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc")
  const [filterDelincuente, setFilterDelincuente] = useState<"todos" | "delincuentes" | "civil">("todos")

  // Primero, cargar todos los IDs de delincuentes una sola vez
  useEffect(() => {
    async function loadDelincuentesIds() {
      try {
        const { data } = await supabase.from("delincuente").select("id_persona")
        setDelincuentesIds(data?.map((d) => d.id_persona) || [])
      } catch (error) {
        console.error("Error loading delincuentes IDs:", error)
      }
    }

    loadDelincuentesIds()
  }, [])

  // Luego, cargar y filtrar personas según el filtro seleccionado
  useEffect(() => {
    async function fetchPersonas() {
      setLoading(true)
      try {
        // Obtener todas las personas
        const { data: allPersonas, error } = await supabase.from("persona").select("*")

        if (error) {
          throw error
        }

        // Filtrar según la selección
        let filteredPersonas: Persona[] = []

        if (filterDelincuente === "todos") {
          filteredPersonas = allPersonas || []
        } else if (filterDelincuente === "delincuentes") {
          // Filtrar solo delincuentes
          filteredPersonas = (allPersonas || []).filter((persona) => delincuentesIds.includes(persona.id))
        } else if (filterDelincuente === "civil") {
          // Filtrar solo civiles (personas que NO son delincuentes)
          filteredPersonas = (allPersonas || []).filter((persona) => !delincuentesIds.includes(persona.id))
        }

        // Aplicar ordenamiento
        if (orderBy === "id") {
          filteredPersonas.sort((a, b) => {
            return orderDirection === "asc" ? a.id - b.id : b.id - a.id
          })
        } else if (orderBy === "fecha_salida") {
          // Obtener datos de estatus penitenciario para ordenar por fecha de salida
          const { data: estatusData } = await supabase
            .from("estatus_penitenciario")
            .select("id_delincuente, fecha_salida_prevista")

          // Crear un mapa de ID de delincuente a fecha de salida
          const fechaSalidaMap = new Map()
          estatusData?.forEach((estatus) => {
            fechaSalidaMap.set(estatus.id_delincuente, estatus.fecha_salida_prevista)
          })

          // Ordenar personas por fecha de salida
          filteredPersonas.sort((a, b) => {
            const fechaA = fechaSalidaMap.get(a.id)
            const fechaB = fechaSalidaMap.get(b.id)

            // Si no tienen fecha de salida, ponerlos al final
            if (!fechaA && !fechaB) return 0
            if (!fechaA) return orderDirection === "asc" ? 1 : -1
            if (!fechaB) return orderDirection === "asc" ? -1 : 1

            // Comparar fechas
            return orderDirection === "asc"
              ? new Date(fechaA).getTime() - new Date(fechaB).getTime()
              : new Date(fechaB).getTime() - new Date(fechaA).getTime()
          })
        }

        setPersonas(filteredPersonas)
      } catch (error) {
        console.error("Error fetching personas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPersonas()
  }, [orderBy, orderDirection, filterDelincuente, delincuentesIds])

  const toggleOrderDirection = () => {
    setOrderDirection(orderDirection === "asc" ? "desc" : "asc")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personas</h1>
          <p className="text-muted-foreground">Gestiona el registro de personas en el sistema</p>
        </div>
        <RoleGuard allowedRoles={["ADMIN"]}>
          <Link href="/personas/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Persona
            </Button>
          </Link>
        </RoleGuard>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros y Ordenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <Select value={orderBy} onValueChange={(value) => setOrderBy(value as "id" | "fecha_salida")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="fecha_salida">Fecha de Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filtrar por</label>
              <Select
                value={filterDelincuente}
                onValueChange={(value) => setFilterDelincuente(value as "todos" | "delincuentes" | "civil")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="delincuentes">Solo Delincuentes</SelectItem>
                  <SelectItem value="civil">Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Dirección</label>
              <Button variant="outline" onClick={toggleOrderDirection} className="w-full bg-transparent">
                {orderDirection === "asc" ? "Ascendente" : "Descendente"}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-md">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Nombre</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Apellido Paterno</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Apellido Materno</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Fecha de Nacimiento</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Tipo</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : personas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    No hay personas registradas
                  </td>
                </tr>
              ) : (
                personas.map((persona) => (
                  <tr
                    key={persona.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">{persona.id}</td>
                    <td className="p-4 align-middle">{persona.nombre}</td>
                    <td className="p-4 align-middle">{persona.apellido_paterno}</td>
                    <td className="p-4 align-middle">{persona.apellido_materno}</td>
                    <td className="p-4 align-middle">
                      {persona.fecha_de_nacimiento
                        ? format(new Date(persona.fecha_de_nacimiento), "dd/MM/yyyy", { locale: es })
                        : "N/A"}
                    </td>
                    <td className="p-4 align-middle">
                      <span
                        className={
                          delincuentesIds.includes(persona.id)
                            ? "text-red-500 font-medium"
                            : "text-green-500 font-medium"
                        }
                      >
                        {delincuentesIds.includes(persona.id) ? "Delincuente" : "Civil"}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Link href={`/personas/${persona.id}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                        <RoleGuard allowedRoles={["ADMIN"]}>
                          <Link href={`/personas/${persona.id}/editar`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                        </RoleGuard>
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


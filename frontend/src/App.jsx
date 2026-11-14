/**
 * ==============================================================================
 * SENATI - DIRECCION ZONAL LIMA - CALLAO
 * ESCUELA DE TECNOLOGIAS DE LA INFORMACION (ETI)
 * CARRERA: DESARROLLO DE SOFTWARE
 * SEMESTRE V - 2026
 *
 * PROYECTO: LabDesk - Sistema de Gestión de Incidencias de Laboratorio
 * TECNOLOGÍAS: React 19 + Vite + Django REST Framework + SQLite
 * ==============================================================================
 */

import { useEffect, useState, useMemo } from 'react'
import './App.css'

// URL base de la API REST local expuesta por Django REST Framework
const API = 'http://127.0.0.1:8000/api/incidencias/'

// Estado inicial del formulario vacío
const FORM_INICIAL = {
  titulo: '',
  descripcion: '',
  categoria: 'hardware',
  prioridad: 'media',
  estado: 'pendiente',
  aula: 'Lab 302' // Reto adicional: campo aula del SENATI
}

export default function App() {
  // -------------------------------------------------------------
  // ESTADOS DEL COMPONENTE (React Hooks)
  // -------------------------------------------------------------
  const [datos, setDatos] = useState([])
  const [form, setForm] = useState(FORM_INICIAL)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [orden, setOrden] = useState('recientes') // 'recientes' | 'antiguos' | 'prioridad'
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [notificacion, setNotificacion] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)

  // Mostrar mensaje emergente estilo Apple toast
  function mostrarToast(mensaje, tipo = 'exito') {
    setNotificacion({ mensaje, tipo })
    setTimeout(() => {
      setNotificacion(null)
    }, 3200)
  }

  // -------------------------------------------------------------
  // CONSUMO DE API: GET /api/incidencias/
  // -------------------------------------------------------------
  async function cargar() {
    setCargando(true)
    try {
      const res = await fetch(API)
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status} al consultar la API de Django`)
      }
      const data = await res.json()
      setDatos(data)
      setError('')
    } catch (err) {
      console.error('Error al conectar con el backend:', err)
      setError('No se pudo conectar con Django en http://127.0.0.1:8000. Verifica que el servidor esté encendido.')
    } finally {
      setCargando(false)
    }
  }

  // useEffect: Carga inicial de datos al montar el componente
  useEffect(() => {
    cargar()
  }, [])

  // -------------------------------------------------------------
  // CONTROLADOR DEL FORMULARIO
  // -------------------------------------------------------------
  function manejarCambio(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // -------------------------------------------------------------
  // CONSUMO DE API: POST (Crear) o PUT (Editar)
  // -------------------------------------------------------------
  async function guardar(e) {
    e.preventDefault()

    // Validación básica en frontend
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setError('Por favor completa el título y la descripción.')
      return
    }

    try {
      const url = editando === null ? API : `${API}${editando}/`
      const metodo = editando === null ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Revisa los datos ingresados en el formulario')
      }

      const accionTexto = editando === null ? 'registrada' : 'actualizada'
      mostrarToast(`Incidencia ${accionTexto} correctamente`, 'exito')

      cancelarEdicion()
      setMostrarModal(false)
      await cargar()
    } catch (err) {
      setError(err.message)
      mostrarToast(err.message, 'error')
    }
  }

  // -------------------------------------------------------------
  // PREPARAR EDICIÓN
  // -------------------------------------------------------------
  function iniciarEdicion(item) {
    setEditando(item.id)
    setForm({
      titulo: item.titulo,
      descripcion: item.descripcion,
      categoria: item.categoria,
      prioridad: item.prioridad,
      estado: item.estado,
      aula: item.aula || 'Lab 302'
    })
    setMostrarModal(true)
    setError('')
  }

  function cancelarEdicion() {
    setEditando(null)
    setForm(FORM_INICIAL)
    setError('')
  }

  function abrirNuevaIncidencia() {
    cancelarEdicion()
    setMostrarModal(true)
  }

  // -------------------------------------------------------------
  // CONSUMO DE API: PATCH /api/incidencias/{id}/ (Cambio rápido de estado)
  // -------------------------------------------------------------
  async function actualizarEstado(id, nuevoEstado) {
    try {
      const res = await fetch(`${API}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (!res.ok) {
        throw new Error('Error al actualizar el estado de la incidencia')
      }

      mostrarToast(`Estado cambiado a: ${nuevoEstado.replace('_', ' ')}`, 'info')
      await cargar()
    } catch (err) {
      setError(err.message)
      mostrarToast(err.message, 'error')
    }
  }

  // -------------------------------------------------------------
  // CONSUMO DE API: DELETE /api/incidencias/{id}/
  // -------------------------------------------------------------
  async function eliminar(id, titulo) {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar la incidencia:\n"${titulo}"?\n\nEsta acción no se puede deshacer en SQLite.`
    )
    if (!confirmacion) return

    try {
      const res = await fetch(`${API}${id}/`, {
        method: 'DELETE'
      })

      if (!res.ok && res.status !== 204) {
        throw new Error('No se pudo eliminar la incidencia de la base de datos')
      }

      mostrarToast('Incidencia eliminada con éxito', 'aviso')
      await cargar()
    } catch (err) {
      setError(err.message)
      mostrarToast(err.message, 'error')
    }
  }

  // -------------------------------------------------------------
  // RETO ADICIONAL: EXPORTAR A CSV OPTIMIZADO PARA EXCEL (Página 12)
  // -------------------------------------------------------------
  function exportarCSV() {
    const listaAExportar = incidenciasFiltradas.length > 0 ? incidenciasFiltradas : datos

    if (listaAExportar.length === 0) {
      mostrarToast('No hay incidencias para exportar', 'aviso')
      return
    }

    // Mapeo amigable para legibilidad en reportes de oficina
    const mapCategoria = {
      hardware: 'Hardware',
      software: 'Software',
      red: 'Red / Internet'
    }

    const mapPrioridad = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta'
    }

    const mapEstado = {
      pendiente: 'Pendiente',
      en_proceso: 'En proceso',
      resuelto: 'Resuelto'
    }

    // Formatear fecha y hora en formato latinoamericano DD/MM/AAAA HH:mm:ss
    function formatearFechaCSV(isoString) {
      if (!isoString) return ''
      try {
        const f = new Date(isoString)
        const dia = String(f.getDate()).padStart(2, '0')
        const mes = String(f.getMonth() + 1).padStart(2, '0')
        const anio = f.getFullYear()
        const horas = String(f.getHours()).padStart(2, '0')
        const mins = String(f.getMinutes()).padStart(2, '0')
        const segs = String(f.getSeconds()).padStart(2, '0')
        return `${dia}/${mes}/${anio} ${horas}:${mins}:${segs}`
      } catch {
        return isoString
      }
    }

    // Escapar texto para CSV: comillas dobles y limpiar saltos de línea para que no rompa filas en Excel
    function escaparCampo(valor) {
      if (valor === null || valor === undefined) return '""'
      const textoLimpio = String(valor)
        .replace(/"/g, '""')
        .replace(/\r?\n/g, ' ')
        .trim()
      return `"${textoLimpio}"`
    }

    // Cabeceras profesionales con acentos correctos
    const cabeceras = [
      'N° ID',
      'TÍTULO DE LA INCIDENCIA',
      'DESCRIPCIÓN TÉCNICA',
      'CATEGORÍA',
      'PRIORIDAD',
      'ESTADO ACTUAL',
      'AULA / LABORATORIO',
      'FECHA Y HORA DE REPORTE'
    ]

    // Usar punto y coma ';' como delimitador estándar para Excel en español / Windows latinoamericano
    const delimitador = ';'

    const filas = listaAExportar.map(item => [
      item.id,
      escaparCampo(item.titulo),
      escaparCampo(item.descripcion),
      escaparCampo(mapCategoria[item.categoria] || item.categoria),
      escaparCampo(mapPrioridad[item.prioridad] || item.prioridad),
      escaparCampo(mapEstado[item.estado] || item.estado),
      escaparCampo(item.aula || 'Lab 302'),
      escaparCampo(formatearFechaCSV(item.creado_en))
    ])

    const contenidoFilas = [
      cabeceras.map(escaparCampo).join(delimitador),
      ...filas.map(fila => fila.join(delimitador))
    ].join('\r\n')

    // Byte Order Mark (BOM) UTF-8 (\uFEFF) para forzar a Excel a decodificar tildes y caracteres especiales
    const blob = new Blob(['\uFEFF' + contenidoFilas], {
      type: 'text/csv;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const fechaDescarga = new Date().toISOString().slice(0, 10)
    link.setAttribute('download', `LabDesk_SENATI_Incidencias_${fechaDescarga}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    mostrarToast(`Exportadas ${listaAExportar.length} incidencias a CSV para Excel`, 'exito')
  }

  // -------------------------------------------------------------
  // CÁLCULO DE CONTADORES / ESTADÍSTICAS (KPIs)
  // -------------------------------------------------------------
  const total = datos.length
  const pendientes = datos.filter(x => x.estado === 'pendiente').length
  const enProceso = datos.filter(x => x.estado === 'en_proceso').length
  const resueltos = datos.filter(x => x.estado === 'resuelto').length
  const prioridadAlta = datos.filter(x => x.prioridad === 'alta').length // Reto adicional

  // -------------------------------------------------------------
  // FILTRADO Y ORDENACIÓN (Lado del cliente con useMemo)
  // -------------------------------------------------------------
  const incidenciasFiltradas = useMemo(() => {
    return datos
      .filter(item => {
        const query = busqueda.toLowerCase().trim()
        const coincideTexto =
          item.titulo.toLowerCase().includes(query) ||
          item.descripcion.toLowerCase().includes(query) ||
          (item.aula && item.aula.toLowerCase().includes(query))

        const coincideEstado = filtroEstado === 'todos' || item.estado === filtroEstado
        const coincidePrioridad = filtroPrioridad === 'todas' || item.prioridad === filtroPrioridad
        const coincideCategoria = filtroCategoria === 'todas' || item.categoria === filtroCategoria

        return coincideTexto && coincideEstado && coincidePrioridad && coincideCategoria
      })
      .sort((a, b) => {
        if (orden === 'recientes') {
          return new Date(b.creado_en || 0) - new Date(a.creado_en || 0) || b.id - a.id
        }
        if (orden === 'antiguos') {
          return new Date(a.creado_en || 0) - new Date(b.creado_en || 0) || a.id - b.id
        }
        if (orden === 'prioridad') {
          const pesos = { alta: 3, media: 2, baja: 1 }
          return (pesos[b.prioridad] || 0) - (pesos[a.prioridad] || 0)
        }
        return 0
      })
  }, [datos, busqueda, filtroEstado, filtroPrioridad, filtroCategoria, orden])

  // Formateador de fecha amigable estilo Apple
  function formatearFecha(isoString) {
    if (!isoString) return 'Hoy'
    try {
      const fecha = new Date(isoString)
      return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="apple-app">
      {/* Toast de notificación estilo Apple */}
      {notificacion && (
        <div className={`apple-toast ${notificacion.tipo}`} role="alert">
          <span className="toast-dot" />
          <span>{notificacion.mensaje}</span>
        </div>
      )}

      {/* Barra de navegación superior estilo macOS/iOS */}
      <nav className="apple-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="apple-logo-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div className="brand-titles">
              <div className="brand-row">
                <span className="brand-name">LabDesk</span>
                <span className="brand-tag">SENATI · L-302</span>
              </div>
              <span className="brand-subtitle">Gestión de Incidencias de Cómputo</span>
            </div>
          </div>

          <div className="navbar-actions">
            <div className="status-pill" title="Backend operativo en Django REST Framework">
              <span className="status-pulse-dot" />
              <span className="status-pill-text">API Conectada</span>
            </div>

            <button
              type="button"
              className="apple-button secondary export-btn"
              onClick={exportarCSV}
              title="Descargar listado en formato CSV"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              className="apple-button primary"
              onClick={abrirNuevaIncidencia}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Nueva Incidencia</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="apple-main">
        {/* Banner de error si falla la API */}
        {error && (
          <div className="apple-alert-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
            <button type="button" className="retry-btn" onClick={cargar}>Reintentar conexión</button>
          </div>
        )}

        {/* Tarjetas KPI de métricas en vivo */}
        <section className="apple-kpis-grid" aria-label="Estadísticas de incidencias">
          <div className="apple-kpi-card total">
            <div className="kpi-header">
              <span className="kpi-label">Total Registros</span>
              <span className="kpi-icon total-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </span>
            </div>
            <span className="kpi-value">{total}</span>
            <span className="kpi-footer">En base de datos SQLite</span>
          </div>

          <div className="apple-kpi-card pendientes">
            <div className="kpi-header">
              <span className="kpi-label">Pendientes</span>
              <span className="kpi-badge-dot dot-yellow" />
            </div>
            <span className="kpi-value">{pendientes}</span>
            <span className="kpi-footer">Por atender en cola</span>
          </div>

          <div className="apple-kpi-card proceso">
            <div className="kpi-header">
              <span className="kpi-label">En Proceso</span>
              <span className="kpi-badge-dot dot-orange" />
            </div>
            <span className="kpi-value">{enProceso}</span>
            <span className="kpi-footer">En revisión técnica</span>
          </div>

          <div className="apple-kpi-card resueltos">
            <div className="kpi-header">
              <span className="kpi-label">Resueltos</span>
              <span className="kpi-badge-dot dot-green" />
            </div>
            <span className="kpi-value">{resueltos}</span>
            <span className="kpi-footer">Cerradas con éxito</span>
          </div>

          <div className="apple-kpi-card urgentes">
            <div className="kpi-header">
              <span className="kpi-label">Prioridad Alta</span>
              <span className="kpi-badge-dot dot-red" />
            </div>
            <span className="kpi-value">{prioridadAlta}</span>
            <span className="kpi-footer">Atención inmediata</span>
          </div>
        </section>

        {/* Barra de Controles: Segmented Control + Búsqueda + Filtros */}
        <section className="apple-toolbar">
          {/* Segmented Control estilo iOS / macOS */}
          <div className="segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filtroEstado === 'todos'}
              className={`segmented-tab ${filtroEstado === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('todos')}
            >
              Todos <span className="tab-count">{total}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filtroEstado === 'pendiente'}
              className={`segmented-tab ${filtroEstado === 'pendiente' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('pendiente')}
            >
              Pendientes <span className="tab-count">{pendientes}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filtroEstado === 'en_proceso'}
              className={`segmented-tab ${filtroEstado === 'en_proceso' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('en_proceso')}
            >
              En Proceso <span className="tab-count">{enProceso}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filtroEstado === 'resuelto'}
              className={`segmented-tab ${filtroEstado === 'resuelto' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('resuelto')}
            >
              Resueltos <span className="tab-count">{resueltos}</span>
            </button>
          </div>

          {/* Fila de búsqueda y filtros secundarios */}
          <div className="filters-row">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="search"
                className="apple-input search-field"
                placeholder="Buscar por título, falla o aula..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setBusqueda('')}
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-selects">
              <div className="select-wrapper">
                <select
                  aria-label="Filtrar por categoría"
                  className="apple-select"
                  value={filtroCategoria}
                  onChange={e => setFiltroCategoria(e.target.value)}
                >
                  <option value="todas">Todas las categorías</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="red">Red / Internet</option>
                </select>
              </div>

              <div className="select-wrapper">
                <select
                  aria-label="Filtrar por prioridad"
                  className="apple-select"
                  value={filtroPrioridad}
                  onChange={e => setFiltroPrioridad(e.target.value)}
                >
                  <option value="todas">Todas las prioridades</option>
                  <option value="alta">Prioridad Alta</option>
                  <option value="media">Prioridad Media</option>
                  <option value="baja">Prioridad Baja</option>
                </select>
              </div>

              <div className="select-wrapper">
                <select
                  aria-label="Ordenar listado"
                  className="apple-select sort-select"
                  value={orden}
                  onChange={e => setOrden(e.target.value)}
                >
                  <option value="recientes">Más recientes</option>
                  <option value="antiguos">Más antiguos</option>
                  <option value="prioridad">Mayor prioridad</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Encabezado del listado con conteo dinámico */}
        <div className="list-status-header">
          <div className="list-title-wrap">
            <h2 className="list-section-title">Listado de Incidencias</h2>
            <span className="results-badge">
              {incidenciasFiltradas.length} de {total} registros
            </span>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={cargar}
            disabled={cargando}
            title="Recargar desde la API"
          >
            <svg className={cargando ? 'spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span>{cargando ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
        </div>

        {/* Lista de Tarjetas de Incidencias */}
        <section className="incidents-container">
          {incidenciasFiltradas.length === 0 ? (
            <div className="apple-empty-state">
              <div className="empty-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h3>No se encontraron incidencias</h3>
              <p>Prueba ajustando los filtros de búsqueda o registra una nueva incidencia con el botón superior.</p>
              <button
                type="button"
                className="apple-button secondary"
                onClick={() => {
                  setBusqueda('')
                  setFiltroEstado('todos')
                  setFiltroPrioridad('todas')
                  setFiltroCategoria('todas')
                }}
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="incidents-grid">
              {incidenciasFiltradas.map(item => (
                <article key={item.id} className={`apple-card incident-card estado-${item.estado}`}>
                  <div className="card-top-bar">
                    <div className="card-badges">
                      <span className={`pill-badge prioridad-${item.prioridad}`}>
                        <span className="pill-dot" />
                        {item.prioridad.toUpperCase()}
                      </span>
                      <span className={`pill-badge categoria-${item.categoria}`}>
                        {item.categoria === 'hardware' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                          </svg>
                        )}
                        {item.categoria === 'software' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 18 22 12 16 6"/>
                            <polyline points="8 6 2 12 8 18"/>
                          </svg>
                        )}
                        {item.categoria === 'red' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                            <line x1="12" y1="20" x2="12.01" y2="20"/>
                          </svg>
                        )}
                        <span>{item.categoria}</span>
                      </span>
                      {item.aula && (
                        <span className="pill-badge aula-badge" title="Ambiente / Aula SENATI">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          </svg>
                          <span>{item.aula}</span>
                        </span>
                      )}
                    </div>
                    <span className="incident-id">#{item.id}</span>
                  </div>

                  <h3 className="incident-title">{item.titulo}</h3>
                  <p className="incident-desc">{item.descripcion}</p>

                  <div className="incident-meta-footer">
                    <span className="meta-fecha" title="Fecha de reporte">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {formatearFecha(item.creado_en)}
                    </span>

                    <div className="estado-select-wrapper">
                      <select
                        aria-label={`Actualizar estado de ${item.titulo}`}
                        className={`estado-dropdown ${item.estado}`}
                        value={item.estado}
                        onChange={e => actualizarEstado(item.id, e.target.value)}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="resuelto">Resuelto</option>
                      </select>
                    </div>
                  </div>

                  <div className="card-actions-divider" />

                  <div className="card-actions-row">
                    <button
                      type="button"
                      className="card-action-btn edit"
                      onClick={() => iniciarEdicion(item)}
                      title="Editar información"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      className="card-action-btn delete"
                      onClick={() => eliminar(item.id, item.titulo)}
                      title="Eliminar incidencia"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal / Sheet estilo Apple para Crear o Editar Incidencias */}
      {mostrarModal && (
        <div className="apple-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setMostrarModal(false) }}>
          <div className="apple-modal-window" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-header-titles">
                <span className="modal-eyebrow">
                  {editando === null ? 'SOPORTE TÉCNICO · SENATI' : `INCIDENCIA #${editando}`}
                </span>
                <h2 className="modal-title">
                  {editando === null ? 'Nueva Incidencia de Laboratorio' : 'Editar Incidencia'}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMostrarModal(false)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardar} className="apple-modal-form">
              <div className="form-group">
                <label htmlFor="form-titulo">
                  Título de la incidencia <span className="req">*</span>
                </label>
                <input
                  id="form-titulo"
                  required
                  maxLength="120"
                  name="titulo"
                  className="apple-input"
                  placeholder="Ej: PC no enciende, switch sin enlace, Wi-Fi lento..."
                  value={form.titulo}
                  onChange={manejarCambio}
                />
              </div>

              <div className="form-group">
                <label htmlFor="form-descripcion">
                  Descripción detallada del problema <span className="req">*</span>
                </label>
                <textarea
                  id="form-descripcion"
                  required
                  rows="3"
                  name="descripcion"
                  className="apple-textarea"
                  placeholder="Describe la falla, equipo afectado o pruebas realizadas..."
                  value={form.descripcion}
                  onChange={manejarCambio}
                />
              </div>

              <div className="form-row-three">
                <div className="form-group">
                  <label htmlFor="form-categoria">Categoría</label>
                  <select
                    id="form-categoria"
                    name="categoria"
                    className="apple-select"
                    value={form.categoria}
                    onChange={manejarCambio}
                  >
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="red">Red / Internet</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="form-prioridad">Prioridad</label>
                  <select
                    id="form-prioridad"
                    name="prioridad"
                    className="apple-select"
                    value={form.prioridad}
                    onChange={manejarCambio}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="form-estado">Estado</label>
                  <select
                    id="form-estado"
                    name="estado"
                    className="apple-select"
                    value={form.estado}
                    onChange={manejarCambio}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                </div>
              </div>

              {/* Campo Aula / Laboratorio (Reto de clase) */}
              <div className="form-group">
                <label htmlFor="form-aula">Laboratorio o Ambiente</label>
                <input
                  id="form-aula"
                  name="aula"
                  className="apple-input"
                  placeholder="Ej: Lab 302, Lab 301, Taller Mac, Servidor..."
                  value={form.aula}
                  onChange={manejarCambio}
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="apple-button secondary"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="apple-button primary">
                  {editando === null ? 'Registrar Incidencia' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pie de página institucional SENATI */}
      <footer className="apple-footer">
        <div className="footer-content">
          <p className="footer-credits">
            <strong>SENATI</strong> · Servicio Nacional de Adiestramiento en Trabajo Industrial · Escuela de Tecnologías de la Información
          </p>
          <p className="footer-details">
            Taller Práctico Full Stack · Django REST Framework (SQLite) + React 19 (Vite) · Semestre V · CFP Lima
          </p>
        </div>
      </footer>
    </div>
  )
}

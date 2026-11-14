# LabDesk - Sistema de Gestion de Incidencias
> **SENATI - Direccion Zonal Lima - Callao**  
> **Escuela de Tecnologias de la Informacion (ETI)**  
> **Carrera:** Desarrollo de Software  
> **Semestre:** V - Taller Practico Full Stack

Sistema web Full Stack desarrollado para el registro, seguimiento y resolucion de incidencias tecnicas en los laboratorios de computo del SENATI (Sede Central / CFP Lima Norte). Disenado con interfaz limpia y minimalista, optimizado para velocidad, claridad visual y experiencia de usuario.

---

## Estructura del Proyecto

```
Sistema_de_gestion/
├── backend/                  # API REST con Django REST Framework + SQLite
│   ├── manage.py
│   ├── semillas.py           # Script con las 5 incidencias obligatorias de prueba
│   ├── config/               # Configuracion global Django (CORS, URLs, Settings)
│   │   ├── settings.py
│   │   └── urls.py
│   ├── incidencias/          # Aplicacion de incidencias
│   │   ├── models.py         # Modelo Incidencia (+ campo aula del reto)
│   │   ├── serializers.py    # Serializador DRF ModelSerializer
│   │   └── views.py          # ModelViewSet con operaciones CRUD
│   └── db.sqlite3            # Base de datos local SQLite con migraciones
├── frontend/                 # Interfaz de usuario con React 19 + Vite
│   ├── index.html            # Metadatos, titulo de la app
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx           # Componente principal con hooks y consumo de API
│       ├── App.css           # Diseno y estilos
│       └── main.jsx
└── taste-skill/              # Repositorio de referencia
```

---

## Guia de Ejecucion

### Terminal A: Servidor Backend (Django REST Framework)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```
Endpoint de la API: `http://127.0.0.1:8000/api/incidencias/`

### Terminal B: Servidor Frontend (React + Vite)
```powershell
cd frontend
npm run dev
```
Aplicacion Web: `http://127.0.0.1:5173/`

---

## Contrato de la API REST (Rubrica de 20 Puntos)

| Metodo HTTP | Endpoint | Operacion | Codigo HTTP |
|---|---|---|---|
| **GET** | `/api/incidencias/` | Listar todas las incidencias ordenadas | `200 OK` |
| **POST** | `/api/incidencias/` | Registrar nueva incidencia tecnica | `201 Created` |
| **PUT** | `/api/incidencias/{id}/` | Modificar datos completos de una incidencia | `200 OK` |
| **PATCH** | `/api/incidencias/{id}/` | Cambiar estado puntual (pendiente / proceso / resuelto) | `200 OK` |
| **DELETE** | `/api/incidencias/{id}/` | Eliminar registro con confirmacion previa | `204 No Content` |

---

## Funcionalidades y Retos Cumplidos (Pagina 12 de la Guia)

- **CRUD Completo:** Crear, leer, editar, actualizar estado y eliminar registros en SQLite.
- **Filtros Dinamicos:** Busqueda en tiempo real por texto (titulo, descripcion o aula), filtro por estado y por prioridad.
- **Dashboard de KPIs (5 contadores):**
  1. Total de registros
  2. Pendientes
  3. En proceso
  4. Resueltas
  5. Prioridad Alta (Reto adicional)
- **Reto: Campo aula:** Permite especificar el laboratorio o ambiente del SENATI (ej. Lab 302, Lab 301, Taller Mac, Lab 204).
- **Reto: Ordenamiento dinamico:** Ordenar por fecha mas reciente, mas antigua o por mayor nivel de prioridad.
- **Reto: Exportar a CSV:** Descarga directa de archivo .csv compatible con Excel (delimitador punto y coma y codificacion UTF-8 BOM).

---

## Datos de Prueba Sembrados en SQLite (Pagina 10 de la Guia)

1. **PC no enciende** - Hardware - Prioridad Alta - Pendiente - Lab 302
2. **Python no abre** - Software - Prioridad Media - En proceso - Lab 301
3. **Wi-Fi lento** - Red / Internet - Prioridad Alta - Pendiente - Taller Mac
4. **Teclado defectuoso** - Hardware - Prioridad Baja - Resuelto - Lab 204
5. **Navegador desactualizado** - Software - Prioridad Media - Resuelto - Lab 302

Para volver a sembrar los datos en cualquier momento:
```powershell
cd backend
python semillas.py
```

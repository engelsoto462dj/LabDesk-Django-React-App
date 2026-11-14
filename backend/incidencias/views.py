# SENATI - V Semestre: Taller Práctico LabDesk
# DRF ModelViewSet: Gestiona automáticamente GET, POST, PUT, PATCH y DELETE

from rest_framework import viewsets, filters
from .models import Incidencia
from .serializers import IncidenciaSerializer

class IncidenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet que provee operaciones CRUD completas para las Incidencias.
    - GET /api/incidencias/ -> Listar todas ordenadas por fecha reciente
    - POST /api/incidencias/ -> Registrar nueva incidencia
    - GET /api/incidencias/{id}/ -> Ver detalle
    - PUT /api/incidencias/{id}/ -> Modificar datos completos
    - PATCH /api/incidencias/{id}/ -> Actualizar solo estado u otro campo puntual
    - DELETE /api/incidencias/{id}/ -> Eliminar incidencia de la BD
    """
    queryset = Incidencia.objects.all().order_by('-creado_en')
    serializer_class = IncidenciaSerializer


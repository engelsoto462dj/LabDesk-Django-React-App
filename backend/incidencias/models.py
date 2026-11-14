# SENATI - CFP LIMA NORTE / SEDE CENTRAL
# Carrera: Desarrollo de Software - Semestre V
# Taller Full Stack: LabDesk - Sistema de Gestion de Incidencias

from django.db import models

class Incidencia(models.Model):
    CATEGORIAS = [
        ('hardware', 'Hardware'),
        ('software', 'Software'),
        ('red', 'Red / Internet'),
    ]
    PRIORIDADES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
    ]
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En proceso'),
        ('resuelto', 'Resuelto'),
    ]

    titulo = models.CharField(max_length=120, help_text="Título breve del problema")
    descripcion = models.TextField(help_text="Detalle del problema encontrado")
    categoria = models.CharField(
        max_length=20, choices=CATEGORIAS, default='hardware'
    )
    prioridad = models.CharField(
        max_length=10, choices=PRIORIDADES, default='media'
    )
    estado = models.CharField(
        max_length=20, choices=ESTADOS, default='pendiente'
    )
    # Reto adicional cumplido: campo para el laboratorio o aula
    aula = models.CharField(
        max_length=50, default='Lab 302', blank=True,
        help_text="Laboratorio o ambiente del SENATI donde ocurrió la falla"
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.aula}] {self.titulo} ({self.get_estado_display()})"


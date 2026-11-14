import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from incidencias.models import Incidencia

datos_prueba = [
    {
        "titulo": "PC no enciende",
        "descripcion": "La máquina número 08 del laboratorio no responde al botón de encendido. Fuente de poder revisada.",
        "categoria": "hardware",
        "prioridad": "alta",
        "estado": "pendiente",
        "aula": "Lab 302"
    },
    {
        "titulo": "Python no abre",
        "descripcion": "El entorno virtual de Python 3.12 arroja error de PATH al intentar ejecutar desde PowerShell.",
        "categoria": "software",
        "prioridad": "media",
        "estado": "en_proceso",
        "aula": "Lab 301"
    },
    {
        "titulo": "Wi-Fi lento",
        "descripcion": "Pérdida de paquetes en el Access Point del laboratorio durante la descarga de paquetes npm.",
        "categoria": "red",
        "prioridad": "alta",
        "estado": "pendiente",
        "aula": "Taller Mac"
    },
    {
        "titulo": "Teclado defectuoso",
        "descripcion": "La tecla espaciadora y las flechas no responden en la estación de trabajo 12.",
        "categoria": "hardware",
        "prioridad": "baja",
        "estado": "resuelto",
        "aula": "Lab 204"
    },
    {
        "titulo": "Navegador desactualizado",
        "descripcion": "Google Chrome requiere actualización para soportar las nuevas herramientas de desarrollo de React 19.",
        "categoria": "software",
        "prioridad": "media",
        "estado": "resuelto",
        "aula": "Lab 302"
    }
]

print("Cargando datos de prueba del SENATI...")
for d in datos_prueba:
    obj, created = Incidencia.objects.get_or_create(
        titulo=d["titulo"],
        defaults=d
    )
    if created:
        print(f" [+] Creada: {obj.titulo} ({obj.aula})")
    else:
        print(f" [=] Ya existia: {obj.titulo}")

print(f"Total incidencias registradas en SQLite: {Incidencia.objects.count()}")

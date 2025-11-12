import os
import subprocess
from pathlib import Path

# === CONFIGURACIÓN DE LA BASE DE DATOS ===
DB_NAME = "jaap_sanjapamba"
DB_USER = "postgres"
DB_PASSWORD = "Informatico593"
DB_HOST = "localhost"
DB_PORT = "5432"

# === RUTA COMPLETA DE PG_RESTORE ===
PG_RESTORE_PATH = r"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe"

# === RUTA DE BACKUPS ===
BASE_DIR = Path(__file__).resolve().parent.parent
BACKUP_DIR = BASE_DIR / "backups"

def restaurar_respaldo(nombre_archivo: str):
    """Restaura la base de datos desde un archivo de respaldo existente (.dump)"""
    archivo_respaldo = BACKUP_DIR / nombre_archivo

    if not archivo_respaldo.exists():
        print(f"❌ No se encontró el archivo: {archivo_respaldo}")
        return

    os.environ["PGPASSWORD"] = DB_PASSWORD

    comando = [
        PG_RESTORE_PATH,
        "-h", DB_HOST,
        "-p", DB_PORT,
        "-U", DB_USER,
        "-d", DB_NAME,
        "-c",  # limpia la base antes de restaurar
        str(archivo_respaldo),
    ]

    try:
        subprocess.run(comando, check=True)
        print(f"✅ Base de datos '{DB_NAME}' restaurada correctamente desde {nombre_archivo}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al restaurar respaldo: {e}")

if __name__ == "__main__":
    # 👇 Coloca aquí el nombre exacto del respaldo que quieres restaurar
    restaurar_respaldo("jaap_sanjapamba_2025-11-09_23-12.dump")

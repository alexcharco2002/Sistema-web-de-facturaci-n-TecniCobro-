import os
import datetime
import subprocess
from pathlib import Path

# === CONFIGURACIÓN DE LA BASE DE DATOS ===
DB_NAME = "jaap_sanjapamba"
DB_USER = "postgres"
DB_PASSWORD = "Informatico593"
DB_HOST = "localhost"
DB_PORT = "5432"

# === RUTA COMPLETA DE PG_DUMP ===
PG_DUMP_PATH = r"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"

# === RUTA DE BACKUPS ===
BASE_DIR = Path(__file__).resolve().parent.parent
BACKUP_DIR = BASE_DIR / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

def crear_respaldo():
    """Genera un respaldo de la base de datos PostgreSQL"""
    fecha = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M")
    archivo_respaldo = BACKUP_DIR / f"{DB_NAME}_{fecha}.dump"

    os.environ["PGPASSWORD"] = DB_PASSWORD

    comando = [
        PG_DUMP_PATH,
        "-h", DB_HOST,
        "-p", DB_PORT,
        "-U", DB_USER,
        "-F", "c",  # formato personalizado comprimido
        "-b",       # incluye blobs
        "-f", str(archivo_respaldo),
        DB_NAME,
    ]

    try:
        subprocess.run(comando, check=True)
        print(f"✅ Respaldo creado correctamente: {archivo_respaldo}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al generar respaldo: {e}")

if __name__ == "__main__":
    crear_respaldo()

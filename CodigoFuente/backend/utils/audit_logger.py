# utils/audit_logger.py
from datetime import datetime
from models.audit import AuditoriaSistema

def registrar_auditoria(db, accion: str, descripcion: str, id_usuario: int = None) -> None:
    """
    Registra una acción en la tabla AuditoriaSistema.
    
    Parámetros:
        db: Sesión activa de la base de datos.
        accion: Tipo de operación (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.).
        descripcion: Descripción detallada de la acción realizada.
        id_usuario: ID del usuario que ejecutó la acción (opcional).
    """
    try:
        nueva_auditoria = AuditoriaSistema(
            fecha=datetime.now(),
            accion=accion.upper().strip(),
            descripcion=descripcion.strip(),
            id_usuario_sistema=id_usuario
        )

        db.add(nueva_auditoria)
        db.commit()

        # Log informativo
        print(f"🟢 Auditoría registrada: [{accion.upper()}] {descripcion}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error al registrar auditoría: {e}")

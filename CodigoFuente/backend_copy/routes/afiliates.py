# routes/affiliates.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from psycopg2.errors import ForeignKeyViolation, UniqueViolation
from typing import List, Optional
from datetime import date, datetime
from models.affiliate import UsuarioAfiliado
from models.user import UsuarioSistema
from models.sector import Sector
from models.role import RolAccion
from schemas.affiliate import (
    AffiliateCreate, 
    AffiliateUpdate, 
    AffiliateResponse,
    AffiliateWithUserInfo
)
from schemas.notification import NotificacionCreate
from utils.notifications import registrar_notificacion
from utils.audit_logger import registrar_auditoria
from db.session import SessionLocal
from security.jwt import verify_token

router = APIRouter(prefix="/affiliates", tags=["affiliates"])

def get_db():
    """Dependencia para obtener la sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# HELPER: Obtener usuario actual desde el token
# ============================================================================
def get_current_user(payload: dict, db: Session) -> UsuarioSistema:
    """Obtiene el usuario actual desde el payload del JWT"""
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.usuario == payload["sub"]
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    return user

# ============================================================================
# HELPER: Verificar permisos de usuario
# ============================================================================
def check_permission(user: UsuarioSistema, db: Session, module: str, action: str = None) -> bool:
    """
    Verifica si el usuario tiene permiso para una acción.
    """
    module = module.lower().strip()
    action = action.lower().strip() if action else None

    permisos = db.query(RolAccion).filter(
        RolAccion.id_rol == user.id_rol,
        RolAccion.activo == True
    ).all()

    acciones_usuario = set()

    for permiso in permisos:
        if not permiso.nombre_accion:
            continue

        perm_module = permiso.nombre_accion.lower().strip()
        perm_action = (permiso.tipo_accion or '').lower().strip()

        if perm_module != module:
            continue

        if perm_action in ['crud', 'operaciones crud']:
            return True

        acciones_usuario.add(perm_action)

    if action is None:
        return bool(acciones_usuario)

    if action in ['leer', 'lectura']:
        if any(a in acciones_usuario for a in ['lectura', 'leer', 'crear', 'actualizar', 'eliminar']):
            return True

    return action in acciones_usuario


def require_permission(user: UsuarioSistema, db: Session, module: str, action: str = None):
    """Verifica permiso y lanza excepción si no lo tiene"""
    if not check_permission(user, db, module, action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permisos para {action or 'acceder a'} {module}"
        )

# ============================================================================
# HELPER: Convertir afiliado a respuesta con información completa
# ============================================================================
def affiliate_to_response(affiliate: UsuarioAfiliado, db: Session) -> dict:
    """Convierte un afiliado con información del usuario y sector"""
    
    # Obtener información del usuario del sistema
    user = affiliate.usuario_sistema
    sector = affiliate.sector
    
    return {
        "id_usuario_afi": affiliate.id_usuario_afi,
        "cod_usuario_afi": affiliate.cod_usuario_afi,
        "fecha_afiliacion": affiliate.fecha_afiliacion.isoformat() if affiliate.fecha_afiliacion else None,
        "id_sector": affiliate.id_sector,
        "id_usuario_sistema": affiliate.id_usuario_sistema,
        "activo": affiliate.activo,
        
        # Información del usuario del sistema
        "usuario": {
            "id": user.id_usuario_sistema,
            "usuario": user.usuario,
            "nombres": user.nombres,
            "apellidos": user.apellidos,
            "cedula": user.cedula,
            "email": user.email,
            "telefono": user.telefono,
            "direccion": user.direccion,
            "activo": user.activo
        } if user else None,
        
        # Información del sector
        "sector": {
            "id_sector": sector.id_sector,
            "nombre_sector": sector.nombre_sector,
            "descripcion": sector.descripcion,
            "activo": sector.activo
        } if sector else None
    }

# ========================================
# LISTAR AFILIADOS
# ========================================
@router.get("/", response_model=List[dict])
def listar_afiliados(
    search: Optional[str] = Query(None, description="Buscar por nombre, cédula, código"),
    id_sector: Optional[int] = Query(None, description="Filtrar por sector"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Lista todos los afiliados con filtros opcionales
    Requiere permiso: afiliados.lectura o afiliados.crud
    """
    current_user = get_current_user(payload, db)
    require_permission(current_user, db, "afiliados", "lectura")
    
    query = db.query(UsuarioAfiliado).join(UsuarioSistema).join(Sector)
    
    # Filtro de búsqueda
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (UsuarioSistema.nombres.ilike(search_filter)) |
            (UsuarioSistema.apellidos.ilike(search_filter)) |
            (UsuarioSistema.cedula.ilike(search_filter)) |
            (UsuarioAfiliado.cod_usuario_afi.cast(db.String).ilike(search_filter))
        )
    
    # Filtro por sector
    if id_sector:
        query = query.filter(UsuarioAfiliado.id_sector == id_sector)
    
    # Filtro por estado
    if activo is not None:
        query = query.filter(UsuarioAfiliado.activo == activo)
    
    # Ordenar por código de afiliado
    query = query.order_by(UsuarioAfiliado.cod_usuario_afi.desc())
    
    # Paginación
    affiliates = query.offset(skip).limit(limit).all()
    
    return [affiliate_to_response(aff, db) for aff in affiliates]

# ========================================
# OBTENER AFILIADO POR ID
# ========================================
@router.get("/{id_usuario_afi}", response_model=dict)
def obtener_afiliado(
    id_usuario_afi: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Obtiene un afiliado específico por ID
    Requiere permiso: afiliados.lectura o afiliados.crud
    """
    current_user = get_current_user(payload, db)
    require_permission(current_user, db, "afiliados", "lectura")
    
    affiliate = db.query(UsuarioAfiliado).filter(
        UsuarioAfiliado.id_usuario_afi == id_usuario_afi
    ).first()
    
    if not affiliate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Afiliado no encontrado"
        )
    
    return affiliate_to_response(affiliate, db)

# ========================================
# LISTAR USUARIOS NO AFILIADOS
# ========================================
@router.get("/available/users", response_model=List[dict])
def listar_usuarios_disponibles(
    search: Optional[str] = Query(None, description="Buscar por nombre o cédula"),
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Lista usuarios del sistema que NO están afiliados
    Requiere permiso: afiliados.lectura o afiliados.crud
    """
    current_user = get_current_user(payload, db)
    require_permission(current_user, db, "afiliados", "lectura")
    
    # Obtener IDs de usuarios ya afiliados
    afiliados_ids = db.query(UsuarioAfiliado.id_usuario_sistema).filter(
        UsuarioAfiliado.activo == True
    ).all()
    afiliados_ids = [id[0] for id in afiliados_ids]
    
    # Buscar usuarios que NO estén afiliados y estén activos
    query = db.query(UsuarioSistema).filter(
        UsuarioSistema.activo == True,
        ~UsuarioSistema.id_usuario_sistema.in_(afiliados_ids) if afiliados_ids else True
    )
    
    # Filtro de búsqueda
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (UsuarioSistema.nombres.ilike(search_filter)) |
            (UsuarioSistema.apellidos.ilike(search_filter)) |
            (UsuarioSistema.cedula.ilike(search_filter))
        )
    
    users = query.order_by(UsuarioSistema.nombres).all()
    
    return [{
        "id_usuario_sistema": user.id_usuario_sistema,
        "usuario": user.usuario,
        "nombres": user.nombres,
        "apellidos": user.apellidos,
        "cedula": user.cedula,
        "email": user.email,
        "telefono": user.telefono,
        "direccion": user.direccion
    } for user in users]

# ========================================
# CREAR AFILIADO
# ========================================
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def crear_afiliado(
    affiliate_data: AffiliateCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Crea un nuevo afiliado vinculando un usuario del sistema con un sector
    Requiere permiso: afiliados.crear o afiliados.crud
    """
    current_user = get_current_user(payload, db)
    require_permission(current_user, db, "afiliados", "crear")
    
    # Verificar que el usuario del sistema existe
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.id_usuario_sistema == affiliate_data.id_usuario_sistema
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario del sistema no encontrado"
        )
    
    # Verificar que el sector existe
    sector = db.query(Sector).filter(
        Sector.id_sector == affiliate_data.id_sector
    ).first()
    
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sector no encontrado"
        )
    
    # Verificar que el usuario no esté ya afiliado
    existe = db.query(UsuarioAfiliado).filter(
        UsuarioAfiliado.id_usuario_sistema == affiliate_data.id_usuario_sistema,
        UsuarioAfiliado.activo == True
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El usuario '{user.nombres} {user.apellidos}' ya está afiliado"
        )
    
    # Generar código de afiliado (último código + 1)
    ultimo_codigo = db.query(UsuarioAfiliado.cod_usuario_afi).order_by(
        UsuarioAfiliado.cod_usuario_afi.desc()
    ).first()
    
    nuevo_codigo = (ultimo_codigo[0] + 1) if ultimo_codigo else 1
    
    # Crear nuevo afiliado
    nuevo_afiliado = UsuarioAfiliado(
        cod_usuario_afi=nuevo_codigo,
        fecha_afiliacion=date.today(),
        id_sector=affiliate_data.id_sector,
        id_usuario_sistema=affiliate_data.id_usuario_sistema,
        activo=True
    )
    
    try:
        db.add(nuevo_afiliado)
        db.commit()
        db.refresh(nuevo_afiliado)
        
        # Auditoría
        registrar_auditoria(
            db=db,
            accion="CREATE",
            descripcion=f"Afiliado creado: {user.nombres} {user.apellidos} (Código: {nuevo_codigo}) en sector '{sector.nombre_sector}' por '{payload['sub']}'",
            id_usuario=current_user.id_usuario_sistema
        )
        
        # Notificación
        registrar_notificacion(
            db=db,
            id_usuario=current_user.id_usuario_sistema,
            titulo="Afiliado creado",
            mensaje=f"El usuario '{user.nombres} {user.apellidos}' fue afiliado correctamente con código {nuevo_codigo}.",
            tipo="success"
        )
        
        return affiliate_to_response(nuevo_afiliado, db)
    
    except IntegrityError as e:
        db.rollback()
        if isinstance(e.orig, UniqueViolation):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya está afiliado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear afiliado: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear afiliado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear el afiliado: {str(e)}"
        )

# ========================================
# ACTUALIZAR AFILIADO
# ========================================
@router.put("/{id_usuario_afi}", response_model=dict)
def actualizar_afiliado(
    id_usuario_afi: int,
    affiliate_data: AffiliateUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Actualiza un afiliado existente (cambiar sector principalmente)
    Requiere permiso: afiliados.actualizar o afiliados.crud
    """
    current_user = get_current_user(payload, db)
    require_permission(current_user, db, "afiliados", "actualizar")
    
    # Buscar el afiliado
    affiliate = db.query(UsuarioAfiliado).filter(
        UsuarioAfiliado.id_usuario_afi == id_usuario_afi
    ).first()
    
    if not affiliate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Afiliado no encontrado"
        )
    
    # Si se cambia el sector, verificar que existe
    if affiliate_data.id_sector and affiliate_data.id_sector != affiliate.id_sector:
        sector = db.query(Sector).filter(
            Sector.id_sector == affiliate_data.id_sector
        ).first()
        
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sector no encontrado"
            )
    
    # Actualizar campos
    update_data = affiliate_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(affiliate, key, value)
    
    try:
        db.commit()
        db.refresh(affiliate)
        
        # Auditoría
        user = affiliate.usuario_sistema
        registrar_auditoria(
            db=db,
            accion="UPDATE",
            descripcion=f"Afiliado actualizado: {user.nombres} {user.apellidos} (Código: {affiliate.cod_usuario_afi}) por '{payload['sub']}'",
            id_usuario=current_user.id_usuario_sistema
        )
        
        # Notificación
        registrar_notificacion(
            db=db,
            id_usuario=current_user.id_usuario_sistema,
            titulo="Afiliado modificado",
            mensaje=f"El afiliado '{user.nombres} {user.apellidos}' fue modificado correctamente.",
            tipo="info"
        )
        
        return affiliate_to_response(affiliate, db)
    
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar afiliado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el afiliado"
        )

# ========================================
# ELIMINAR AFILIADO
# ========================================
@router.delete("/{id_usuario_afi}", status_code=status.HTTP_200_OK)
def eliminar_afiliado(
    id_usuario_afi: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Elimina el afiliado si no tiene relaciones (medidores, facturas, etc.).
    Si tiene relaciones, lo desactiva (borrado lógico).
    Requiere permiso: afiliados.eliminar o afiliados.crud
    """
    current_user = get_current_user(payload, db)
    require_permission(current_user, db, "afiliados", "eliminar")
    
    affiliate = db.query(UsuarioAfiliado).filter(
        UsuarioAfiliado.id_usuario_afi == id_usuario_afi
    ).first()
    
    if not affiliate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Afiliado no encontrado"
        )
    
    user = affiliate.usuario_sistema
    nombre_completo = f"{user.nombres} {user.apellidos}"
    codigo = affiliate.cod_usuario_afi
    
    try:
        # Intentar eliminar físicamente
        db.delete(affiliate)
        db.commit()
        
        # Auditoría
        registrar_auditoria(
            db=db,
            accion="DELETE",
            descripcion=f"Afiliado eliminado: {nombre_completo} (Código: {codigo}) por '{payload['sub']}'",
            id_usuario=current_user.id_usuario_sistema
        )
        
        # Notificación
        registrar_notificacion(
            db=db,
            id_usuario=current_user.id_usuario_sistema,
            titulo="Afiliado eliminado",
            mensaje=f"El afiliado '{nombre_completo}' fue eliminado correctamente.",
            tipo="info"
        )
        
        return {
            "success": True,
            "message": f"Afiliado '{nombre_completo}' eliminado correctamente.",
            "accion": "eliminado"
        }
    
    except IntegrityError as e:
        db.rollback()
        
        if isinstance(e.orig, ForeignKeyViolation):
            print(f"⚠️ No se puede eliminar por relaciones, se desactiva el afiliado: {e}")
            
            if not affiliate.activo:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El afiliado '{nombre_completo}' ya está inactivo."
                )
            
            affiliate.activo = False
            db.commit()
            db.refresh(affiliate)
            
            # Auditoría
            registrar_auditoria(
                db=db,
                accion="UPDATE",
                descripcion=f"Afiliado desactivado (por relaciones): {nombre_completo} (Código: {codigo}) por '{payload['sub']}'",
                id_usuario=current_user.id_usuario_sistema
            )
            
            # Notificación
            registrar_notificacion(
                db=db,
                id_usuario=current_user.id_usuario_sistema,
                titulo="Afiliado desactivado",
                mensaje=f"El afiliado '{nombre_completo}' no se pudo eliminar porque tiene relaciones con otros módulos (medidores, facturas, etc.). Fue desactivado automáticamente.",
                tipo="alerta"
            )
            
            return {
                "success": True,
                "message": f"⚠️ El afiliado '{nombre_completo}' no se pudo eliminar porque tiene relación con otros módulos, por lo que fue desactivado automáticamente.",
                "accion": "desactivado",
                "afiliado": affiliate_to_response(affiliate, db)
            }
        
        print(f"Error inesperado al eliminar afiliado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al intentar eliminar el afiliado"
        )
    
    except Exception as e:
        db.rollback()
        print(f"❌ Error al eliminar afiliado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar el afiliado"
        )

# ========================================
# CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
# ========================================
@router.patch("/{id_usuario_afi}/toggle-status", response_model=dict)
def toggle_affiliate_status(
    id_usuario_afi: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Activa o desactiva un afiliado
    Requiere permiso: afiliados.actualizar o afiliados.crud
    """
    current_user = get_current_user(payload, db)
    require_permission(current_user, db, "afiliados", "actualizar")
    
    affiliate = db.query(UsuarioAfiliado).filter(
        UsuarioAfiliado.id_usuario_afi == id_usuario_afi
    ).first()
    
    if not affiliate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Afiliado no encontrado"
        )
    
    # Cambiar estado
    affiliate.activo = not affiliate.activo
    estado_texto = "activado" if affiliate.activo else "desactivado"
    
    try:
        db.commit()
        db.refresh(affiliate)
        
        user = affiliate.usuario_sistema
        # Auditoría
        registrar_auditoria(
            db=db,
            accion="UPDATE",
            descripcion=f"Afiliado {estado_texto}: {user.nombres} {user.apellidos} (Código: {affiliate.cod_usuario_afi}) por '{payload['sub']}'",
            id_usuario=current_user.id_usuario_sistema
        )
        
        return affiliate_to_response(affiliate, db)
    
    except Exception as e:
        db.rollback()
        print(f"❌ Error al cambiar estado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cambiar el estado del afiliado"
        )

# ========================================
# ESTADÍSTICAS
# ========================================
@router.get("/stats/count")
def obtener_estadisticas_afiliados(
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Obtiene estadísticas de afiliados
    Requiere permiso: afiliados.lectura o afiliados.crud
    """
    current_user = get_current_user(payload, db)
    require_permission(current_user, db, "afiliados", "lectura")
    
    total = db.query(UsuarioAfiliado).count()
    activos = db.query(UsuarioAfiliado).filter(UsuarioAfiliado.activo == True).count()
    inactivos = db.query(UsuarioAfiliado).filter(UsuarioAfiliado.activo == False).count()
    
    # Afiliados por sector
    por_sector = db.query(
        Sector.nombre_sector,
        db.func.count(UsuarioAfiliado.id_usuario_afi)
    ).join(
        UsuarioAfiliado, Sector.id_sector == UsuarioAfiliado.id_sector
    ).filter(
        UsuarioAfiliado.activo == True
    ).group_by(
        Sector.nombre_sector
    ).all()
    
    return {
        "total": total,
        "activos": activos,
        "inactivos": inactivos,
        "por_sector": [{"sector": s[0], "cantidad": s[1]} for s in por_sector]
    }
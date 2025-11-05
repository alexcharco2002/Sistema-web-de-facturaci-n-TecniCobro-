# routes/roles.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models.role import Rol, RolAccion
from models.user import UsuarioSistema
from schemas.role import (
    RolCreate, RolUpdate, RolResponse, RolConAcciones,
    RolAccionCreate, RolAccionUpdate, RolAccionResponse
)
from db.session import SessionLocal
from security.jwt import verify_token

router = APIRouter(prefix="/roles", tags=["roles"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verificar_es_admin(payload: dict, db: Session):
    """Verifica que el usuario sea administrador"""
    db_user = db.query(UsuarioSistema).filter(
        UsuarioSistema.usuario == payload["sub"]
    ).first()
    
    if not db_user or not db_user.id_rol:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    rol = db.query(Rol).filter(
        Rol.id_rol == db_user.id_rol,
        Rol.nombre_rol == "Administrador"
    ).first()
    
    if not rol:
        raise HTTPException(
            status_code=403, 
            detail="No tienes permisos de administrador"
        )
    
    return True

# ========================================
# CRUD ROLES
# ========================================
@router.get("/", response_model=List[RolResponse])
def listar_roles(
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Lista todos los roles"""
    roles = db.query(Rol).all()  # ✅ Mostrar todos, no solo activos
    return roles

@router.get("/{id_rol}", response_model=RolConAcciones)
def obtener_rol(
    id_rol: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Obtiene un rol específico con sus acciones"""
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    
    if not rol:
        raise HTTPException(
            status_code=404,
            detail="Rol no encontrado"
        )
    
    return rol

@router.post("/", response_model=RolResponse)
def crear_rol(
    rol: RolCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Crea un nuevo rol - Solo admin"""
    verificar_es_admin(payload, db)
    
    # Verificar que no exista
    existe = db.query(Rol).filter(
        Rol.nombre_rol == rol.nombre_rol
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un rol con ese nombre"
        )
    
    nuevo_rol = Rol(**rol.dict())
    db.add(nuevo_rol)
    db.commit()
    db.refresh(nuevo_rol)
    
    return nuevo_rol

@router.put("/{id_rol}", response_model=RolResponse)
def actualizar_rol(
    id_rol: int,
    rol_update: RolUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Actualiza un rol - Solo admin"""
    verificar_es_admin(payload, db)
    
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    # Validar duplicado solo si el nombre cambia
    if rol_update.nombre_rol and rol_update.nombre_rol != rol.nombre_rol:
        existe = db.query(Rol).filter(
            Rol.nombre_rol == rol_update.nombre_rol,
            Rol.id_rol != id_rol
        ).first()
        if existe:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe otro rol con el nombre '{rol_update.nombre_rol}'."
            )

    # Actualizar solo los campos enviados
    for key, value in rol_update.dict(exclude_unset=True).items():
        setattr(rol, key, value)

    db.commit()
    db.refresh(rol)

    return rol

@router.delete("/{id_rol}")
def eliminar_rol(
    id_rol: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Desactiva un rol (soft delete) - Solo admin"""
    verificar_es_admin(payload, db)
    
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    # Verificar que no haya usuarios con este rol
    usuarios_con_rol = db.query(UsuarioSistema).filter(
        UsuarioSistema.id_rol == id_rol
    ).count()
    
    if usuarios_con_rol > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar el rol. Hay {usuarios_con_rol} usuario(s) con este rol"
        )
    
    rol.activo = False
    db.commit()
    
    return {
        "success": True,
        "message": "Rol desactivado correctamente"
    }

# ✅ NUEVO: Toggle status para roles
@router.patch("/{id_rol}/toggle-status", response_model=RolResponse)
def toggle_rol_status(
    id_rol: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Activa/Desactiva un rol - Solo admin"""
    verificar_es_admin(payload, db)
    
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    rol.activo = not rol.activo
    db.commit()
    db.refresh(rol)
    
    return rol

# ========================================
# CRUD ROL_ACCIONES
# ========================================
@router.get("/{id_rol}/acciones", response_model=List[RolAccionResponse])
def listar_acciones_rol(
    id_rol: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Lista las acciones de un rol"""
    acciones = db.query(RolAccion).filter(
        RolAccion.id_rol == id_rol
    ).all()  # ✅ Mostrar todas, no solo activas
    
    return acciones

@router.post("/{id_rol}/acciones", response_model=RolAccionResponse)
def agregar_accion_rol(
    id_rol: int,
    accion: RolAccionCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Agrega una acción a un rol - Solo admin"""
    verificar_es_admin(payload, db)
    
    # Verificar que el rol existe
    rol = db.query(Rol).filter(Rol.id_rol == id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    # Verificar que no exista la misma acción
    existe = db.query(RolAccion).filter(
        RolAccion.id_rol == id_rol,
        RolAccion.nombre_accion == accion.nombre_accion,
        RolAccion.tipo_accion == accion.tipo_accion
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=400,
            detail="Esta acción ya existe para este rol"
        )
    
    nueva_accion = RolAccion(id_rol=id_rol, **accion.dict())
    db.add(nueva_accion)
    db.commit()
    db.refresh(nueva_accion)
    
    return nueva_accion

@router.put("/acciones/{id_rol_accion}", response_model=RolAccionResponse)
def actualizar_accion(
    id_rol_accion: int,
    accion_update: RolAccionUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Actualiza una acción - Solo admin"""
    verificar_es_admin(payload, db)
    
    accion = db.query(RolAccion).filter(
        RolAccion.id_rol_accion == id_rol_accion
    ).first()
    
    if not accion:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
    
    for key, value in accion_update.dict(exclude_unset=True).items():
        setattr(accion, key, value)
    
    db.commit()
    db.refresh(accion)
    
    return accion

@router.delete("/acciones/{id_rol_accion}")
def eliminar_accion(
    id_rol_accion: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Desactiva una acción (soft delete) - Solo admin"""
    verificar_es_admin(payload, db)
    
    accion = db.query(RolAccion).filter(
        RolAccion.id_rol_accion == id_rol_accion
    ).first()
    
    if not accion:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
    
    accion.activo = False  # ✅ Cambiado de 'estado' a 'activo'
    db.commit()
    
    return {
        "success": True,
        "message": "Acción desactivada correctamente"
    }

# ✅ NUEVO: Toggle status para acciones
@router.patch("/acciones/{id_rol_accion}/toggle-status", response_model=RolAccionResponse)
def toggle_accion_status(
    id_rol_accion: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """Activa/Desactiva una acción - Solo admin"""
    verificar_es_admin(payload, db)
    
    accion = db.query(RolAccion).filter(
        RolAccion.id_rol_accion == id_rol_accion
    ).first()
    
    if not accion:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
    
    accion.activo = not accion.activo  # ✅ Cambiado de 'estado' a 'activo'
    db.commit()
    db.refresh(accion)
    
    return accion
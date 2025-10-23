# routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import base64

from db.session import SessionLocal
from models.user import UsuarioSistema
from schemas.user import (
    UserCreate, 
    UserUpdate, 
    UserResponse, 
    UserListResponse,
    ChangePasswordRequest
)
from security.jwt import verify_token
from security.password import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def process_user_photo(foto_bytes):
    """Procesa la foto del usuario para enviarla al frontend"""
    if foto_bytes:
        try:
            foto_base64 = base64.b64encode(foto_bytes).decode('utf-8')
            return f"data:image/jpeg;base64,{foto_base64}"
        except Exception as e:
            print(f"Error procesando foto: {e}")
            return None
    return None

def user_to_response(user: UsuarioSistema) -> dict:
    """Convierte un usuario de BD a diccionario de respuesta"""
    foto_url = process_user_photo(user.foto) if user.foto else None
    
    return {
        "id": user.cod_usuario_sistema,
        "usuario": user.usuario,
        "nombres": user.nombres,
        "apellidos": user.apellidos,
        "cedula": user.cedula,
        "email": user.email,
        "telefono": getattr(user, 'telefono', None),
        "direccion": getattr(user, 'direccion', None),
        "rol": user.rol,
        "activo": getattr(user, 'activo', True),
        "fecha_registro": user.fecha_registro.isoformat() if user.fecha_registro else None,
        "ultimo_acceso": getattr(user, 'ultimo_acceso', None),
        "foto": foto_url
    }

# ========================================
# LISTAR USUARIOS
# ========================================
@router.get("", response_model=List[UserListResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    rol: Optional[str] = None,
    activo: Optional[bool] = None,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene lista de usuarios con filtros opcionales
    Requiere autenticación
    """
    # Verificar que el usuario tenga permisos (solo admin)
    if payload.get("rol") != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver la lista de usuarios"
        )
    
    query = db.query(UsuarioSistema)
    
    # Filtro de búsqueda
    if search:
        search_filter = or_(
            UsuarioSistema.nombres.ilike(f"%{search}%"),
            UsuarioSistema.apellidos.ilike(f"%{search}%"),
            UsuarioSistema.email.ilike(f"%{search}%"),
            UsuarioSistema.usuario.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Filtro de rol
    if rol and rol != "all":
        query = query.filter(UsuarioSistema.rol == rol)
    
    # Filtro de estado
    if activo is not None:
        if hasattr(UsuarioSistema, 'activo'):
            query = query.filter(UsuarioSistema.activo == activo)
    
    # Ordenar por fecha de registro descendente
    query = query.order_by(UsuarioSistema.fecha_registro.desc())
    
    users = query.offset(skip).limit(limit).all()
    
    return [user_to_response(user) for user in users]

1
# ========================================
# OBTENER USUARIO POR ID
# ========================================
@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene un usuario específico por ID
    """
    # Verificar permisos: admin o el mismo usuario
    if payload.get("rol") != "administrador":
        # Obtener el cod_usuario_sistema del usuario actual
        current_user = db.query(UsuarioSistema).filter(
            UsuarioSistema.usuario == payload["sub"]
        ).first()
        
        if not current_user or current_user.cod_usuario_sistema != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver este usuario"
            )
    
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.cod_usuario_sistema == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user_to_response(user)


# ========================================
# CREAR USUARIO
# ========================================
@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo usuario
    Solo admin puede crear usuarios
    """
    # Verificar que el usuario sea admin
    if payload.get("rol") != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear usuarios"
        )
    
    # Verificar si el usuario ya existe
    existing_user = db.query(UsuarioSistema).filter(
        or_(
            UsuarioSistema.usuario == user_data.usuario,
            UsuarioSistema.email == user_data.email,
            UsuarioSistema.cedula == user_data.cedula
        )
    ).first()
    
    if existing_user:
        if existing_user.usuario == user_data.usuario:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
        elif existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email electrónico ya está registrado"
            )
        elif existing_user.cedula == user_data.cedula:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cédula ya está registrada"
            )
    
    # Cifrar la contraseña
    hashed_password = hash_password(user_data.clave)
    
    # Crear nuevo usuario
    new_user = UsuarioSistema(
        usuario=user_data.usuario.strip(),
        clave=hashed_password,
        nombres=user_data.nombres.strip(),
        apellidos=user_data.apellidos.strip(),
        cedula=user_data.cedula.strip(),
        email=user_data.email.strip().lower(),
        rol=user_data.rol,
        fecha_registro=datetime.now()
    )
    
    # Agregar campos opcionales si existen en el modelo
    if hasattr(UsuarioSistema, 'telefono') and user_data.telefono:
        new_user.telefono = user_data.telefono.strip()
    
    if hasattr(UsuarioSistema, 'direccion') and user_data.direccion:
        new_user.direccion = user_data.direccion.strip()
    
    if hasattr(UsuarioSistema, 'activo'):
        new_user.activo = user_data.activo
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return user_to_response(new_user)
    
    except Exception as e:
        db.rollback()
        print(f"Error al crear usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el usuario"
        )


# ========================================
# ACTUALIZAR USUARIO
# ========================================
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Actualiza un usuario existente
    Admin puede actualizar cualquier usuario
    Usuario normal solo puede actualizar sus propios datos
    """
    # Obtener usuario a actualizar
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.cod_usuario_sistema == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar permisos
    if payload.get("rol") != "administrador":
        current_user = db.query(UsuarioSistema).filter(
            UsuarioSistema.usuario == payload["sub"]
        ).first()
        
        if not current_user or current_user.cod_usuario_sistema != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para actualizar este usuario"
            )
        
        # Usuario normal no puede cambiar su propio rol
        if user_data.rol and user_data.rol != user.rol:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes cambiar tu propio rol"
            )
    
    # Verificar unicidad de campos si se están actualizando
    if user_data.usuario and user_data.usuario != user.usuario:
        existing = db.query(UsuarioSistema).filter(
            UsuarioSistema.usuario == user_data.usuario,
            UsuarioSistema.cod_usuario_sistema != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
    
    if user_data.email and user_data.email != user.email:
        existing = db.query(UsuarioSistema).filter(
            UsuarioSistema.email == user_data.email,
            UsuarioSistema.cod_usuario_sistema != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email electrónico ya está registrado"
            )
    
    if user_data.cedula and user_data.cedula != user.cedula:
        existing = db.query(UsuarioSistema).filter(
            UsuarioSistema.cedula == user_data.cedula,
            UsuarioSistema.cod_usuario_sistema != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cédula ya está registrada"
            )
    
    # Actualizar campos
    update_data = user_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if value is not None:
            if field == "clave":
                # Si se está actualizando la contraseña, cifrarla
                setattr(user, field, hash_password(value))
            elif field in ["usuario", "nombres", "apellidos", "email", "cedula", "telefono", "direccion"]:
                setattr(user, field, value.strip() if isinstance(value, str) else value)
            else:
                setattr(user, field, value)
    
    try:
        db.commit()
        db.refresh(user)
        
        return user_to_response(user)
    
    except Exception as e:
        db.rollback()
        print(f"Error al actualizar usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el usuario"
        )


# ========================================
# ELIMINAR USUARIO
# ========================================
@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Elimina un usuario
    Solo admin puede eliminar usuarios
    """
    # Verificar que el usuario sea admin
    if payload.get("rol") != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar usuarios"
        )
    
    # Verificar que no se esté eliminando a sí mismo
    current_user = db.query(UsuarioSistema).filter(
        UsuarioSistema.usuario == payload["sub"]
    ).first()
    
    if current_user and current_user.cod_usuario_sistema == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario"
        )
    
    # Obtener usuario a eliminar
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.cod_usuario_sistema == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    try:
        db.delete(user)
        db.commit()
        
        return {
            "success": True,
            "message": "Usuario eliminado exitosamente"
        }
    
    except Exception as e:
        db.rollback()
        print(f"Error al eliminar usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar el usuario"
        )


# ========================================
# CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
# ========================================
@router.patch("/{user_id}/toggle-status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Activa o desactiva un usuario
    Solo admin puede cambiar el estado
    """
    if payload.get("rol") != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para cambiar el estado de usuarios"
        )
    
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.cod_usuario_sistema == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que el modelo tenga el campo activo
    if not hasattr(UsuarioSistema, 'activo'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El modelo de usuario no soporta el campo 'activo'"
        )
    
    # Cambiar estado
    user.activo = not user.activo
    
    try:
        db.commit()
        db.refresh(user)
        
        return user_to_response(user)
    
    except Exception as e:
        db.rollback()
        print(f"Error al cambiar estado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cambiar el estado del usuario"
        )


# ========================================
# CAMBIAR CONTRASEÑA
# ========================================
@router.put("/{user_id}/change-password")
def change_user_password(
    user_id: int,
    password_data: ChangePasswordRequest,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Cambia la contraseña de un usuario
    El usuario solo puede cambiar su propia contraseña
    """
    # Obtener usuario actual
    current_user = db.query(UsuarioSistema).filter(
        UsuarioSistema.usuario == payload["sub"]
    ).first()
    
    # Verificar que sea el mismo usuario o admin
    if payload.get("rol") != "administrador" and (not current_user or current_user.cod_usuario_sistema != user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para cambiar esta contraseña"
        )
    
    # Obtener usuario a actualizar
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.cod_usuario_sistema == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar contraseña actual (solo si no es admin)
    if payload.get("rol") != "administrador":
        if not verify_password(password_data.current_password, user.clave):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual es incorrecta"
            )
    
    # Validar nueva contraseña
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres"
        )
    
    # Actualizar contraseña
    user.clave = hash_password(password_data.new_password)
    
    try:
        db.commit()
        
        return {
            "success": True,
            "message": "Contraseña actualizada exitosamente"
        }
    
    except Exception as e:
        db.rollback()
        print(f"Error al cambiar contraseña: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la contraseña"
        )


# ========================================
# SUBIR FOTO DE PERFIL
# ========================================
@router.post("/{user_id}/upload-photo", response_model=UserResponse)
async def upload_user_photo(
    user_id: int,
    file: UploadFile = File(...),
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Sube o actualiza la foto de perfil de un usuario
    """
    # Verificar permisos
    if payload.get("rol") != "administrador":
        current_user = db.query(UsuarioSistema).filter(
            UsuarioSistema.usuario == payload["sub"]
        ).first()
        
        if not current_user or current_user.cod_usuario_sistema != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para actualizar esta foto"
            )
    
    # Obtener usuario
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.cod_usuario_sistema == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Validar tipo de archivo
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser una imagen"
        )
    
    # Leer archivo
    contents = await file.read()
    
    # Validar tamaño (máximo 2MB)
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen no debe superar los 2MB"
        )
    
    # Guardar foto en la base de datos
    user.foto = contents
    
    try:
        db.commit()
        db.refresh(user)
        
        return user_to_response(user)
    
    except Exception as e:
        db.rollback()
        print(f"Error al subir foto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar la foto"
        )
# ========================================
# DESBLOQUEAR USUARIO (ADMINISTRADOR)
# ========================================
@router.post("/{user_id}/unlock", status_code=status.HTTP_200_OK)
def unlock_user_account(
    user_id: int,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Desbloquea un usuario y resetea sus intentos fallidos
    Solo admin puede desbloquear usuarios
    """
    # Verificar que el usuario sea admin
    if payload.get("rol") != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para desbloquear usuarios"
        )
    
    # Obtener usuario a desbloquear
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.cod_usuario_sistema == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Guardar estado anterior para el mensaje
    was_permanently_blocked = user.bloqueado_permanente
    was_temporarily_blocked = user.bloqueado_hasta is not None
    previous_attempts = user.intentos_fallidos
    
    # Resetear todos los bloqueos
    user.intentos_fallidos = 0
    user.bloqueado_hasta = None
    user.bloqueado_permanente = False
    
    try:
        db.commit()
        db.refresh(user)
        
        # Mensaje personalizado según el estado anterior
        if was_permanently_blocked:
            message = f"Usuario '{user.usuario}' desbloqueado exitosamente (bloqueo permanente removido)"
        elif was_temporarily_blocked:
            message = f"Usuario '{user.usuario}' desbloqueado exitosamente (bloqueo temporal removido)"
        else:
            message = f"Intentos fallidos reseteados para '{user.usuario}'"
        
        return {
            "success": True,
            "message": message,
            "data": {
                "usuario": user.usuario,
                "intentos_previos": previous_attempts,
                "bloqueado_permanente_previo": was_permanently_blocked,
                "bloqueado_temporal_previo": was_temporarily_blocked
            }
        }
    
    except Exception as e:
        db.rollback()
        print(f"Error al desbloquear usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al desbloquear el usuario"
        )


# ========================================
# OBTENER ESTADO DE BLOQUEO
# ========================================
@router.get("/{user_id}/lock-status", status_code=status.HTTP_200_OK)
def get_user_lock_status(
    user_id: int,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene el estado de bloqueo de un usuario
    Admin puede ver cualquier usuario, usuario normal solo el suyo
    """
    # Verificar permisos
    if payload.get("rol") != "administrador":
        current_user = db.query(UsuarioSistema).filter(
            UsuarioSistema.usuario == payload["sub"]
        ).first()
        
        if not current_user or current_user.cod_usuario_sistema != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver este estado"
            )
    
    user = db.query(UsuarioSistema).filter(
        UsuarioSistema.cod_usuario_sistema == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Calcular si el bloqueo temporal está activo
    bloqueado_temporal_activo = False
    tiempo_restante_minutos = None
    
    if user.bloqueado_hasta:
        ahora = datetime.now()
        if user.bloqueado_hasta > ahora:
            bloqueado_temporal_activo = True
            tiempo_restante = user.bloqueado_hasta - ahora
            tiempo_restante_minutos = int(tiempo_restante.total_seconds() / 60)
    
    return {
        "success": True,
        "data": {
            "usuario": user.usuario,
            "intentos_fallidos": user.intentos_fallidos,
            "bloqueado_permanente": user.bloqueado_permanente,
            "bloqueado_temporal_activo": bloqueado_temporal_activo,
            "bloqueado_hasta": user.bloqueado_hasta.isoformat() if user.bloqueado_hasta else None,
            "tiempo_restante_minutos": tiempo_restante_minutos,
            "intentos_restantes_para_bloqueo_temporal": max(0, 5 - (user.intentos_fallidos % 5)),
            "intentos_restantes_para_bloqueo_permanente": max(0, 10 - user.intentos_fallidos)
        }
    }


# ========================================
# LISTAR USUARIOS BLOQUEADOS
# ========================================
@router.get("/admin/blocked-users", status_code=status.HTTP_200_OK)
def get_blocked_users(
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Lista todos los usuarios bloqueados
    Solo admin puede acceder
    """
    # Verificar que el usuario sea admin
    if payload.get("rol") != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver usuarios bloqueados"
        )
    
    ahora = datetime.now()
    
    # Usuarios con bloqueo permanente
    permanently_blocked = db.query(UsuarioSistema).filter(
        UsuarioSistema.bloqueado_permanente == True
    ).all()
    
    # Usuarios con bloqueo temporal activo
    temporarily_blocked = db.query(UsuarioSistema).filter(
        UsuarioSistema.bloqueado_hasta > ahora,
        UsuarioSistema.bloqueado_permanente == False
    ).all()
    
    # Usuarios con intentos fallidos pero no bloqueados
    users_with_attempts = db.query(UsuarioSistema).filter(
        UsuarioSistema.intentos_fallidos > 0,
        UsuarioSistema.bloqueado_permanente == False,
        or_(
            UsuarioSistema.bloqueado_hasta == None,
            UsuarioSistema.bloqueado_hasta <= ahora
        )
    ).all()
    
    def format_user_lock_info(user):
        tiempo_restante = None
        if user.bloqueado_hasta and user.bloqueado_hasta > ahora:
            tiempo_restante = int((user.bloqueado_hasta - ahora).total_seconds() / 60)
        
        return {
            "id": user.cod_usuario_sistema,
            "usuario": user.usuario,
            "nombre_completo": f"{user.nombres} {user.apellidos}",
            "email": user.email,
            "intentos_fallidos": user.intentos_fallidos,
            "bloqueado_permanente": user.bloqueado_permanente,
            "bloqueado_hasta": user.bloqueado_hasta.isoformat() if user.bloqueado_hasta else None,
            "tiempo_restante_minutos": tiempo_restante
        }
    
    return {
        "success": True,
        "data": {
            "permanently_blocked": [format_user_lock_info(u) for u in permanently_blocked],
            "temporarily_blocked": [format_user_lock_info(u) for u in temporarily_blocked],
            "users_with_attempts": [format_user_lock_info(u) for u in users_with_attempts],
            "total_permanently_blocked": len(permanently_blocked),
            "total_temporarily_blocked": len(temporarily_blocked),
            "total_with_attempts": len(users_with_attempts)
        }
    }
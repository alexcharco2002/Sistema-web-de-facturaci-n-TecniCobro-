# routes/user_secure.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from db.session import SessionLocal
from models.user_secure import UsuarioSeguro
from schemas.user_secure import UserSecureCreate, UserSecureResponse
from security.encryption import encrypt_data, decrypt_data, mask_sensitive_data
from security.jwt import verify_token

router = APIRouter(prefix="/usuarios-seguros", tags=["Usuarios Seguros"])

# ============================================================
# DEPENDENCIAS DE BASE DE DATOS
# ============================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================
# UTILIDAD: Convertir modelo → esquema de respuesta
# ============================================================
def user_secure_to_response(user: UsuarioSeguro) -> dict:
    """Convierte un registro de BD en un diccionario listo para respuesta API"""
    return {
        "id": user.id,
        "usuario": user.usuario,
        "nombres": user.nombres,
        "apellidos": user.apellidos,
        "correo": decrypt_data(user.correo),
        "cedula": decrypt_data(user.cedula),
        "telefono": decrypt_data(user.telefono) if user.telefono else None,
        "direccion": decrypt_data(user.direccion) if user.direccion else None,
        "numtarjeta": mask_sensitive_data(
            decrypt_data(user.numtarjeta), "card"
        ) if user.numtarjeta else None,
        "rol": user.rol,
        "activo": user.activo,
        "fecha_registro": user.fecha_registro.isoformat() if user.fecha_registro else None,
    }

# ============================================================
# CREAR USUARIO SEGURO
# ============================================================
@router.post("", response_model=UserSecureResponse, status_code=status.HTTP_201_CREATED)
def create_secure_user(
    user_data: UserSecureCreate,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo usuario seguro (cifrado en base de datos)
    Solo el admin puede crear usuarios.
    """
    # Validar permisos
    if payload.get("rol") != "ADMINISTRADOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear usuarios seguros"
        )

    # Validar que el usuario no exista
    existing_user = db.query(UsuarioSeguro).filter(
        UsuarioSeguro.usuario == user_data.usuario
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya existe"
        )

    # Crear objeto con datos encriptados
    new_user = UsuarioSeguro(
        usuario=user_data.usuario.strip(),
        nombres=user_data.nombres.strip(),
        apellidos=user_data.apellidos.strip(),
        correo=encrypt_data(user_data.correo),
        cedula=encrypt_data(user_data.cedula),
        telefono=encrypt_data(user_data.telefono) if user_data.telefono else None,
        direccion=encrypt_data(user_data.direccion) if user_data.direccion else None,
        numtarjeta=encrypt_data(user_data.numtarjeta) if user_data.numtarjeta else None,
        rol=user_data.rol or "cliente",
        activo=True,
        fecha_registro=datetime.now()
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return user_secure_to_response(new_user)
    except Exception as e:
        db.rollback()
        print(f"Error al crear usuario seguro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear usuario seguro"
        )

# ============================================================
# LISTAR USUARIOS SEGUROS
# ============================================================
@router.get("", response_model=List[UserSecureResponse])
def listar_usuarios_seguros(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Lista todos los usuarios seguros
    Solo accesible para administradores
    """
    if payload.get("rol") != "ADMINISTRADOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para listar usuarios"
        )

    query = db.query(UsuarioSeguro)

    if search:
        query = query.filter(UsuarioSeguro.usuario.ilike(f"%{search}%"))

    users = query.offset(skip).limit(limit).all()
    return [user_secure_to_response(u) for u in users]

# ============================================================
# OBTENER USUARIO POR ID
# ============================================================
@router.get("/{user_id}", response_model=UserSecureResponse)
def obtener_usuario_seguro(
    user_id: int,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene un usuario seguro por ID
    Admin o el mismo usuario pueden acceder
    """
    user = db.query(UsuarioSeguro).filter(UsuarioSeguro.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if payload.get("rol") != "ADMINISTRADOR" and payload.get("sub") != user.usuario:
        raise HTTPException(status_code=403, detail="Acceso no autorizado")

    return user_secure_to_response(user)
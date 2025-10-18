# routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas.user import UserLogin
from models.user import UsuarioSistema
from db.session import SessionLocal
from security.jwt import create_access_token, verify_token
from security.password import verify_password
import base64

router = APIRouter(tags=["auth"])

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

# ========================================
# LOGIN - ACTUALIZADO CON BCRYPT
# ========================================
@router.post("/login", response_model=dict)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Inicia sesión con usuario y contraseña
    Ahora verifica contraseñas cifradas con bcrypt
    """
    # Buscar usuario por nombre de usuario
    db_user = db.query(UsuarioSistema).filter(
        UsuarioSistema.usuario == user.username.strip().lower()
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    # Verificar contraseña usando bcrypt
    if not verify_password(user.password.strip(), db_user.clave):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    # Verificar si el usuario está activo (si el campo existe)
    if hasattr(db_user, 'activo') and not db_user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacte al administrador"
        )

    # Procesar la foto del usuario
    foto_url = process_user_photo(db_user.foto) if hasattr(db_user, 'foto') and db_user.foto else None

    # Crear el token de acceso
    token_data = {
        "sub": db_user.usuario,
        "rol": db_user.rol,
        "nombres": db_user.nombres
    }

    access_token = create_access_token(data=token_data)

    return {
        "success": True,
        "message": "Inicio de sesión exitoso",
        "data": {
            "token": access_token,
            "user": {
                "cod_usuario_sistema": db_user.cod_usuario_sistema,
                "usuario": db_user.usuario,
                "nombres": db_user.nombres,
                "apellidos": db_user.apellidos,
                "nombre_completo": f"{db_user.nombres} {db_user.apellidos}",
                "rol": db_user.rol,
                "correo": db_user.correo,
                "foto": foto_url
            }
        }
    }

# ========================================
# VERIFICAR SESIÓN
# ========================================
@router.get("/verify-session")
def verify_session(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Verifica que el token sea válido y devuelve datos del usuario"""
    db_user = db.query(UsuarioSistema).filter(
        UsuarioSistema.usuario == payload["sub"]
    ).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    # Verificar si está activo
    if hasattr(db_user, 'activo') and not db_user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    foto_url = process_user_photo(db_user.foto) if hasattr(db_user, 'foto') and db_user.foto else None
    
    return {
        "cod_usuario_sistema": db_user.cod_usuario_sistema,
        "usuario": db_user.usuario,
        "nombres": db_user.nombres,
        "apellidos": db_user.apellidos,
        "nombre_completo": f"{db_user.nombres} {db_user.apellidos}",
        "correo": db_user.correo,
        "rol": db_user.rol,
        "fecha_registro": db_user.fecha_registro.isoformat() if db_user.fecha_registro else None,
        "foto": foto_url
    }

# ========================================
# OBTENER PERFIL
# ========================================
@router.get("/profile")
def get_profile(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Obtiene el perfil completo del usuario autenticado"""
    db_user = db.query(UsuarioSistema).filter(
        UsuarioSistema.usuario == payload["sub"]
    ).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    foto_url = process_user_photo(db_user.foto) if hasattr(db_user, 'foto') and db_user.foto else None
    
    return {
        "cod_usuario_sistema": db_user.cod_usuario_sistema,
        "usuario": db_user.usuario,
        "nombres": db_user.nombres,
        "apellidos": db_user.apellidos,
        "nombre_completo": f"{db_user.nombres} {db_user.apellidos}",
        "cedula": db_user.cedula,
        "correo": db_user.correo,
        "telefono": getattr(db_user, 'telefono', None),
        "direccion": getattr(db_user, 'direccion', None),
        "rol": db_user.rol,
        "activo": getattr(db_user, 'activo', True),
        "fecha_registro": db_user.fecha_registro.isoformat() if db_user.fecha_registro else None,
        "foto": foto_url
    }

# ========================================
# LOGOUT
# ========================================
@router.post("/logout")
def logout():
    """
    Cierra sesión del usuario
    Con JWT no hay sesión en el servidor, el frontend debe eliminar el token
    """
    return {
        "success": True,
        "message": "Sesión cerrada exitosamente"
    }

# ========================================
# HEALTH CHECK
# ========================================
@router.get("/health")
def health_check():
    """Verifica que el servidor esté funcionando"""
    return {
        "success": True,
        "status": "healthy",
        "message": "Servidor API funcionando correctamente"
    }
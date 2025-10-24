# schemas/user_secure.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

# ========================================
# SCHEMA PARA CREAR USUARIO SEGURO
# ========================================
class UserSecureCreate(BaseModel):
    usuario: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario único")
    nombres: str = Field(..., min_length=2, max_length=100, description="Nombres del usuario")
    apellidos: str = Field(..., min_length=2, max_length=100, description="Apellidos del usuario")
    
    # Campos que serán encriptados
    cedula: str = Field(..., min_length=10, max_length=13, description="Cédula (será encriptada)")
    email: EmailStr = Field(..., description="email electrónico (será encriptado)")
    telefono: Optional[str] = Field(None, min_length=7, max_length=15, description="Teléfono (será encriptado)")
    direccion: Optional[str] = Field(None, max_length=500, description="Dirección (será encriptada)")
    numtarjeta: Optional[str] = Field(None, min_length=13, max_length=19, description="Número de tarjeta (será encriptado)")
    
    rol: str = Field(default="cliente", description="Rol del usuario")
    activo: bool = Field(default=True, description="Estado del usuario")
    
    @validator('rol')
    def validate_rol(cls, v):
        allowed_roles = ['admin', 'cliente', 'operador', 'administrador', 'CLIENTE', 'OPERADOR']
        if v not in allowed_roles:
            raise ValueError(f'El rol debe ser uno de: {", ".join(allowed_roles)}')
        return v
    
    @validator('cedula')
    def validate_cedula(cls, v):
        # Remover espacios y guiones
        v = v.replace(' ', '').replace('-', '')
        if not v.isdigit():
            raise ValueError('La cédula debe contener solo números')
        if len(v) < 10:
            raise ValueError('La cédula debe tener al menos 10 dígitos')
        return v
    
    @validator('numtarjeta')
    def validate_numtarjeta(cls, v):
        if v is None:
            return v
        # Remover espacios y guiones
        v = v.replace(' ', '').replace('-', '')
        if not v.isdigit():
            raise ValueError('El número de tarjeta debe contener solo números')
        if len(v) < 13 or len(v) > 19:
            raise ValueError('El número de tarjeta debe tener entre 13 y 19 dígitos')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "usuario": "jperez",
                "nombres": "Juan",
                "apellidos": "Pérez García",
                "cedula": "1234567890",
                "email": "juan.perez@ejemplo.com",
                "telefono": "0987654321",
                "direccion": "Av. Principal 123, Riobamba",
                "numtarjeta": "1234567890123456",
                "rol": "cliente",
                "activo": True
            }
        }


# ========================================
# SCHEMA PARA ACTUALIZAR USUARIO SEGURO
# ========================================
class UserSecureUpdate(BaseModel):
    usuario: Optional[str] = Field(None, min_length=3, max_length=50)
    nombres: Optional[str] = Field(None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, min_length=2, max_length=100)
    
    # Campos que serán encriptados
    cedula: Optional[str] = Field(None, min_length=10, max_length=13)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, min_length=7, max_length=15)
    direccion: Optional[str] = Field(None, max_length=500)
    numtarjeta: Optional[str] = Field(None, min_length=13, max_length=19)
    
    rol: Optional[str] = None
    activo: Optional[bool] = None
    
    @validator('rol')
    def validate_rol(cls, v):
        if v is None:
            return v
        allowed_roles = ['admin', 'cliente', 'operador', 'administrador', 'CLIENTE', 'OPERADOR']
        if v not in allowed_roles:
            raise ValueError(f'El rol debe ser uno de: {", ".join(allowed_roles)}')
        return v
    
    @validator('cedula')
    def validate_cedula(cls, v):
        if v is None:
            return v
        v = v.replace(' ', '').replace('-', '')
        if not v.isdigit():
            raise ValueError('La cédula debe contener solo números')
        if len(v) < 10:
            raise ValueError('La cédula debe tener al menos 10 dígitos')
        return v
    
    @validator('numtarjeta')
    def validate_numtarjeta(cls, v):
        if v is None:
            return v
        v = v.replace(' ', '').replace('-', '')
        if not v.isdigit():
            raise ValueError('El número de tarjeta debe contener solo números')
        if len(v) < 13 or len(v) > 19:
            raise ValueError('El número de tarjeta debe tener entre 13 y 19 dígitos')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "nombres": "Juan Carlos",
                "telefono": "0998765432",
                "direccion": "Nueva dirección 456",
                "activo": True
            }
        }


# ========================================
# SCHEMA PARA RESPUESTA DE USUARIO SEGURO
# ========================================
class UserSecureResponse(BaseModel):
    id: int
    usuario: str
    nombres: str
    apellidos: str
    
    # Datos desencriptados (se muestran al usuario autorizado)
    cedula: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    numtarjeta: Optional[str] = None
    
    rol: str
    activo: bool
    fecha_registro: Optional[datetime] = None
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": 1,
                "usuario": "jperez",
                "nombres": "Juan",
                "apellidos": "Pérez García",
                "cedula": "1234567890",
                "email": "juan.perez@ejemplo.com",
                "telefono": "0987654321",
                "direccion": "Av. Principal 123, Riobamba",
                "numtarjeta": "1234567890123456",
                "rol": "cliente",
                "activo": True,
                "fecha_registro": "2025-01-15T10:30:00"
            }
        }


# ========================================
# SCHEMA PARA LISTA DE USUARIOS SEGUROS
# ========================================
class UserSecureListResponse(BaseModel):
    id: int
    usuario: str
    nombres: str
    apellidos: str
    
    # Datos sensibles enmascarados en listados
    cedula: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    numtarjeta: Optional[str] = None
    
    rol: str
    activo: bool
    fecha_registro: Optional[datetime] = None
    
    class Config:
        orm_mode = True
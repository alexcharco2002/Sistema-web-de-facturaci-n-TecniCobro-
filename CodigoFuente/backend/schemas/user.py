# schemas/user.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime, date


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    usuario: str
    nombres: str
    apellidos: str
    rol: str
    email: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_password_length(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v


# ========================================
# SCHEMAS DE CREACIÓN (SIN usuario ni clave)
# ========================================
class UserCreate(BaseModel):
    """
    Schema para crear usuario - El backend genera automáticamente:
    - usuario: basado en los nombres (en minúsculas)
    - clave: la cédula completa
    """
    nombres: str
    apellidos: str
    sexo: str  # 'M' o 'F' - OBLIGATORIO
    fecha_nac: date  # OBLIGATORIO
    cedula: str
    email: EmailStr
    telefono: Optional[str] = None
    direccion: Optional[str] = "Sanjapamba"
    rol: str = "cliente"
    activo: bool = True
    
    @validator('nombres', 'apellidos')
    def validate_nombres(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError('El nombre debe tener al menos 2 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre es demasiado largo')
        if not all(c.isalpha() or c.isspace() for c in v):
            raise ValueError('El nombre solo puede contener letras y espacios')
        return v.title()
    
    @validator('sexo')
    def validate_sexo(cls, v):
        v = v.strip().upper()
        if v not in ['M', 'F']:
            raise ValueError('El sexo debe ser M (Masculino) o F (Femenino)')
        return v
    
    @validator('fecha_nac')
    def validate_fecha_nac(cls, v):
        if not v:
            raise ValueError('La fecha de nacimiento es obligatoria')
        
        # Calcular edad
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        
        if age < 0:
            raise ValueError('La fecha de nacimiento no puede ser futura')
        if age < 10:
            raise ValueError('El usuario debe tener al menos 10 años')
        if age > 120:
            raise ValueError('La fecha de nacimiento no es válida')
        
        return v
    
    @validator('cedula')
    def validate_cedula(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('La cédula es requerida')
        if len(v) < 8 or len(v) > 15:
            raise ValueError('La cédula debe tener entre 8 y 15 caracteres')
        # Aceptar solo números y guiones
        if not v.replace('-', '').isdigit():
            raise ValueError('La cédula solo puede contener números y guiones')
        return v
    
    @validator('rol')
    def validate_rol(cls, v):
        roles_validos = ['cliente', 'lector', 'cajero', 'administrador']
        if v not in roles_validos:
            raise ValueError(f'El rol debe ser uno de: {", ".join(roles_validos)}')
        return v
    
    @validator('telefono')
    def validate_telefono(cls, v):
        if v:
            v = v.strip()
            clean_phone = v.replace(' ', '').replace('-', '').replace('+', '')
            if not clean_phone.isdigit():
                raise ValueError('El teléfono solo puede contener números, espacios, guiones y el símbolo +')
            if len(clean_phone) < 7 or len(clean_phone) > 15:
                raise ValueError('El teléfono debe tener entre 7 y 15 dígitos')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombres": "Juan Carlos",
                "apellidos": "Pérez González",
                "sexo": "M",
                "fecha_nac": "1990-05-15",
                "cedula": "1234567890",
                "email": "juan.perez@example.com",
                "telefono": "0987654321",
                "direccion": "Sanjapamba",
                "rol": "cliente",
                "activo": True
            }
        }


# ========================================
# SCHEMAS DE ACTUALIZACIÓN
# ========================================
class UserUpdate(BaseModel):
    usuario: Optional[str] = None
    clave: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    sexo: Optional[str] = None
    fecha_nac: Optional[date] = None
    cedula: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    
    @validator('usuario')
    def validate_usuario(cls, v):
        if v:
            v = v.strip()
            if len(v) < 3:
                raise ValueError('El usuario debe tener al menos 3 caracteres')
            if len(v) > 50:
                raise ValueError('El usuario no puede exceder 50 caracteres')
            if not v.replace('_', '').replace('.', '').isalnum():
                raise ValueError('El usuario solo puede contener letras, números, puntos y guiones bajos')
            return v.lower()
        return v
    
    @validator('clave')
    def validate_clave(cls, v):
        if v:
            if len(v) < 6:
                raise ValueError('La contraseña debe tener al menos 6 caracteres')
            if len(v) > 100:
                raise ValueError('La contraseña es demasiado larga')
        return v
    
    @validator('nombres', 'apellidos')
    def validate_nombres(cls, v):
        if v:
            v = v.strip()
            if len(v) < 2:
                raise ValueError('El nombre debe tener al menos 2 caracteres')
            if len(v) > 100:
                raise ValueError('El nombre es demasiado largo')
            if not all(c.isalpha() or c.isspace() for c in v):
                raise ValueError('El nombre solo puede contener letras y espacios')
            return v.title()
        return v
    
    @validator('sexo')
    def validate_sexo(cls, v):
        if v:
            v = v.strip().upper()
            if v not in ['M', 'F']:
                raise ValueError('El sexo debe ser M o F')
            return v
        return v
    
    @validator('cedula')
    def validate_cedula(cls, v):
        if v:
            v = v.strip()
            if len(v) < 8 or len(v) > 15:
                raise ValueError('La cédula debe tener entre 8 y 15 caracteres')
            if not v.replace('-', '').isdigit():
                raise ValueError('La cédula solo puede contener números y guiones')
        return v
    
    @validator('rol')
    def validate_rol(cls, v):
        if v:
            roles_validos = ['cliente', 'lector', 'cajero', 'administrador']
            if v not in roles_validos:
                raise ValueError(f'El rol debe ser uno de: {", ".join(roles_validos)}')
        return v
    
    @validator('telefono')
    def validate_telefono(cls, v):
        if v:
            v = v.strip()
            clean_phone = v.replace(' ', '').replace('-', '').replace('+', '')
            if not clean_phone.isdigit():
                raise ValueError('El teléfono solo puede contener números, espacios, guiones y el símbolo +')
            if len(clean_phone) < 7 or len(clean_phone) > 15:
                raise ValueError('El teléfono debe tener entre 7 y 15 dígitos')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombres": "Juan Carlos",
                "apellidos": "Pérez González",
                "sexo": "M",
                "email": "jperez_nuevo@example.com",
                "telefono": "0987654322",
                "direccion": "Av. Nueva 456",
                "activo": True
            }
        }


# ========================================
# SCHEMAS DE RESPUESTA
# ========================================
class UserResponse(BaseModel):
    id: int
    usuario: str
    nombres: str
    apellidos: str
    sexo: Optional[str] = None
    fecha_nac: Optional[date] = None
    cedula: str
    email: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    rol: str
    activo: bool
    fecha_registro: Optional[str] = None
    ultimo_acceso: Optional[datetime] = None
    foto: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.strftime("%Y-%m-%d") if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }
        json_schema_extra = {
            "example": {
                "id": 1,
                "usuario": "juancarlos",
                "nombres": "Juan Carlos",
                "apellidos": "Pérez González",
                "sexo": "M",
                "fecha_nac": "1990-05-15",
                "cedula": "1234567890",
                "email": "juan.perez@example.com",
                "telefono": "0987654321",
                "direccion": "Sanjapamba",
                "rol": "cliente",
                "activo": True,
                "fecha_registro": "2024-01-15T10:30:00",
                "ultimo_acceso": "2024-01-20T15:45:00",
                "foto": "data:image/jpeg;base64,..."
            }
        }


class UserListResponse(BaseModel):
    id: int
    usuario: str
    nombres: str
    apellidos: str
    sexo: Optional[str] = None
    fecha_nac: Optional[date] = None
    email: str
    cedula: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    rol: str
    activo: bool
    fecha_registro: Optional[datetime] = None
    foto: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.strftime("%Y-%m-%d") if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }
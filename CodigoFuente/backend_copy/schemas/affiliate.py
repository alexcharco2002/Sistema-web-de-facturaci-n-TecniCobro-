# ============================================================================
# schemas/affiliate.py
# ============================================================================
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import date

class AffiliateBase(BaseModel):
    """Schema base para afiliados"""
    id_sector: int = Field(..., description="ID del sector")
    activo: bool = Field(default=True, description="Estado del afiliado")

class AffiliateCreate(AffiliateBase):
    """Schema para crear un afiliado"""
    id_usuario_sistema: int = Field(..., description="ID del usuario del sistema a afiliar")

class AffiliateUpdate(BaseModel):
    """Schema para actualizar un afiliado"""
    id_sector: Optional[int] = Field(None, description="ID del sector")
    activo: Optional[bool] = Field(None, description="Estado del afiliado")

class AffiliateResponse(BaseModel):
    """Schema de respuesta para afiliados"""
    id_usuario_afi: int
    cod_usuario_afi: int
    fecha_afiliacion: Optional[date]
    id_sector: int
    id_usuario_sistema: int
    activo: bool
    
    class Config:
        from_attributes = True

class UserInfoSimple(BaseModel):
    """Información básica del usuario"""
    id: int
    usuario: str
    nombres: str
    apellidos: str
    cedula: str
    email: str
    telefono: Optional[str]
    direccion: Optional[str]
    activo: bool

class SectorInfoSimple(BaseModel):
    """Información básica del sector"""
    id_sector: int
    nombre_sector: str
    descripcion: Optional[str]
    activo: bool

class AffiliateWithUserInfo(BaseModel):
    """Schema completo con información del usuario y sector"""
    id_usuario_afi: int
    cod_usuario_afi: int
    fecha_afiliacion: Optional[date]
    id_sector: int
    id_usuario_sistema: int
    activo: bool
    usuario: Optional[UserInfoSimple]
    sector: Optional[SectorInfoSimple]
    
    class Config:
        from_attributes = True
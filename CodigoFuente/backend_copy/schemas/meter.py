# schemas/meter.py
from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

# ========================================
# SCHEMAS AUXILIARES (para relaciones)
# ========================================
class UsuarioAfiliadoInfo(BaseModel):
    """Información básica del usuario afiliado"""
    id_usuario_afi: int
    cod_usuario_afi: int
    fecha_afiliacion: Optional[datetime] = None
    id_sector: Optional[int] = None
    
    class Config:
        from_attributes = True


class SectorInfo(BaseModel):
    """Información básica del sector"""
    id_sector: int
    nombre_sector: Optional[str] = None
    
    class Config:
        from_attributes = True


# ========================================
# SCHEMAS BASE PARA MEDIDORES
# ========================================
class MedidorBase(BaseModel):
    num_medidor: str = Field(..., min_length=1, max_length=50, description="Número del medidor")
    latitud: Optional[Decimal] = Field(None, ge=-90, le=90, description="Latitud entre -90 y 90")
    longitud: Optional[Decimal] = Field(None, ge=-180, le=180, description="Longitud entre -180 y 180")
    altitud: Optional[Decimal] = Field(None, description="Altitud en metros")
    id_usuario_afi: Optional[int] = Field(None, description="ID del usuario afiliado")
    id_sector: Optional[int] = Field(None, description="ID del sector")
    activo: bool = True

    @validator('num_medidor')
    def validate_num_medidor(cls, v):
        if not v or not v.strip():
            raise ValueError('El número de medidor no puede estar vacío')
        return v.strip()


class MedidorCreate(MedidorBase):
    """Schema para crear un medidor"""
    pass


class MedidorUpdate(BaseModel):
    """Schema para actualizar un medidor (todos los campos opcionales)"""
    num_medidor: Optional[str] = Field(None, min_length=1, max_length=50)
    latitud: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitud: Optional[Decimal] = Field(None, ge=-180, le=180)
    altitud: Optional[Decimal] = None
    id_usuario_afi: Optional[int] = None
    id_sector: Optional[int] = None
    activo: Optional[bool] = None

    @validator('num_medidor')
    def validate_num_medidor(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('El número de medidor no puede estar vacío')
        return v.strip() if v else v


class MedidorResponse(MedidorBase):
    """Schema de respuesta básica del medidor"""
    id_medidor: int
    
    class Config:
        from_attributes = True


class MedidorCompleto(MedidorResponse):
    """Schema completo del medidor con relaciones"""
    usuario_afiliado: Optional[UsuarioAfiliadoInfo] = None
    sector: Optional[SectorInfo] = None
    
    class Config:
        from_attributes = True


# ========================================
# SCHEMAS PARA FILTROS Y CONSULTAS
# ========================================
class MedidorFiltros(BaseModel):
    """Filtros para búsqueda de medidores"""
    search: Optional[str] = Field(None, description="Búsqueda por número de medidor")
    id_sector: Optional[int] = Field(None, description="Filtrar por sector")
    activo: Optional[bool] = Field(None, description="Filtrar por estado activo/inactivo")
    asignado: Optional[bool] = Field(None, description="Filtrar por medidores asignados/sin asignar")
    skip: int = Field(0, ge=0, description="Registros a saltar (paginación)")
    limit: int = Field(100, ge=1, le=500, description="Límite de registros")


class MedidorStats(BaseModel):
    """Estadísticas de medidores"""
    total: int = 0
    activos: int = 0
    inactivos: int = 0
    asignados: int = 0
    sin_asignar: int = 0
    por_sector: dict = {}
    
    class Config:
        from_attributes = True


# ========================================
# SCHEMAS PARA AFILIADOS DISPONIBLES
# ========================================
class AfiliadoDisponible(BaseModel):
    """Afiliado sin medidor asignado"""
    id_usuario_afi: int
    cod_usuario_afi: int
    nombre_afiliado: Optional[str] = None
    fecha_afiliacion: Optional[datetime] = None
    id_sector: Optional[int] = None
    nombre_sector: Optional[str] = None
    
    class Config:
        from_attributes = True
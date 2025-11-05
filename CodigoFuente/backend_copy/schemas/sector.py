# schemas/sector.py
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class SectorBase(BaseModel):
    nombre_sector: str
    descripcion: Optional[str] = None
    activo: bool = True
    
    @field_validator('nombre_sector')
    @classmethod
    def validate_nombre_sector(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('El nombre del sector debe tener al menos 3 caracteres')
        return v.strip()

class SectorCreate(SectorBase):
    """Schema para crear un nuevo sector"""
    pass

class SectorUpdate(BaseModel):
    """Schema para actualizar un sector"""
    nombre_sector: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None
    
    @field_validator('nombre_sector')
    @classmethod
    def validate_nombre_sector(cls, v):
        if v is not None and len(v.strip()) < 3:
            raise ValueError('El nombre del sector debe tener al menos 3 caracteres')
        return v.strip() if v else v

class SectorResponse(SectorBase):
    """Schema de respuesta para un sector"""
    id_sector: int
    
    class Config:
        from_attributes = True
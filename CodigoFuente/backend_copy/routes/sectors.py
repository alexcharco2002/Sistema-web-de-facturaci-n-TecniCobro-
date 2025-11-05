# routes/sectors.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from models.sector import Sector
from models.user import UsuarioSistema
from models.role import Rol
from schemas.sector import SectorCreate, SectorUpdate, SectorResponse
from db.session import SessionLocal
from security.jwt import verify_token

router = APIRouter(prefix="/sectors", tags=["sectors"])

def get_db():
    """Dependencia para obtener la sesión de base de datos"""
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
# CRUD SECTORES
# ========================================

@router.get("/", response_model=List[SectorResponse])
def listar_sectores(
    search: Optional[str] = Query(None, description="Buscar por nombre o descripción"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Lista todos los sectores con filtros opcionales
    """
    query = db.query(Sector)
    
    # Filtro de búsqueda
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Sector.nombre_sector.ilike(search_filter)) |
            (Sector.descripcion.ilike(search_filter))
        )
    
    # Filtro por estado
    if activo is not None:
        query = query.filter(Sector.activo == activo)
    
    # Ordenar por nombre
    query = query.order_by(Sector.nombre_sector)
    
    # Paginación
    sectores = query.offset(skip).limit(limit).all()
    
    return sectores

@router.get("/{id_sector}", response_model=SectorResponse)
def obtener_sector(
    id_sector: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Obtiene un sector específico por ID
    """
    sector = db.query(Sector).filter(Sector.id_sector == id_sector).first()
    
    if not sector:
        raise HTTPException(
            status_code=404,
            detail="Sector no encontrado"
        )
    
    return sector

@router.post("/", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def crear_sector(
    sector: SectorCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Crea un nuevo sector - Solo admin
    """
    verificar_es_admin(payload, db)
    
    # Verificar que no exista un sector con el mismo nombre
    existe = db.query(Sector).filter(
        Sector.nombre_sector == sector.nombre_sector
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un sector con el nombre '{sector.nombre_sector}'"
        )
    
    # Crear nuevo sector
    nuevo_sector = Sector(**sector.model_dump())
    db.add(nuevo_sector)
    db.commit()
    db.refresh(nuevo_sector)
    
    return nuevo_sector

@router.put("/{id_sector}", response_model=SectorResponse)
def actualizar_sector(
    id_sector: int,
    sector_update: SectorUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Actualiza un sector existente - Solo admin
    """
    verificar_es_admin(payload, db)
    
    # Buscar el sector
    sector = db.query(Sector).filter(Sector.id_sector == id_sector).first()
    
    if not sector:
        raise HTTPException(
            status_code=404,
            detail="Sector no encontrado"
        )
    
    # Validar duplicado solo si el nombre cambia
    if sector_update.nombre_sector and sector_update.nombre_sector != sector.nombre_sector:
        existe = db.query(Sector).filter(
            Sector.nombre_sector == sector_update.nombre_sector,
            Sector.id_sector != id_sector
        ).first()
        
        if existe:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe otro sector con el nombre '{sector_update.nombre_sector}'"
            )
    
    # Actualizar solo los campos enviados
    update_data = sector_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sector, key, value)
    
    db.commit()
    db.refresh(sector)
    
    return sector

@router.delete("/{id_sector}")
def eliminar_sector(
    id_sector: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Desactiva un sector (soft delete) - Solo admin
    
    Si necesitas verificar que no haya medidores asociados antes de eliminar,
    descomenta el bloque de verificación
    """
    verificar_es_admin(payload, db)
    
    sector = db.query(Sector).filter(Sector.id_sector == id_sector).first()
    
    if not sector:
        raise HTTPException(
            status_code=404,
            detail="Sector no encontrado"
        )
    
    # ⚠️ OPCIONAL: Descomentar si tienes tabla de medidores relacionada
    # from models.medidor import Medidor
    # medidores_en_sector = db.query(Medidor).filter(
    #     Medidor.id_sector == id_sector
    # ).count()
    # 
    # if medidores_en_sector > 0:
    #     raise HTTPException(
    #         status_code=400,
    #         detail=f"No se puede eliminar el sector. Hay {medidores_en_sector} medidor(es) en este sector"
    #     )
    
    # Soft delete: desactivar en lugar de eliminar
    sector.activo = False
    db.commit()
    
    return {
        "success": True,
        "message": "Sector desactivado correctamente"
    }

@router.patch("/{id_sector}/toggle-status", response_model=SectorResponse)
def toggle_sector_status(
    id_sector: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Activa/Desactiva un sector - Solo admin
    """
    verificar_es_admin(payload, db)
    
    sector = db.query(Sector).filter(Sector.id_sector == id_sector).first()
    
    if not sector:
        raise HTTPException(
            status_code=404,
            detail="Sector no encontrado"
        )
    
    # Toggle del estado
    sector.activo = not sector.activo
    db.commit()
    db.refresh(sector)
    
    return sector

# ========================================
# ENDPOINTS ADICIONALES (OPCIONAL)
# ========================================

@router.get("/stats/count")
def obtener_estadisticas_sectores(
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token)
):
    """
    Obtiene estadísticas de sectores
    """
    total = db.query(Sector).count()
    activos = db.query(Sector).filter(Sector.activo == True).count()
    inactivos = db.query(Sector).filter(Sector.activo == False).count()
    
    return {
        "total": total,
        "activos": activos,
        "inactivos": inactivos
    }
# models/medidor.py
from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from db.session import Base


class Medidor(Base):
    __tablename__ = "t_medidor"
    __table_args__ = {"schema": "medidores"}

    # Campos principales
    id_medidor = Column(Integer, primary_key=True, index=True)
    num_medidor = Column(String(50), nullable=False)
    latitud = Column(Numeric(10, 2), nullable=True)
    longitud = Column(Numeric(10, 2), nullable=True)
    altitud = Column(Numeric(10, 2), nullable=True)
    activo = Column(Boolean, default=True)

    # 🔗 Relaciones foráneas
    id_usuario_afi = Column(Integer, ForeignKey("usuarios.t_usuario_afiliado.id_usuario_afi"), unique=True, nullable=True)
    id_sector = Column(Integer, ForeignKey("medidores.t_sector.id_sector"), nullable=True)

    # Relaciones ORM
    usuario_afiliado = relationship("UsuarioAfiliado", backref="medidor", lazy="joined") # relación con t_usuario_afiliado
    sector = relationship("Sector", backref="medidores", lazy="joined") # relación con t_sector

    def __repr__(self):
        return f"<Medidor id={self.id_medidor}, num_medidor={self.num_medidor}, usuario_afi={self.id_usuario_afi}, sector={self.id_sector}>"

    def to_dict(self):
        """Convierte el objeto a un diccionario legible"""
        return {
            "id_medidor": self.id_medidor,
            "num_medidor": self.num_medidor,
            "latitud": float(self.latitud) if self.latitud is not None else None,
            "longitud": float(self.longitud) if self.longitud is not None else None,
            "altitud": float(self.altitud) if self.altitud is not None else None,
            "activo": self.activo,
            "id_usuario_afi": self.id_usuario_afi,
            "id_sector": self.id_sector,
            "usuario_afiliado": {
                "id_usuario_afi": self.usuario_afiliado.id_usuario_afi,
                "cod_usuario_afi": self.usuario_afiliado.cod_usuario_afi,
                "fecha_afiliacion": self.usuario_afiliado.fecha_afiliacion.strftime("%Y-%m-%d")
                if self.usuario_afiliado and self.usuario_afiliado.fecha_afiliacion
                else None,
                "id_sector": self.usuario_afiliado.id_sector,
            } if self.usuario_afiliado else None,
            "sector": {
                "id_sector": self.sector.id_sector,
                "nombre_sector": getattr(self.sector, "nombre_sector", None)
            } if self.sector else None
        }

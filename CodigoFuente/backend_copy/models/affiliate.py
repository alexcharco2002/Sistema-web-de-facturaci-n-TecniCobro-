# models/usuario_afiliado.py
from sqlalchemy import Column, Integer, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from db.session import Base

class UsuarioAfiliado(Base):
    __tablename__ = "t_usuario_afiliado"
    __table_args__ = {"schema": "usuarios"}

    # Campos principales
    id_usuario_afi = Column(Integer, primary_key=True, index=True)
    fecha_afiliacion = Column(Date, nullable=True)
    activo = Column(Boolean, default=True)
    cod_usuario_afi = Column(Integer, nullable=False)
    
    # 🔗 Relaciones foráneas
    id_sector = Column(Integer, ForeignKey("medidores.t_sector.id_sector"), nullable=False)
    id_usuario_sistema = Column(Integer, ForeignKey("usuarios.t_usuario_sistema.id_usuario_sistema"), nullable=False)
    
    

    # Relaciones ORM
    usuario_sistema = relationship("UsuarioSistema", backref="afiliaciones", lazy="joined")
    sector = relationship("Sector", backref="afiliados", lazy="joined")  # relación con t_sector

    def __repr__(self):
        return f"<UsuarioAfiliado cod={self.cod_usuario_afi}, usuario_id={self.id_usuario_sistema}, sector_id={self.id_sector}>"

    def to_dict(self):
        """Convierte el objeto a un diccionario legible"""
        return {
            "id_usuario_afi": self.id_usuario_afi,
            "fecha_afiliacion": self.fecha_afiliacion.strftime("%Y-%m-%d") if self.fecha_afiliacion else None,
            "id_sector": self.id_sector,
            "id_usuario_sistema": self.id_usuario_sistema,
            "activo": self.activo,
            "cod_usuario_afi": self.cod_usuario_afi,
            "usuario": {
                "id": self.usuario_sistema.id_usuario_sistema,
                "usuario": self.usuario_sistema.usuario,
                "nombres": self.usuario_sistema.nombres,
                "apellidos": self.usuario_sistema.apellidos,
                "email": self.usuario_sistema.email,
            } if self.usuario_sistema else None,
            "sector": {
                "id_sector": self.sector.id_sector,
                "nombre_sector": getattr(self.sector, "nombre_sector", None)
            } if self.sector else None
        }

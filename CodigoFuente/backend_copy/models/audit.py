# models/audit.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.session import Base

class AuditoriaSistema(Base):
    """
    Modelo para registrar todas las acciones realizadas en el sistema
    """
    __tablename__ = "t_auditoria_sistema"
    __table_args__ = {"schema": "auditoria"}
    
    id_auditoria_sistema = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, server_default=func.now(), nullable=False)
    accion = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    descripcion = Column(String(500), nullable=False)
    id_usuario_sistema = Column(Integer, ForeignKey('usuarios.t_usuario_sistema.id_usuario_sistema'), nullable=True)
    
    def __repr__(self):
        return f"<Auditoria {self.accion} - {self.fecha}>"
    
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            "id": self.id_auditoria_sistema,
            "fecha": self.fecha.isoformat() if self.fecha else None,
            "accion": self.accion,
            "descripcion": self.descripcion,
            "usuario_id": self.id_usuario_sistema
        }
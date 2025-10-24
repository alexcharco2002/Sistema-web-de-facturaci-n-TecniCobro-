# models/user_secure.py
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.sql import func
from db.session import Base

class UsuarioSeguro(Base):
    """
    Modelo de Usuario Seguro con datos encriptados
    Los campos sensibles se almacenan como TEXT encriptado con AES-256
    """
    __tablename__ = "t_usuario_seguro"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario = Column(String(50), unique=True, nullable=False, index=True)
    
    # Datos encriptados (tipo TEXT)
    email = Column(Text, nullable=False, comment="email encriptado con AES-256")
    cedula = Column(Text, nullable=False, comment="Cédula encriptada con AES-256")
    telefono = Column(Text, nullable=True, comment="Teléfono encriptado con AES-256")
    direccion = Column(Text, nullable=True, comment="Dirección encriptada con AES-256")
    numtarjeta = Column(Text, nullable=True, comment="Número de tarjeta encriptado con AES-256")
    
    # Datos no encriptados
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    rol = Column(String(20), nullable=False, default='cliente', index=True)
    
    # Campos de auditoría
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    activo = Column(Boolean, default=True, index=True)
    
    def __repr__(self):
        return f"<UsuarioSeguro(id={self.id}, usuario='{self.usuario}', rol='{self.rol}')>"
    
    class Config:
        orm_mode = True
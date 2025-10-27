# models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, LargeBinary, Date
from sqlalchemy.sql import func
from db.session import Base

class UsuarioSistema(Base):
    __tablename__ = "t_usuario_sistema"
    __table_args__ = {"schema": "usuarios"}  # <-- aquí va el esquema
    
    # Campos originales
    cod_usuario_sistema = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(50), unique=True, nullable=False, index=True)
    clave = Column(String(255), nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    cedula = Column(String(15), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    telefono = Column(String(20), nullable=True)
    direccion = Column(String(255), nullable=True)
    rol = Column(String(20), nullable=False, default='cliente')
    activo = Column(Boolean, default=True)
    sexo = Column(String(1), nullable=True)
    fecha_nac = Column(Date, nullable=True)
    fecha_registro = Column(DateTime, server_default=func.now())
    ultimo_acceso = Column(DateTime, nullable=True)
    foto = Column(LargeBinary, nullable=True)
    
    # Nuevos campos para control de intentos fallidos y bloqueos
    intentos_fallidos = Column(Integer, default=0)
    bloqueado_hasta = Column(DateTime, nullable=True)
    bloqueado_permanente = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<Usuario {self.usuario} - {self.rol}>"
    
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            "cod_usuario_sistema": self.cod_usuario_sistema,
            "usuario": self.usuario,
            "nombres": self.nombres,
            "apellidos": self.apellidos,
            "cedula": self.cedula,
            "email": self.email,
            "telefono": self.telefono,
            "direccion": self.direccion,
            "rol": self.rol,
            "activo": self.activo,
            "sexo": self.sexo,
            "fecha_nac": self.fecha_nac.strftime("%Y-%m-%d") if self.fecha_nac else None,
            "fecha_registro": self.fecha_registro.isoformat() if self.fecha_registro else None,
            "ultimo_acceso": self.ultimo_acceso.isoformat() if self.ultimo_acceso else None,
            "intentos_fallidos": self.intentos_fallidos,
            "bloqueado_hasta": self.bloqueado_hasta.isoformat() if self.bloqueado_hasta else None,
            "bloqueado_permanente": self.bloqueado_permanente
        }
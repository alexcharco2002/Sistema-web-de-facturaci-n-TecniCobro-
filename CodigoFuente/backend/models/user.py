#model/user.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from db.session import Base
from datetime import datetime

class UsuarioSistema(Base):
    __tablename__ = "t_usuario_sistema"

    cod_usuario_sistema = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario = Column(String(50), unique=True, nullable=False)
    clave = Column(String(100), nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    cedula = Column(String(15), unique=True, nullable=False)
    correo = Column(String(100), unique=True, nullable=False)
    telefono = Column(String(15), nullable=True)
    direccion = Column(String(255), nullable=True)
    rol = Column(String(20), default="cliente", nullable=False)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    foto = Column(String, nullable=True)

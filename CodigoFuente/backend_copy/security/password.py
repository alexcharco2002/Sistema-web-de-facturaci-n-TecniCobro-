# security/password.py
"""
Módulo de seguridad para el manejo de contraseñas
Usa bcrypt para cifrado robusto
"""

import bcrypt
from typing import Union

def hash_password(password: str) -> str:
    """
    Cifra una contraseña usando bcrypt
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Contraseña cifrada como string
    """
    # Convertir a bytes
    password_bytes = password.encode('utf-8')
    
    # Generar salt y hash
    salt = bcrypt.gensalt(rounds=12)  # 12 rondas es un buen balance
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Retornar como string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña coincide con su hash
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Contraseña cifrada
        
    Returns:
        True si coincide, False si no
    """
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Error verificando contraseña: {e}")
        return False


def is_password_strong(password: str) -> tuple[bool, list[str]]:
    """
    Verifica si una contraseña cumple con los requisitos de seguridad
    
    Args:
        password: Contraseña a verificar
        
    Returns:
        Tupla (es_segura, lista_errores)
    """
    errors = []
    
    # Longitud mínima
    if len(password) < 8:
        errors.append("La contraseña debe tener al menos 8 caracteres")
    
    # Al menos una mayúscula
    if not any(c.isupper() for c in password):
        errors.append("Debe contener al menos una letra mayúscula")
    
    # Al menos una minúscula
    if not any(c.islower() for c in password):
        errors.append("Debe contener al menos una letra minúscula")
    
    # Al menos un número
    if not any(c.isdigit() for c in password):
        errors.append("Debe contener al menos un número")
    
    # Al menos un carácter especial
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        errors.append("Debe contener al menos un carácter especial")
    
    return len(errors) == 0, errors


def generate_temporary_password(length: int = 12) -> str:
    """
    Genera una contraseña temporal segura
    
    Args:
        length: Longitud de la contraseña
        
    Returns:
        Contraseña temporal
    """
    import secrets
    import string
    
    # Asegurar que tenga al menos un carácter de cada tipo
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*")
    ]
    
    # Completar con caracteres aleatorios
    all_chars = string.ascii_letters + string.digits + "!@#$%^&*"
    password += [secrets.choice(all_chars) for _ in range(length - 4)]
    
    # Mezclar
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)
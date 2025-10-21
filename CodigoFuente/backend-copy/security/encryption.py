# security/encryption.py
"""
Módulo de encriptación AES-256-CBC para datos sensibles
Utiliza la librería cryptography para encriptación segura
"""

import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import base64

# Clave de encriptación (debe ser de 32 bytes para AES-256)
# IMPORTANTE: En producción, esta clave debe estar en variables de entorno
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', 'clave-secreta-de-32-caracteres!').encode('utf-8')

# Asegurar que la clave tenga exactamente 32 bytes
if len(ENCRYPTION_KEY) < 32:
    ENCRYPTION_KEY = ENCRYPTION_KEY.ljust(32, b'0')
elif len(ENCRYPTION_KEY) > 32:
    ENCRYPTION_KEY = ENCRYPTION_KEY[:32]


def encrypt_data(plaintext: str) -> str:
    """
    Encripta un texto plano usando AES-256-CBC
    
    Args:
        plaintext: Texto a encriptar
        
    Returns:
        String en formato: base64(IV):base64(ciphertext)
        
    Raises:
        Exception: Si hay error en la encriptación
    """
    if not plaintext:
        return None
    
    try:
        # Generar IV aleatorio de 16 bytes
        iv = os.urandom(16)
        
        # Crear cipher AES-256-CBC
        cipher = Cipher(
            algorithms.AES(ENCRYPTION_KEY),
            modes.CBC(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # Aplicar padding PKCS7
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(plaintext.encode('utf-8')) + padder.finalize()
        
        # Encriptar
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        # Retornar IV + ciphertext en base64
        iv_b64 = base64.b64encode(iv).decode('utf-8')
        ciphertext_b64 = base64.b64encode(ciphertext).decode('utf-8')
        
        return f"{iv_b64}:{ciphertext_b64}"
    
    except Exception as e:
        print(f"Error al encriptar: {e}")
        raise Exception(f"Error en encriptación: {str(e)}")


def decrypt_data(ciphertext: str) -> str:
    """
    Desencripta un texto encriptado con AES-256-CBC
    
    Args:
        ciphertext: Texto encriptado en formato base64(IV):base64(ciphertext)
        
    Returns:
        Texto desencriptado
        
    Raises:
        Exception: Si hay error en la desencriptación
    """
    if not ciphertext:
        return None
    
    try:
        # Separar IV y ciphertext
        parts = ciphertext.split(':')
        if len(parts) != 2:
            raise ValueError("Formato de ciphertext inválido")
        
        iv_b64, ciphertext_b64 = parts
        
        # Decodificar de base64
        iv = base64.b64decode(iv_b64)
        ciphertext_bytes = base64.b64decode(ciphertext_b64)
        
        # Crear cipher AES-256-CBC
        cipher = Cipher(
            algorithms.AES(ENCRYPTION_KEY),
            modes.CBC(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        # Desencriptar
        padded_plaintext = decryptor.update(ciphertext_bytes) + decryptor.finalize()
        
        # Remover padding PKCS7
        unpadder = padding.PKCS7(128).unpadder()
        plaintext = unpadder.update(padded_plaintext) + unpadder.finalize()
        
        return plaintext.decode('utf-8')
    
    except Exception as e:
        print(f"Error al desencriptar: {e}")
        # En caso de error, retornar None o el valor encriptado
        return None


def mask_sensitive_data(data: str, data_type: str = 'default') -> str:
    """
    Enmascara datos sensibles para mostrarlos en listados
    
    Args:
        data: Dato a enmascarar
        data_type: Tipo de dato ('email', 'card', 'phone', 'cedula')
        
    Returns:
        Dato enmascarado
    """
    if not data:
        return 'N/A'
    
    try:
        if data_type == 'email':
            # juan.perez@ejemplo.com -> ju***@ejemplo.com
            user, domain = data.split('@')
            return f"{user[:2]}***@{domain}"
        
        elif data_type == 'card':
            # 1234567890123456 -> **** **** **** 3456
            return f"**** **** **** {data[-4:]}"
        
        elif data_type == 'phone':
            # 0987654321 -> ***-***-4321
            return f"***-***-{data[-4:]}"
        
        elif data_type == 'cedula':
            # 1234567890 -> *******890
            return f"*******{data[-3:]}"
        
        else:
            # Por defecto, mostrar solo primeros y últimos 2 caracteres
            if len(data) <= 4:
                return '*' * len(data)
            return f"{data[:2]}***{data[-2:]}"
    
    except Exception as e:
        print(f"Error al enmascarar dato: {e}")
        return '***'


# ========================================
# FUNCIONES DE UTILIDAD
# ========================================

def generate_encryption_key() -> str:
    """
    Genera una clave de encriptación aleatoria de 32 bytes
    Útil para configuración inicial
    
    Returns:
        Clave en formato hexadecimal
    """
    key = os.urandom(32)
    return key.hex()


def test_encryption():
    """
    Función de prueba para verificar que la encriptación funciona correctamente
    """
    print("🔒 Probando módulo de encriptación...")
    
    # Datos de prueba
    test_data = {
        'correo': 'usuario@ejemplo.com',
        'cedula': '1234567890',
        'telefono': '0987654321',
        'tarjeta': '1234567890123456'
    }
    
    print("\n📝 Datos originales:")
    for key, value in test_data.items():
        print(f"  {key}: {value}")
    
    # Encriptar
    print("\n🔐 Datos encriptados:")
    encrypted_data = {}
    for key, value in test_data.items():
        encrypted_data[key] = encrypt_data(value)
        print(f"  {key}: {encrypted_data[key][:50]}...")
    
    # Desencriptar
    print("\n🔓 Datos desencriptados:")
    for key, encrypted_value in encrypted_data.items():
        decrypted = decrypt_data(encrypted_value)
        original = test_data[key]
        match = "✅" if decrypted == original else "❌"
        print(f"  {key}: {decrypted} {match}")
    
    # Enmascarar
    print("\n👁️ Datos enmascarados:")
    print(f"  correo: {mask_sensitive_data(test_data['correo'], 'email')}")
    print(f"  cedula: {mask_sensitive_data(test_data['cedula'], 'cedula')}")
    print(f"  telefono: {mask_sensitive_data(test_data['telefono'], 'phone')}")
    print(f"  tarjeta: {mask_sensitive_data(test_data['tarjeta'], 'card')}")
    
    print("\n✅ Pruebas completadas")


if __name__ == "__main__":
    # Si se ejecuta este archivo directamente, ejecutar pruebas
    test_encryption()
    
    # Generar una nueva clave
    print(f"\n🔑 Nueva clave de encriptación: {generate_encryption_key()}")
    print("⚠️  IMPORTANTE: Guarda esta clave en tu archivo .env como ENCRYPTION_KEY")
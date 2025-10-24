# migrate_passwords.py
"""
Script para migrar contraseñas existentes en texto plano a bcrypt
IMPORTANTE: Ejecutar UNA SOLA VEZ antes de usar el sistema en producción
"""

from sqlalchemy.orm import Session
from db.session import SessionLocal
from models.user import UsuarioSistema
from security.password import hash_password
import bcrypt

def is_bcrypt_hash(password: str) -> bool:
    """
    Verifica si una contraseña ya está hasheada con bcrypt
    """
    # Los hashes de bcrypt comienzan con $2a$, $2b$ o $2y$
    return isinstance(password, str) and password.startswith(('$2a$', '$2b$', '$2y$'))

def migrate_passwords():
    """
    Migra todas las contraseñas de texto plano a bcrypt
    """
    db = SessionLocal()
    
    try:
        print("🔐 Iniciando migración de contraseñas...")
        print("=" * 60)
        
        # Obtener todos los usuarios
        users = db.query(UsuarioSistema).all()
        
        if not users:
            print("⚠️  No se encontraron usuarios en la base de datos")
            return
        
        print(f"📊 Total de usuarios encontrados: {len(users)}")
        print("-" * 60)
        
        migrated = 0
        skipped = 0
        errors = 0
        
        for user in users:
            try:
                # Verificar si la contraseña ya está hasheada
                if is_bcrypt_hash(user.clave):
                    print(f"⏭️  Usuario '{user.usuario}': Ya tiene hash bcrypt - OMITIDO")
                    skipped += 1
                    continue
                
                # Guardar la contraseña original por si acaso
                old_password = user.clave
                
                # Hashear la contraseña
                hashed_password = hash_password(old_password)
                
                # Actualizar en la base de datos
                user.clave = hashed_password
                db.commit()
                
                print(f"✅ Usuario '{user.usuario}': Contraseña migrada exitosamente")
                migrated += 1
                
            except Exception as e:
                print(f"❌ Error con usuario '{user.usuario}': {str(e)}")
                errors += 1
                db.rollback()
        
        print("-" * 60)
        print("📊 RESUMEN DE MIGRACIÓN:")
        print(f"   ✅ Migradas exitosamente: {migrated}")
        print(f"   ⏭️  Omitidas (ya migradas): {skipped}")
        print(f"   ❌ Errores: {errors}")
        print(f"   📝 Total procesados: {len(users)}")
        print("=" * 60)
        
        if migrated > 0:
            print("✅ Migración completada exitosamente")
            print("⚠️  IMPORTANTE: Las contraseñas originales ya no funcionarán")
            print("   Los usuarios deben usar sus contraseñas actuales para iniciar sesión")
        elif skipped > 0 and migrated == 0:
            print("ℹ️  Todas las contraseñas ya estaban migradas")
        
    except Exception as e:
        print(f"❌ Error fatal durante la migración: {str(e)}")
        db.rollback()
        
    finally:
        db.close()

def create_test_user():
    """
    Crea un usuario de prueba con contraseña hasheada
    Usuario: admin
    Contraseña: admin123
    """
    db = SessionLocal()
    
    try:
        # Verificar si el usuario ya existe
        existing_user = db.query(UsuarioSistema).filter(
            UsuarioSistema.usuario == "admin"
        ).first()
        
        if existing_user:
            print("⚠️  El usuario 'admin' ya existe")
            return
        
        # Crear usuario admin de prueba
        from datetime import datetime
        
        admin_user = UsuarioSistema(
            usuario="admin",
            clave=hash_password("admin123"),
            nombres="administrador",
            apellidos="Sistema",
            cedula="0000000000",
            email="admin@sistema.com",
            rol="admin",
            fecha_registro=datetime.now()
        )
        
        # Agregar campos opcionales si existen
        if hasattr(UsuarioSistema, 'activo'):
            admin_user.activo = True
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Usuario de prueba creado exitosamente:")
        print("   Usuario: admin")
        print("   Contraseña: admin123")
        print("   Rol: admin")
        
    except Exception as e:
        print(f"❌ Error creando usuario de prueba: {str(e)}")
        db.rollback()
        
    finally:
        db.close()

def verify_migration():
    """
    Verifica que todas las contraseñas estén hasheadas
    """
    db = SessionLocal()
    
    try:
        print("\n🔍 Verificando estado de las contraseñas...")
        print("=" * 60)
        
        users = db.query(UsuarioSistema).all()
        
        hashed = 0
        plain_text = 0
        
        for user in users:
            if is_bcrypt_hash(user.clave):
                hashed += 1
            else:
                plain_text += 1
                print(f"⚠️  Usuario '{user.usuario}': Contraseña en texto plano detectada")
        
        print("-" * 60)
        print(f"✅ Contraseñas hasheadas: {hashed}")
        print(f"⚠️  Contraseñas en texto plano: {plain_text}")
        print("=" * 60)
        
        if plain_text > 0:
            print("⚠️  ADVERTENCIA: Hay contraseñas sin hashear")
            print("   Ejecute la migración de contraseñas")
        else:
            print("✅ Todas las contraseñas están correctamente hasheadas")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🔐 SCRIPT DE MIGRACIÓN DE CONTRASEÑAS")
    print("=" * 60 + "\n")
    
    print("Opciones:")
    print("1. Migrar contraseñas existentes")
    print("2. Crear usuario de prueba (admin/admin123)")
    print("3. Verificar estado de contraseñas")
    print("4. Ejecutar todo (migrar + crear usuario + verificar)")
    
    choice = input("\nSeleccione una opción (1-4): ").strip()
    
    if choice == "1":
        confirm = input("\n⚠️  ¿Está seguro de que desea migrar las contraseñas? (si/no): ").strip().lower()
        if confirm == "si":
            migrate_passwords()
        else:
            print("❌ Migración cancelada")
    
    elif choice == "2":
        create_test_user()
    
    elif choice == "3":
        verify_migration()
    
    elif choice == "4":
        confirm = input("\n⚠️  ¿Está seguro de que desea ejecutar todo? (si/no): ").strip().lower()
        if confirm == "si":
            migrate_passwords()
            print("\n")
            create_test_user()
            print("\n")
            verify_migration()
        else:
            print("❌ Operación cancelada")
    
    else:
        print("❌ Opción inválida")
    
    print("\n" + "=" * 60)
    print("✅ Script finalizado")
    print("=" * 60 + "\n")
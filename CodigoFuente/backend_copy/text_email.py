from utils.email import email_service

# Prueba básica
result = email_service.send_verification_code(
    to_email="sanjapambaj@gmail.com",
    code="123456",
    username="UsuarioPrueba",
)

print(f"Email enviado: {result}")
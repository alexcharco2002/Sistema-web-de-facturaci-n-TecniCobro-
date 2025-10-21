# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth
from routes import user
from routes import user_secure  # ⬅️ NUEVA RUTA: Usuarios seguros


app = FastAPI(
    title="Sistema de Facturación de Agua",
    description="API para el sistema de facturación JAAP Sanjapamba",
    version="1.0.0"
)

# Configurar CORS para permitir el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:3000",
        # Agrega aquí otros orígenes si es necesario
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todo (solo para pruebas)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Incluir rutas
app.include_router(auth.router) # Rutas de autenticación
app.include_router(user.router) # Rutas de usuarios
app.include_router(user_secure.router)  # ⬅️ Incluir rutas de usuarios seguros

# Health check general
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "jaap-sanjapamba-api",
        "version": "1.0.0"
    }

# Endpoint de información de la API
@app.get("/")
async def root():
    return {
        "message": "API Sistema de Facturación JAAP Sanjapamba",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
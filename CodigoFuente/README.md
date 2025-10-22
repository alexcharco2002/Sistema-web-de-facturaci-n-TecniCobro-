Sistema de Facturación - Junta de Agua de Sanjapamba

Descripción del proyecto

Este proyecto es un sistema web de facturación para la Junta de Agua de la Comunidad de Sanjapamba.
Permite gestionar usuarios, medidores, sectores, tarifas, servicios, lecturas y facturación de manera automatizada.

El sistema cuenta con:

Frontend: React (src y estructura organizada por componentes y páginas).

Backend: FastAPI (Python) con conexión a PostgreSQL.

Base de datos: Relacional, diseñada para cumplir todos los requisitos funcionales del sistema.

Arquitectura del proyecto
C:.
├───backend
│   ├───db/             # Configuración y conexión a la base de datos
│   ├───models/         # Modelos de la base de datos (ORM)
│   ├───routes/         # Endpoints de la API
│   ├───schemas/        # Esquemas de datos (Pydantic)
│   ├───security/       # Autenticación y autorización
│   ├───services/       # Lógica de negocio
│   ├───utils/          # Funciones auxiliares
│   └───venv/           # Entorno virtual de Python
└───frontend
│    │
│    ├── node_modules/ # Dependencias instaladas de npm
│    │
│    ├── public/ # Archivos públicos accesibles directamente (index.html, favicon, imágenes estáticas)
│    │
│    ├── src/ # Código fuente de la aplicación React
│    │ ├── componentes/ # Componentes reutilizables (botones, formularios, modales, tablas etc.)
│    │ ├── pages/ # Vistas o páginas completas (Dashboard, Login, Usuarios, Facturas, etc.)
│    │ ├── services/ # Funciones para consumir APIs del backend (fetch, axios, autenticación, etc.)
│    │ ├── utils/ # Utilidades generales, helpers y funciones de apoyo
│    │ ├── index.js # Punto de entrada principal de la aplicación React
│    │ └── app.js # Componente raíz que organiza rutas y layout principal
│
└── README.md # Documentación del frontend y guía de configuración



Configuración de la Base de Datos

Motor de base de datos: PostgreSQL

Número de serie del volumen: 3C08-E484

Tablas principales:

Tabla	Descripción
t_usuario_sistema	Usuarios del sistema con roles y permisos.
t_usuario_afiliado	Información personal de los usuarios/afiliados.
t_medidor	Medidores de agua asignados a usuarios y sectores.
t_sector	Sectores de la comunidad.
t_tarifa	Tarifas de agua según consumo y tipo de servicio.
t_servicios	Servicios adicionales como recargos, reconexiones, mantenimiento.
t_lecturas	Lecturas de consumo asociadas a usuarios y medidores.
t_factura	Facturas generadas automáticamente por consumo y servicios.
t_detalle_factura	Detalle de la facturación (servicios y tarifas).
t_pagos	Registro de pagos realizados por usuarios.
t_multa y t_multas_usuario	Registro de multas y su relación con los usuarios.

Relaciones:

Cada usuario afiliado puede tener uno o más medidores.

Cada medidor pertenece a un sector.

Cada lectura está asociada a un usuario y un medidor.

Cada factura se genera a partir de lecturas y tarifas, y se vincula a pagos.

Multas se asignan a usuarios y afectan su estado de cuenta.

Configuración del entorno de desarrollo

Clonar el repositorio:

git clone <https://github.com/alexcharco2002/Sistema-web-de-facturaci-n-TecniCobro-.git>
cd backend


Crear entorno virtual de Python:

python -m venv venv


Activar el entorno virtual:

Windows:

venv\Scripts\activate


Instalar dependencias:

pip install -r requirements.txt


--Configurar variables de entorno en .env:

DATABASE_URL=postgresql://usuario:clave@localhost:5432/jaap_sanjapamba
SECRET_KEY=Informatico593


Ejecutar el backend:

uvicorn main:app --reload


Ejecutar el frontend:

cd ../frontend
npm install
npm start

-- Cumplimiento de requisitos funcionales

La base de datos y su estructura garantizan el cumplimiento de los 45 requisitos funcionales del sistema, incluyendo:

Gestión de usuarios y roles

Lectura y facturación automática

Gestión de medidores, sectores y tarifas

Registro y control de pagos

Generación de reportes y estadísticas

Seguridad y autenticación

-- Documentación adicional

Diagrama ER: /docs/ER_diagram.png

Documentación de la API: /docs/api_documentation.md
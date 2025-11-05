from db.database import get_db

def verify_user(email: str, password: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM t_usuario_sistema WHERE usuario=%s AND clave=%s", (email, password))
    user = cur.fetchone()
    if user:
        return {
            "id": user[0],
            "usuario": user[1],
            "rol": user[7]
        }
    return None

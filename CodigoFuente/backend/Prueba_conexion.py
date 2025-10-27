import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="jaap_sanjapamba",
    user="postgres",
    password="Informatico593"
)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM usuarios.t_usuario_sistema;")
print("Total de usuarios:", cur.fetchone()[0])
conn.close()

import psycopg2
import os

def get_db():
    return psycopg2.connect(
        host="localhost",
        database="jaap_sanjapamba",
        user="postgres",
        password="Informatico593"
    )

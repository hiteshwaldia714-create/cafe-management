import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")

connection = psycopg2.connect(database_url)

print("Connected to Supabase successfully!")

connection.close()

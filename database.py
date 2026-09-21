import sqlite3

connection = sqlite3.connect ('cafe.db')

cursor = connection.cursor ()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT UNIQUE NOT NULL
    )
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT  NOT NULL,
        pc_name TEXT NOT NULL,
        login_time TEXT NOT NULL,
        logout_time TEXT 
    )
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS pcs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pc_name TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL
)
""")
pcs = [
    ("PC-01", "AVAILABLE"),
    ("PC-02", "AVAILABLE"),
    ("PC-03", "AVAILABLE"),
    ("PC-04", "AVAILABLE")
]

cursor.executemany("""
INSERT OR IGNORE INTO pcs (pc_name, status)
VALUES (?, ?)
""", pcs)

cursor.execute("""

CREATE TABLE IF NOT EXISTS admins (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT UNIQUE NOT NULL,

    password TEXT NOT NULL

)

""")

cursor.execute("""

CREATE TABLE IF NOT EXISTS admin_sessions (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT NOT NULL,

    token TEXT UNIQUE NOT NULL,

    created_at TEXT NOT NULL

)

""")

connection.commit()

connection.close()
print("Database created successfully!")


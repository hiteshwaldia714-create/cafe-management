import sqlite3
from security import hash_password

name = input("Enter customer name: ")
customer_id = input("Enter customer ID: ")
password = input("Enter password: ")

# Hash the password before storing it
hashed_password = hash_password(password)

connection = sqlite3.connect("cafe.db")
cursor = connection.cursor()

try:
    cursor.execute("""
        INSERT INTO customers (customer_id, name, password)
        VALUES (?, ?, ?)
    """, (customer_id, name, hashed_password))

    connection.commit()
    print("Customer registered successfully!")

except sqlite3.IntegrityError:
    print("Customer ID already exists!")

connection.close()
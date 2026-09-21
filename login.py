import sqlite3
from security import verify_password

customer_id = input("Enter customer ID: ")
password = input("Enter your password: ")

connection = sqlite3.connect('cafe.db')
cursor = connection.cursor()

cursor.execute("""
SELECT name, password FROM customers
WHERE customer_id = ?
""", (customer_id,))

customer = cursor.fetchone()

if customer:
    name = customer[0]
    stored_password = customer[1]

    if verify_password(password, stored_password):
        print("Login successful!")
        print("Welcome,", name)
    else:
        print("Invalid password!")
else:
    print("Customer ID not found!")

connection.close()
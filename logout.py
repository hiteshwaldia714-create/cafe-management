import sqlite3
from datetime import datetime

# Get customer ID
customer_id = input("Enter customer ID: ")

# Connect to database
connection = sqlite3.connect("cafe.db")
cursor = connection.cursor()

# Find the customer's active session
cursor.execute("""
    SELECT id, login_time
    FROM sessions
    WHERE customer_id = ? AND logout_time IS NULL
    ORDER BY id DESC
    LIMIT 1
""", (customer_id,))

session = cursor.fetchone()

if session:
    session_id = session[0]
    login_time = session[1]

    # Get current logout time
    logout_time = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Update the session
    cursor.execute("""
        UPDATE sessions
        SET logout_time = ?
        WHERE id = ?
    """, (logout_time, session_id))

    connection.commit()

    # Calculate duration
    login = datetime.strptime(login_time, "%Y-%m-%d %H:%M")
    logout = datetime.strptime(logout_time, "%Y-%m-%d %H:%M")

    duration = logout - login

    print("Logout successful!")
    print("Login time:", login_time)
    print("Logout time:", logout_time)
    print("Session duration:", duration)

else:
    print("No active session found for this customer.")

connection.close()
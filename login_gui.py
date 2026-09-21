import tkinter as tk
from tkinter import messagebox
import sqlite3

print("Program started")
def login():
    customer_id = customer_id_entry.get()
    password = password_entry.get()

    # Check that fields aren't empty
    if customer_id == "" or password == "":
        messagebox.showwarning(
            "Missing Information",
            "Please enter Customer ID and Password."
        )
        return

    # Connect to database
    connection = sqlite3.connect("cafe.db")
    cursor = connection.cursor()

    # Check customer
    cursor.execute("""
        SELECT name
        FROM customers
        WHERE customer_id = ? AND password = ?
    """, (customer_id, password))

    customer = cursor.fetchone()

    connection.close()

    # Check result
    if customer:
        name = customer[0]

        messagebox.showinfo(
            "Login Successful",
            f"Welcome, {name}!"
        )

    else:
        messagebox.showerror(
            "Login Failed",
            "Invalid Customer ID or Password."
        )


# Create main window
window = tk.Tk()

window.title("Cafe Management System")
window.geometry("400x300")

# Heading
title = tk.Label(
    window,
    text="CAFE LOGIN",
    font=("Arial", 24, "bold")
)

title.pack(pady=30)


# Customer ID
customer_id_label = tk.Label(
    window,
    text="Customer ID"
)

customer_id_label.pack()

customer_id_entry = tk.Entry(
    window,
    width=30
)

customer_id_entry.pack(pady=5)


# Password
password_label = tk.Label(
    window,
    text="Password"
)

password_label.pack()

password_entry = tk.Entry(
    window,
    width=30,
    show="*"
)

password_entry.pack(pady=5)


# Login button
login_button = tk.Button(
    window,
    text="LOGIN",
    width=15,
    command=login
)

login_button.pack(pady=20)

print("Starting GUI...")
# Start application
window.mainloop()
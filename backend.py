import secrets

from flask import Flask, request, jsonify

from functools import wraps

from pc_config import PC_NAME

from excel_export import export_to_excel

from flask_cors import CORS


import psycopg2
import os

from dotenv import load_dotenv

from security import verify_password, hash_password

from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_cloud_connection():
    return psycopg2.connect(DATABASE_URL)


def admin_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "success": False,
                "message": "Admin authentication required"
            }), 401

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "message": "Invalid authentication format"
            }), 401

        token = auth_header.split(" ", 1)[1]

        connection = get_cloud_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT username
            FROM admin_sessions
            WHERE token = %s
        """, (token,))

        admin = cursor.fetchone()

        cursor.close()
        connection.close()

        if admin is None:
            return jsonify({
                "success": False,
                "message": "Invalid admin session"
            }), 401

        return f(*args, **kwargs)

    return decorated


@app.route("/logout", methods=["POST"])
def logout():

    data = request.json

    customer_id = data["customer_id"]

    connection = get_cloud_connection()
    cursor = connection.cursor()

    # Find the customer's active session
    cursor.execute("""
        SELECT id, login_time, pc_name
        FROM sessions
        WHERE customer_id = %s
        AND logout_time IS NULL
        ORDER BY id DESC
        LIMIT 1
    """, (customer_id,))

    session = cursor.fetchone()

    if session is None:

        cursor.close()
        connection.close()

        return jsonify({
            "success": False,
            "message": "No active session found!"
        })

    session_id = session[0]
    login_time = session[1]
    pc_name = session[2]

    logout_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Update the session
    cursor.execute("""
        UPDATE sessions
        SET logout_time = %s
        WHERE id = %s
    """, (logout_time, session_id))

    # Make PC available
    cursor.execute("""
        UPDATE pcs
        SET status = 'AVAILABLE',
            customer_name = NULL,
            login_time = NULL
        WHERE pc_name = %s
    """, (pc_name,))

    connection.commit()

    cursor.close()
    connection.close()

    # Calculate duration
    login = datetime.strptime(login_time, "%Y-%m-%d %H:%M:%S")
    logout = datetime.strptime(logout_time, "%Y-%m-%d %H:%M:%S")

    duration = logout - login

    return jsonify({
        "success": True,
        "message": "Logout successful!",
        "logout_time": logout_time,
        "duration": str(duration)
    })

@app.route("/admin-login", methods=["POST"])
def admin_login():

    data = request.json

    username = data["username"]
    password = data["password"]

    connection = get_cloud_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT password
        FROM admins
        WHERE username = %s
    """, (username,))

    admin = cursor.fetchone()

    cursor.close()
    connection.close()

    if admin is None:

        return jsonify({
            "success": False,
            "message": "Invalid admin credentials"
        })

    stored_password = admin[0]

    if verify_password(password, stored_password):

        token = secrets.token_hex(32)

        connection = get_cloud_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO admin_sessions
            (username, token, created_at)
            VALUES (%s, %s, %s)
        """, (
            username,
            token,
            datetime.now().strftime("%Y-%m-%d %H:%M")
        ))

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Admin login successful",
            "token": token
        })

    return jsonify({
        "success": False,
        "message": "Invalid admin credentials"
    })


@app.route("/admin-logout", methods=["POST"])
@admin_required
def admin_logout():

    auth_header = request.headers.get("Authorization")

    token = auth_header.split(" ", 1)[1]

    connection = get_cloud_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM admin_sessions
        WHERE token = %s
    """, (token,))

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "success": True,
        "message": "Admin logout successful"
    })



@app.route("/login", methods=["POST"])
def login():

    data = request.json

    customer_id = data["customer_id"]
    password = data["password"]
    pc_name = data["pc_name"]

    connection = get_cloud_connection()
    cursor = connection.cursor()

    # Find customer
    cursor.execute("""
        SELECT name, password
        FROM customers
        WHERE customer_id = %s
    """, (customer_id,))

    customer = cursor.fetchone()

    if customer is None:

        cursor.close()
        connection.close()

        return jsonify({
            "success": False,
            "message": "Customer ID not found!"
        })

    name = customer[0]
    stored_password = customer[1]

    # Check password
    if not verify_password(password, stored_password):

        cursor.close()
        connection.close()

        return jsonify({
            "success": False,
            "message": "Incorrect password!"
        })

    # Check PC status
    cursor.execute("""
        SELECT status
        FROM pcs
        WHERE pc_name = %s
    """, (pc_name,))

    pc = cursor.fetchone()

    if pc is None:

        cursor.close()
        connection.close()

        return jsonify({
            "success": False,
            "message": "PC not found!"
        })

    # Check if PC is already being used
    if pc[0] != "AVAILABLE":

        cursor.close()
        connection.close()

        return jsonify({
            "success": False,
            "message": f"{pc_name} is currently in use!"
        })

    login_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Create session
    cursor.execute("""
        INSERT INTO sessions
        (customer_id, customer_name, pc_name, login_time)
        VALUES (%s, %s, %s, %s)
    """, (customer_id, name, pc_name, login_time))

    # Mark PC as IN USE
    cursor.execute("""
        UPDATE pcs
        SET status = 'IN USE',
            customer_name = %s,
            login_time = %s
        WHERE pc_name = %s
    """, (name, login_time, pc_name))

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "success": True,
        "message": f"Welcome, {name}!",
        "login_time": login_time,
        "pc_name": pc_name
    })
    
@app.route("/pcs", methods=["GET"])
@admin_required
def get_pcs():

    connection = get_cloud_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            pcs.pc_name,
            pcs.status,
            customers.name,
            sessions.login_time
        FROM pcs
        LEFT JOIN sessions
            ON pcs.pc_name = sessions.pc_name
            AND sessions.logout_time IS NULL
        LEFT JOIN customers
            ON sessions.customer_id = customers.customer_id
        ORDER BY pcs.id
    """)

    pcs = cursor.fetchall()

    cursor.close()
    connection.close()

    pc_list = []

    for pc in pcs:

        pc_name = pc[0]
        status = pc[1]
        customer_name = pc[2]
        login_time = pc[3]

        pc_list.append({
            "pc_name": pc_name,
            "status": status,
            "customer_name": customer_name,
            "login_time": login_time
        })

    return jsonify(pc_list)

@app.route("/sessions", methods=["GET"])
@admin_required
def get_sessions():

    connection = get_cloud_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            sessions.customer_id,
            customers.name,
            sessions.pc_name,
            sessions.login_time,
            sessions.logout_time
        FROM sessions
        JOIN customers
        ON sessions.customer_id = customers.customer_id
        WHERE sessions.logout_time IS NOT NULL
        AND sessions.logout_time != 'RESET'
        ORDER BY sessions.id DESC
    """)

    sessions = cursor.fetchall()

    cursor.close()
    connection.close()

    session_list = []

    for session in sessions:

        session_list.append({
            "customer_id": session[0],
            "customer_name": session[1],
            "pc_name": session[2],
            "login_time": session[3],
            "logout_time": session[4]
        })

    return jsonify(session_list)

@app.route("/force-logout", methods=["POST"])
@admin_required
def force_logout():

    data = request.json

    pc_name = data["pc_name"]

    connection = get_cloud_connection()
    cursor = connection.cursor()

    # Find the active session for this PC
    cursor.execute("""
        SELECT id, customer_id, login_time
        FROM sessions
        WHERE pc_name = %s
        AND logout_time IS NULL
        ORDER BY id DESC
        LIMIT 1
    """, (pc_name,))

    session = cursor.fetchone()

    if session is None:

        cursor.close()
        connection.close()

        return jsonify({
            "success": False,
            "message": "No active session found!"
        })

    session_id = session[0]

    # Close the session
    logout_time = datetime.now().strftime("%Y-%m-%d %H:%M")

    cursor.execute("""
        UPDATE sessions
        SET logout_time = %s
        WHERE id = %s
    """, (logout_time, session_id))

    # Make PC available
    cursor.execute("""
        UPDATE pcs
        SET status = 'AVAILABLE',
            customer_name = NULL,
            login_time = NULL
        WHERE pc_name = %s
    """, (pc_name,))

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "success": True,
        "message": pc_name + " has been force logged out!"
    })

@app.route("/session-status", methods=["POST"])
def session_status():

    data = request.json

    customer_id = data["customer_id"]

    connection = get_cloud_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT id
        FROM sessions
        WHERE customer_id = %s
        AND logout_time IS NULL
        ORDER BY id DESC
        LIMIT 1
    """, (customer_id,))

    session = cursor.fetchone()

    cursor.close()
    connection.close()

    if session is None:

        return jsonify({
            "active": False
        })

    return jsonify({
        "active": True
    })

@app.route("/customer-history/<customer_id>", methods=["GET"])
@admin_required
def customer_history(customer_id):

    connection = get_cloud_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            pc_name,
            login_time,
            logout_time
        FROM sessions
        WHERE customer_id = %s
        AND logout_time IS NOT NULL
        ORDER BY id DESC
    """, (customer_id,))

    sessions = cursor.fetchall()

    cursor.close()
    connection.close()

    history = []

    for session in sessions:

        history.append({
            "pc_name": session[0],
            "login_time": session[1],
            "logout_time": session[2]
        })

    return jsonify(history)

@app.route("/add-customer", methods=["POST"])
@admin_required
def add_customer():

    data = request.json

    name = data["name"]
    customer_id = data["customer_id"]
    password = data["password"]

    hashed_password = hash_password(password)

    connection = get_cloud_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO customers
            (customer_id, name, password)
            VALUES (%s, %s, %s)
        """, (customer_id, name, hashed_password))

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Customer added successfully!"
        })

    except psycopg2.errors.UniqueViolation:

        connection.rollback()

        cursor.close()
        connection.close()

        return jsonify({
            "success": False,
            "message": "Customer ID already exists!"
        })
    
@app.route("/today-stats", methods=["GET"])
@admin_required
def today_stats():

    connection = get_cloud_connection()
    cursor = connection.cursor()

    today = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
        SELECT COUNT(DISTINCT customer_id)
        FROM sessions
        WHERE login_time LIKE %s
    """, (today + "%",))

    customers_today = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM sessions
        WHERE login_time LIKE %s
    """, (today + "%",))

    sessions_today = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM sessions
        WHERE logout_time IS NULL
    """)

    currently_playing = cursor.fetchone()[0]

    cursor.close()
    connection.close()

    return jsonify({
        "customers_today": customers_today,
        "sessions_today": sessions_today,
        "currently_playing": currently_playing
    })
if __name__ == "__main__":
    app.run(port=5000)

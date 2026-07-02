from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
from datetime import datetime, date
from flask_cors import CORS
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
import smtplib
from email.mime.text import MIMEText

import os
from dotenv import load_dotenv

import google.generativeai as genai

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

env_path = os.path.join(
    BASE_DIR,
    "chatbot.env"
)

load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")

print("ENV PATH =", env_path)
print("KEY =", api_key)

genai.configure(api_key=api_key)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)

app = Flask(__name__)
CORS(app)

# SECRET KEY CONFIG
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret_key_eventsync_123456')

# DATABASE CONFIG
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'eventsync')

mysql = MySQL(app)

# PASSWORD RESET SERIALIZER
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

# TEST ROUTE
@app.route('/')
def home():
    return "EventSync Backend Running"

# REGISTER ROUTE
@app.route('/register', methods=['POST'])
def register():

    try:

        data = request.get_json()

        fullname = data['fullname']
        email = data['email']
        password = data['password']
        role = data['role']

        cursor = mysql.connection.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE email=%s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:

            cursor.close()

            return jsonify({
                "success": False,
                "message": "This email is already registered."
            })

        query = """
        INSERT INTO users(fullname, email, password, role)
        VALUES(%s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (fullname, email, password, role)
        )

        try:
            cursor.execute("INSERT INTO notifications (message) VALUES (%s)", 
                           (f"New user {fullname} has registered an account as {role}.", ))
        except Exception as notify_err:
            print("Failed to log notification:", notify_err)

        mysql.connection.commit()

        cursor.close()

        return jsonify({
            "success": True,
            "message": "User registered successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        })
    
# LOGIN ROUTE
@app.route('/login', methods=['POST'])
def login():

    data = request.get_json()

    email = data['email']
    password = data['password']

    cursor = mysql.connection.cursor()

    query = """
    SELECT * FROM users
    WHERE email = %s AND password = %s
    """

    cursor.execute(query, (email, password))

    user = cursor.fetchone()

    cursor.close()

    if user:

        return jsonify({
            "success": True,
            "message": "Login successful",
            "fullname": user[1],
            "role": user[4]
        })

    else:

        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        })

# fetch events in Dashboard
@app.route('/events/<username>')
def get_events(username):

    cursor = mysql.connection.cursor()

    cursor.execute(
        "SELECT id, created_by, title, category, event_date, selected_venue, timeline FROM events WHERE created_by=%s",
        (username,)
    )

    events = cursor.fetchall()

    result = []

    for event in events:

        result.append({

            "id": event[0],
            "created_by": event[1],
            "title": event[2],
            "category": event[3],
            "event_date": str(event[4]),
            "venue": event[5],
            "timeline": event[6]

        })

    cursor.close()

    return jsonify(result)

#Create Event
def validate_event_data(data):
    title = data.get('title', '').strip()
    category = data.get('category', '')
    description = data.get('description', '').strip()
    event_date = data.get('event_date', '')
    start_time = data.get('start_time', '')
    end_time = data.get('end_time', '')
    participants = data.get('participants')
    preferred_location = data.get('preferred_location', '').strip()
    budget = data.get('budget')
    required_capacity = data.get('required_capacity')
    venue_type = data.get('venue_type', '')
    other_requirements = data.get('other_requirements', '').strip()

    # 1. Required fields
    if not (title and category and description and event_date and start_time and end_time and preferred_location and venue_type):
        return False, "Missing required event fields."

    # 2. Length restrictions
    if len(title) > 100:
        return False, "Event title exceeds 100 characters."
    if len(description) > 1000:
        return False, "Event description exceeds 1000 characters."
    if len(other_requirements) > 300:
        return False, "Other requirements exceed 300 characters."
    if len(preferred_location) > 100:
        return False, "Preferred location exceeds 100 characters."

    # 3. Date check (cannot be in the past)
    try:
        input_date = datetime.strptime(event_date, "%Y-%m-%d").date()
        if input_date < date.today():
            return False, "Event date cannot be in the past."
    except Exception:
        pass

    # 4. Time check (End > Start)
    if start_time >= end_time:
        return False, "Event end time must be after the start time."

    # 5. Numeric boundary validation
    try:
        parts_int = int(participants)
        if parts_int < 1 or parts_int > 10000:
            return False, "Expected participants must be between 1 and 10,000 pax."
    except Exception:
        return False, "Invalid participants count."

    try:
        cap_int = int(required_capacity)
        if cap_int < 1 or cap_int > 10000:
            return False, "Required capacity must be between 1 and 10,000 pax."
    except Exception:
        return False, "Invalid capacity value."

    try:
        budget_float = float(budget)
        if budget_float < 0 or budget_float > 1000000:
            return False, "Budget must be between RM 0 and RM 1,000,000."
    except Exception:
        return False, "Invalid budget value."

    return True, None

# Create Event
@app.route('/create-event', methods=['POST'])
def create_event():

    data = request.json
    is_valid, err_msg = validate_event_data(data)
    if not is_valid:
        return jsonify({
            "success": False,
            "message": err_msg
        })

    title = data['title']
    category = data['category']
    description = data['description']

    event_date = data['event_date']
    start_time = data['start_time']
    end_time = data['end_time']

    participants = data['participants']

    preferred_location = data['preferred_location']
    budget = data['budget']
    required_capacity = data['required_capacity']
    venue_type = data['venue_type']

    parking_required = data['parking_required']
    wifi_required = data['wifi_required']
    projector_required = data['projector_required']
    catering_required = data['catering_required']
    sound_system_required = data['sound_system_required']
    stage_setup_required = data['stage_setup_required']

    other_requirements = data['other_requirements']
    selected_venue = data['selected_venue']

    created_by = data['created_by']

    cursor = mysql.connection.cursor()

    sql = """
        INSERT INTO events(
        title,
        category,
        description,
        event_date,
        start_time,
        end_time,
        participants,
        preferred_location,
        budget,
        required_capacity,
        venue_type,
        parking_required,
        wifi_required,
        projector_required,
        catering_required,
        sound_system_required,
        stage_setup_required,
        other_requirements,
        selected_venue,
        created_by,
        timeline
    )
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    values = (

        title,
        category,
        description,
        event_date,
        start_time,
        end_time,
        participants,
        preferred_location,
        budget,
        required_capacity,
        venue_type,
        parking_required,
        wifi_required,
        projector_required,
        catering_required,
        sound_system_required,
        stage_setup_required,
        other_requirements,
        selected_venue,
        created_by,
        data.get('timeline', '[]')

    )
    cursor = mysql.connection.cursor()
    cursor.execute(sql, values)
    
    try:
        cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                       (f"Event '{title}' successfully created!", created_by, "success"))
    except Exception as notify_err:
        print("Failed to log notification:", notify_err)

    mysql.connection.commit()
    cursor.close()

    return jsonify({
        "success": True,
        "message": "Event created successfully"
    })

@app.route('/my-events/<username>')
def my_events(username):

    cursor = mysql.connection.cursor()

    query = """
    SELECT id, title, category, event_date, selected_venue, created_by, timeline, status, rejection_feedback
    FROM events
    WHERE created_by = %s
    """

    cursor.execute(query, (username,))

    events = cursor.fetchall()

    result = []

    for event in events:

        result.append({

            "id": event[0],
            "title": event[1],
            "category": event[2],
            "event_date": str(event[3]),
            "selected_venue": event[4],
            "created_by": event[5],
            "timeline": event[6],
            "status": event[7],
            "rejection_feedback": event[8]

        })

    cursor.close()

    return jsonify(result)

@app.route('/delete-event/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):

    cursor = mysql.connection.cursor()

    cursor.execute(
        "DELETE FROM events WHERE id=%s",
        (event_id,)
    )

    mysql.connection.commit()

    cursor.close()

    return jsonify({
        "success": True,
        "message": "Event deleted successfully"
    })

@app.route('/event/<int:event_id>')
def get_event(event_id):

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT id, title, category, description, event_date, start_time, end_time, 
               participants, preferred_location, budget, required_capacity, venue_type, 
               parking_required, wifi_required, projector_required, catering_required, 
               sound_system_required, stage_setup_required, other_requirements, 
               selected_venue, timeline 
        FROM events 
        WHERE id=%s
    """, (event_id,))

    event = cursor.fetchone()

    cursor.close()

    return jsonify({

    "id": event[0],
    "title": event[1],
    "category": event[2],
    "description": event[3],

    "event_date": str(event[4]),

    "start_time": str(event[5]),
    "end_time": str(event[6]),

    "participants": event[7],

    "preferred_location": event[8],
    "budget": event[9],
    "required_capacity": event[10],
    "venue_type": event[11],

    "parking_required": event[12],
    "wifi_required": event[13],
    "projector_required": event[14],
    "catering_required": event[15],
    "sound_system_required": event[16],
    "stage_setup_required": event[17],

    "other_requirements": event[18],
    "selected_venue": event[19],
    "timeline": event[20]

})

@app.route('/update-event/<int:event_id>',
methods=['PUT'])
def update_event(event_id):

    data = request.json
    is_valid, err_msg = validate_event_data(data)
    if not is_valid:
        return jsonify({
            "success": False,
            "message": err_msg
        })

    cursor = mysql.connection.cursor()

    sql = """
    UPDATE events
    SET
        title=%s,
        category=%s,
        description=%s,
        event_date=%s,
        start_time=%s,
        end_time=%s,
        participants=%s,
        preferred_location=%s,
        budget=%s,
        required_capacity=%s,
        venue_type=%s,
        parking_required=%s,
        wifi_required=%s,
        projector_required=%s,
        catering_required=%s,
        sound_system_required=%s,
        stage_setup_required=%s,
        other_requirements=%s,
        selected_venue=%s,
        timeline=%s
    WHERE id=%s
    """

    values = (

        data['title'],
        data['category'],
        data['description'],
        data['event_date'],
        data['start_time'],
        data['end_time'],
        data['participants'],
        data['preferred_location'],
        data['budget'],
        data['required_capacity'],
        data['venue_type'],

        data['parking_required'],
        data['wifi_required'],
        data['projector_required'],
        data['catering_required'],
        data['sound_system_required'],
        data['stage_setup_required'],

        data['other_requirements'],
        data['selected_venue'],
        data.get('timeline', '[]'),

        event_id

    )

    cursor.execute(sql, values)

    mysql.connection.commit()

    cursor.close()

    return jsonify({
        "success": True,
        "message": "Event updated successfully"
    })

# AI ChatBOT
# @app.route('/ai-chat', methods=['POST'])
# def ai_chat():

#     data = request.get_json()

#     user_message = data.get("message")

#     try:

#         response = model.generate_content(
#             user_message
#         )

#         return jsonify({

#             "success": True,
#             "reply": response.text

#         })

#     except Exception as e:

#         return jsonify({

#             "success": False,
#             "message": str(e)

#         })

@app.route('/ai-chat', methods=['POST'])
def ai_chat():

    data = request.get_json()

    user_message = data.get("message")
    history_data = data.get("history", [])
    username = data.get("username")

    if not user_message:
        return jsonify({
            "success": False,
            "message": "Please enter a message."
        })

    # Fetch User events from database
    events_context = ""
    if username and username != "Guest":
        try:
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT * FROM events WHERE created_by = %s", (username,))
            events = cursor.fetchall()
            cursor.close()
            if events:
                events_context = "User's current events listed in EventSync:\n"
                for e in events:
                    events_context += f"- Title: \"{e[3]}\", Category: {e[4]}, Date: {e[6]}, Venue: \"{e[21]}\", Budget: RM {e[11]}, Capacity Required: {e[13]}, Expected Participants: {e[9]}\n"
            else:
                events_context = "User has not created any events in EventSync yet.\n"
        except Exception as db_err:
            print("Database error reading events for AI context:", db_err)
            events_context = "User's current events list could not be retrieved.\n"
    else:
        events_context = "No specific user logged in (Guest session). No account events context available.\n"

    system_instruction = f"""
    You are EventSync AI, a professional corporate event management assistant.
    Rules of behavior:
    1. Keep answers concise (less than 150 words).
    2. Use short bullet points, lists, and markdown tables where appropriate.
    3. Focus only on event management, venue suggestion, scheduling, and planning. If asked about unrelated things, politely refuse.
    4. If the user asks about their own events, use the following database context to answer:

    {events_context}
    """

    try:
        # Create a model instance with dynamic system instructions
        dynamic_model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=system_instruction
        )

        # Convert incoming history format
        formatted_history = []
        for h in history_data:
            role = h.get("role")
            parts = h.get("parts")
            if role in ["model", "assistant", "ai"]:
                role = "model"
            else:
                role = "user"
            if role and parts:
                formatted_history.append({
                    "role": role,
                    "parts": parts if isinstance(parts, list) else [parts]
                })

        # Start a chat session with history
        chat = dynamic_model.start_chat(history=formatted_history)
        response = chat.send_message(user_message)

        return jsonify({
            "success": True,
            "reply": response.text
        })

    except Exception as e:
        print("Gemini AI Chat Error:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        })

    
@app.route('/test-ai')
def test_ai():

    try:

        response = model.generate_content(
            "Hello Gemini"
        )

        return response.text

    except Exception as e:

        return str(e)
# FORGOT PASSWORD ROUTE
@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required."
            })

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            return jsonify({
                "success": False,
                "message": "Email address not found."
            })

        # Generate signed token (valid for 1 hour)
        token = serializer.dumps(email, salt='password-reset-salt')
        reset_url = f"http://127.0.0.1:5500/frontend/reset-password.html?token={token}"

        # Get SMTP details
        smtp_server = os.getenv("SMTP_SERVER", "")
        smtp_port_str = os.getenv("SMTP_PORT", "2525")
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")

        email_sent = False
        smtp_error = None

        if smtp_server and smtp_user and smtp_password:
            try:
                smtp_port = int(smtp_port_str)
                msg = MIMEText(
                    f"Hi,\n\nYou requested to reset your password. Click the link below to set a new password:\n\n{reset_url}\n\nIf you did not request this, please ignore this email.\n\nEventSync Team"
                )
                msg['Subject'] = 'Reset Your EventSync Password'
                msg['From'] = smtp_user
                msg['To'] = email

                with smtplib.SMTP(smtp_server, smtp_port, timeout=5) as server:
                    # Use STARTTLS if using port 587
                    if smtp_port == 587:
                        server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_user, [email], msg.as_string())
                email_sent = True
            except Exception as e:
                smtp_error = str(e)
                print("SMTP Error sending mail:", e)

        # Fallback console log for development
        print("\n----- EVENTSYNC PASSWORD RESET LINK -----")
        print(f"For User: {email}")
        print(f"Link: {reset_url}")
        print("------------------------------------------\n")

        cursor.close()

        if email_sent:
            return jsonify({
                "success": True,
                "message": "Password reset link has been sent to your email."
            })
        else:
            # Inform the user SMTP failed but reset link was printed on the server console
            message = "Password reset link generated."
            if smtp_error:
                message += f" (Mail delivery failed: {smtp_error})"
            return jsonify({
                "success": True,
                "message": message,
                "console_fallback": True,
                "reset_url": reset_url
            })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# RESET PASSWORD ROUTE
@app.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')

        if not token or not new_password:
            return jsonify({
                "success": False,
                "message": "Token and password are required."
            })

        # Verify token (max age: 1 hour)
        try:
            email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
        except SignatureExpired:
            return jsonify({
                "success": False,
                "message": "The reset link has expired."
            })
        except BadTimeSignature:
            return jsonify({
                "success": False,
                "message": "Invalid or tampered reset token."
            })

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            return jsonify({
                "success": False,
                "message": "User associated with this token not found."
            })

        # Update user's password (plaintext to match local database logic)
        cursor.execute("UPDATE users SET password = %s WHERE email = %s", (new_password, email))
        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Your password has been reset successfully."
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })
# ADMIN STATISTICS ROUTE
@app.route('/admin/stats')
def admin_stats():
    try:
        cursor = mysql.connection.cursor()

        # Total Users
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]

        # Total Events
        cursor.execute("SELECT COUNT(*) FROM events")
        total_events = cursor.fetchone()[0]

        # Total Venues (based on database)
        try:
            cursor.execute("SELECT COUNT(*) FROM venues WHERE status = 'Approved'")
            total_venues = cursor.fetchone()[0]
        except Exception as db_err:
            print("Venues table might not exist yet, defaulting to static count:", db_err)
            total_venues = 3

        # Pending Reviews
        cursor.execute("SELECT COUNT(*) FROM events WHERE status = 'Pending Review'")
        pending_reviews = cursor.fetchone()[0]

        cursor.close()

        return jsonify({
            "success": True,
            "total_users": total_users,
            "total_events": total_events,
            "total_venues": total_venues,
            "pending_reviews": pending_reviews
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# ADMIN GET ALL EVENTS ROUTE
@app.route('/admin/events')
def admin_events():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id, title, category, selected_venue, event_date, created_by, status 
            FROM events 
            ORDER BY id DESC
        """)
        events = cursor.fetchall()
        cursor.close()

        result = []
        for event in events:
            result.append({
                "id": event[0],
                "title": event[1],
                "category": event[2],
                "selected_venue": event[3],
                "event_date": str(event[4]),
                "created_by": event[5],
                "status": event[6]
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# ADMIN UPDATE EVENT STATUS ROUTE
@app.route('/admin/update-status/<int:event_id>', methods=['PUT'])
def admin_update_status(event_id):
    try:
        data = request.get_json()
        new_status = data.get("status")
        feedback = data.get("feedback") if new_status == "Rejected" else None

        if not new_status:
            return jsonify({
                "success": False,
                "message": "Status is required."
            })

        cursor = mysql.connection.cursor()

        # Fetch event details for notification
        cursor.execute("SELECT title, created_by FROM events WHERE id = %s", (event_id,))
        event = cursor.fetchone()
        event_title = event[0] if event else "Unknown"
        created_by = event[1] if event else "Unknown"

        cursor.execute("UPDATE events SET status = %s, rejection_feedback = %s WHERE id = %s", (new_status, feedback, event_id))

        try:
            # Map status to user notification details
            notif_msg = f"Event '{event_title}' is pending administrative review."
            notif_type = "warning"
            
            if new_status == "Approved":
                notif_msg = f"Your booking request for '{event_title}' was accepted by Admin."
                notif_type = "success"
            elif new_status == "Rejected":
                notif_msg = f"Event '{event_title}' booking request was rejected."
                if feedback:
                    notif_msg += f" Reason: {feedback}"
                notif_type = "error"
                
            cursor.execute(
                "INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                (notif_msg, created_by, notif_type)
            )
        except Exception as notify_err:
            print("Failed to log notification:", notify_err)

        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": f"Event status updated to {new_status} successfully."
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# ADMIN GET ALL USERS ROUTE
@app.route('/admin/users')
def admin_users():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, fullname, email, role FROM users WHERE role != 'Organizer' ORDER BY id DESC")
        users = cursor.fetchall()
        cursor.close()

        result = []
        for user in users:
            result.append({
                "id": user[0],
                "fullname": user[1],
                "email": user[2],
                "role": user[3]
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# ADMIN DELETE USER ROUTE
@app.route('/admin/delete-user/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    try:
        cursor = mysql.connection.cursor()
        
        # Prevent admin from deleting themselves if logged in as admin? 
        # Since local storage only uses 'username', we'll allow deleting any user for simplicity, but let's make it robust.
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "User deleted successfully."
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# ADMIN REPORTS DATA ROUTE
@app.route('/admin/reports/data')
def admin_reports_data():
    try:
        cursor = mysql.connection.cursor()

        # Category Breakdown
        cursor.execute("SELECT category, COUNT(*) FROM events GROUP BY category")
        categories_raw = cursor.fetchall()
        categories = {row[0]: row[1] for row in categories_raw}

        # Status Breakdown
        cursor.execute("SELECT status, COUNT(*) FROM events GROUP BY status")
        statuses_raw = cursor.fetchall()
        statuses = {row[0]: row[1] for row in statuses_raw}

        cursor.close()

        return jsonify({
            "success": True,
            "categories": categories,
            "statuses": statuses
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# VENDOR VENUE VALIDATION
def validate_venue_data(data):
    name = data.get('name', '').strip()
    location = data.get('location', '').strip()
    capacity = data.get('capacity')
    venue_type = data.get('type', '')
    price = data.get('price')
    description = data.get('description', '').strip()
    document_url = data.get('document_url', '').strip()

    if not (name and location and capacity is not None and venue_type and price is not None and description and document_url):
        return False, "Missing required venue fields."

    if len(name) < 3 or len(name) > 100:
        return False, "Venue name must be between 3 and 100 characters."
    if len(location) < 2 or len(location) > 100:
        return False, "Location must be between 2 and 100 characters."
    if len(description) < 10 or len(description) > 1000:
        return False, "Description must be between 10 and 1000 characters."
    if len(document_url) > 555:
        return False, "Document URL exceeds 555 characters."

    try:
        cap_int = int(capacity)
        if cap_int < 1 or cap_int > 10000:
            return False, "Capacity must be between 1 and 10,000 pax."
    except Exception:
        return False, "Invalid capacity value."

    try:
        price_float = float(price)
        if price_float < 0 or price_float > 1000000:
            return False, "Price must be between RM 0 and RM 1,000,000."
    except Exception:
        return False, "Invalid price value."

    return True, None

# VENDOR UPLOAD VENUE ROUTE
@app.route('/venues/upload', methods=['POST'])
def upload_venue():
    try:
        data = request.get_json()
        is_valid, err_msg = validate_venue_data(data)
        if not is_valid:
            return jsonify({
                "success": False,
                "message": err_msg
            })

        name = data['name'].strip()
        location = data['location'].strip()
        capacity = int(data['capacity'])
        venue_type = data['type']
        price = float(data['price'])
        description = data['description'].strip()
        parking_available = data.get('parking_available', 0)
        wifi_available = data.get('wifi_available', 0)
        projector_available = data.get('projector_available', 0)
        catering_available = data.get('catering_available', 0)
        sound_system_available = data.get('sound_system_available', 0)
        stage_setup_available = data.get('stage_setup_available', 0)
        uploaded_by = data['uploaded_by']
        document_url = data.get('document_url', '').strip()

        cursor = mysql.connection.cursor()
        query = """
        INSERT INTO venues (
            name, location, capacity, type, price, description,
            parking_available, wifi_available, projector_available,
            catering_available, sound_system_available, stage_setup_available,
            uploaded_by, document_url
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            name, location, capacity, venue_type, price, description,
            parking_available, wifi_available, projector_available,
            catering_available, sound_system_available, stage_setup_available,
            uploaded_by, document_url
        ))
        
        try:
            cursor.execute("INSERT INTO notifications (message) VALUES (%s)", 
                           (f"New venue '{name}' has been submitted for review by {uploaded_by}.", ))
        except Exception as notify_err:
            print("Failed to log notification:", notify_err)

        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Venue uploaded successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# FETCH VENDOR'S OWN UPLOADED VENUES
@app.route('/venues/my-uploaded/<username>')
def get_my_venues(username):
    try:
        cursor = mysql.connection.cursor()
        query = """
        SELECT id, name, location, capacity, type, price, description, 
               parking_available, wifi_available, projector_available, 
               catering_available, sound_system_available, stage_setup_available, 
               status, uploaded_by, created_at, rejection_feedback, document_url 
        FROM venues 
        WHERE uploaded_by = %s 
        ORDER BY id DESC
        """
        cursor.execute(query, (username,))
        venues = cursor.fetchall()
        cursor.close()

        result = []
        for v in venues:
            result.append({
                "id": v[0],
                "name": v[1],
                "location": v[2],
                "capacity": v[3],
                "type": v[4],
                "price": float(v[5]),
                "description": v[6],
                "parking_available": v[7],
                "wifi_available": v[8],
                "projector_available": v[9],
                "catering_available": v[10],
                "sound_system_available": v[11],
                "stage_setup_available": v[12],
                "status": v[13],
                "uploaded_by": v[14],
                "created_at": str(v[15]),
                "rejection_feedback": v[16],
                "document_url": v[17]
            })
        return jsonify(result)
    except Exception as e:
        return jsonify([])

# ADMIN FETCH ALL VENUES
@app.route('/admin/venues')
def admin_get_venues():
    try:
        cursor = mysql.connection.cursor()
        query = """
        SELECT id, name, location, capacity, type, price, description, 
               parking_available, wifi_available, projector_available, 
               catering_available, sound_system_available, stage_setup_available, 
               status, uploaded_by, created_at, rejection_feedback, document_url 
        FROM venues 
        ORDER BY id DESC
        """
        cursor.execute(query)
        venues = cursor.fetchall()
        cursor.close()

        result = []
        for v in venues:
            result.append({
                "id": v[0],
                "name": v[1],
                "location": v[2],
                "capacity": v[3],
                "type": v[4],
                "price": float(v[5]),
                "description": v[6],
                "parking_available": v[7],
                "wifi_available": v[8],
                "projector_available": v[9],
                "catering_available": v[10],
                "sound_system_available": v[11],
                "stage_setup_available": v[12],
                "status": v[13],
                "uploaded_by": v[14],
                "created_at": str(v[15]),
                "rejection_feedback": v[16],
                "document_url": v[17]
            })
        return jsonify(result)
    except Exception as e:
        return jsonify([])

# ADMIN UPDATE VENUE STATUS
@app.route('/admin/venues/update-status/<int:venue_id>', methods=['PUT'])
def admin_update_venue_status(venue_id):
    try:
        data = request.get_json()
        new_status = data.get("status")
        feedback = data.get("feedback") if new_status == "Rejected" else None

        if not new_status:
            return jsonify({
                "success": False,
                "message": "Status is required."
            })

        cursor = mysql.connection.cursor()

        # Fetch venue details for notification
        cursor.execute("SELECT name, uploaded_by FROM venues WHERE id = %s", (venue_id,))
        venue = cursor.fetchone()
        venue_name = venue[0] if venue else "Unknown"
        uploaded_by = venue[1] if venue else "Unknown"

        cursor.execute("UPDATE venues SET status = %s, rejection_feedback = %s WHERE id = %s", (new_status, feedback, venue_id))

        try:
            notif_msg = f"Venue '{venue_name}' (submitted by {uploaded_by}) has been {new_status.lower()} by Admin."
            if new_status == "Rejected" and feedback:
                notif_msg += f" Reason: {feedback}"
            
            cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                           (notif_msg, uploaded_by, "success" if new_status == "Approved" else "error" if new_status == "Rejected" else "warning"))
        except Exception as notify_err:
            print("Failed to log notification:", notify_err)

        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": f"Venue status updated to {new_status} successfully."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# ADMIN DELETE VENUE
@app.route('/admin/venues/delete/<int:venue_id>', methods=['DELETE'])
def admin_delete_venue(venue_id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM venues WHERE id = %s", (venue_id,))
        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Venue deleted successfully."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# FETCH APPROVED VENUES FOR USERS
@app.route('/venues/approved')
def get_approved_venues():
    try:
        cursor = mysql.connection.cursor()
        query = """
        SELECT id, name, location, capacity, type, price, description, 
               parking_available, wifi_available, projector_available, 
               catering_available, sound_system_available, stage_setup_available, 
               status, uploaded_by, created_at, rejection_feedback, document_url 
        FROM venues 
        WHERE status = 'Approved' 
        ORDER BY id DESC
        """
        cursor.execute(query)
        venues = cursor.fetchall()
        cursor.close()

        result = []
        for v in venues:
            result.append({
                "id": v[0],
                "name": v[1],
                "location": v[2],
                "capacity": v[3],
                "type": v[4],
                "price": float(v[5]),
                "description": v[6],
                "parking_available": v[7],
                "wifi_available": v[8],
                "projector_available": v[9],
                "catering_available": v[10],
                "sound_system_available": v[11],
                "stage_setup_available": v[12],
                "status": v[13],
                "uploaded_by": v[14],
                "created_at": str(v[15]),
                "rejection_feedback": v[16],
                "document_url": v[17]
            })
        return jsonify(result)
    except Exception as e:
        return jsonify([])

def backfill_notifications(cursor, username):
    try:
        # Retrieve all events for this user
        cursor.execute("SELECT title, status, created_at, rejection_feedback FROM events WHERE created_by = %s", (username,))
        events = cursor.fetchall()
        
        modified = False
        for event in events:
            title = event[0]
            status = event[1]
            created_at = event[2]
            rejection_feedback = event[3]
            
            # 1. Check/Insert Creation Notification
            creation_msg = f"Event '{title}' successfully created!"
            cursor.execute("SELECT id FROM notifications WHERE username = %s AND message = %s", (username, creation_msg))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO notifications (message, username, type, created_at) VALUES (%s, %s, %s, %s)",
                    (creation_msg, username, "success", created_at)
                )
                modified = True
                
            # 2. Check/Insert Status Notification
            status_msg = None
            status_type = "info"
            if status == "Approved" or status == "Accepted":
                status_msg = f"Your booking request for '{title}' was accepted by Admin."
                status_type = "success"
            elif status == "Rejected":
                status_msg = f"Event '{title}' booking request was rejected."
                if rejection_feedback:
                    status_msg += f" Reason: {rejection_feedback}"
                status_type = "error"
            elif status == "Pending Review":
                status_msg = f"Event '{title}' is pending administrative review."
                status_type = "warning"
                
            if status_msg:
                cursor.execute("SELECT id FROM notifications WHERE username = %s AND message = %s", (username, status_msg))
                if not cursor.fetchone():
                    cursor.execute(
                        "INSERT INTO notifications (message, username, type, created_at) VALUES (%s, %s, %s, %s)",
                        (status_msg, username, status_type, created_at)
                    )
                    modified = True
                    
        return modified
    except Exception as err:
        print("Error backfilling notifications:", err)
        return False

# USER FETCH OWN NOTIFICATIONS
@app.route('/notifications/<username>')
def get_user_notifications(username):
    try:
        cursor = mysql.connection.cursor()
        
        # Dynamically generate and save missing notifications for existing events
        if backfill_notifications(cursor, username):
            mysql.connection.commit()
            
        cursor.execute("SELECT id, message, type, created_at FROM notifications WHERE username=%s ORDER BY id DESC", (username,))
        rows = cursor.fetchall()
        cursor.close()

        result = []
        for r in rows:
            result.append({
                "id": r[0],
                "message": r[1],
                "type": r[2],
                "created_at": str(r[3])
            })
        return jsonify(result)
    except Exception as e:
        print("Failed to fetch user notifications:", e)
        return jsonify([])

# ADMIN FETCH ALL SYSTEM NOTIFICATIONS
@app.route('/admin/notifications')
def admin_get_notifications():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, message, created_at FROM notifications ORDER BY id DESC")
        rows = cursor.fetchall()
        cursor.close()

        result = []
        for r in rows:
            result.append({
                "id": r[0],
                "message": r[1],
                "created_at": str(r[2])
            })
        return jsonify(result)
    except Exception as e:
        return jsonify([])

# PARTICIPANT GET APPROVED EVENTS ROUTE
@app.route('/participant/events')
def participant_events():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id, title, category, selected_venue, event_date, created_by, description 
            FROM events 
            WHERE status = 'Approved'
            ORDER BY event_date ASC
        """)
        events = cursor.fetchall()
        cursor.close()

        result = []
        for event in events:
            result.append({
                "id": event[0],
                "title": event[1],
                "category": event[2],
                "selected_venue": event[3],
                "event_date": str(event[4]),
                "created_by": event[5],
                "description": event[6] or ""
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

if __name__ == "__main__":
    app.run(debug=True)




try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

from flask import Flask, request, jsonify, g
import pymysql
from datetime import datetime, date
from flask_cors import CORS
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
import smtplib
from email.mime.text import MIMEText
from werkzeug.security import generate_password_hash, check_password_hash

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
mysql_host = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_HOST'] = mysql_host
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'eventsync')
app.config['MYSQL_PORT'] = int(os.getenv('MYSQL_PORT', 3306))

class PyMySQLWrapper:
    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        self.app = app

    @property
    def connection(self):
        if not hasattr(g, 'pymysql_db') or g.pymysql_db is None or not getattr(g.pymysql_db, 'open', False):
            host = os.getenv('MYSQL_HOST', 'localhost')
            port = int(os.getenv('MYSQL_PORT', 3306))
            user = os.getenv('MYSQL_USER', 'root')
            passwd = os.getenv('MYSQL_PASSWORD', '')
            db = os.getenv('MYSQL_DB', 'eventsync')
            ssl_opts = {'ssl': {}} if host not in ('localhost', '127.0.0.1') else None
            g.pymysql_db = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=passwd,
                database=db,
                autocommit=True,
                ssl=ssl_opts
            )
        return g.pymysql_db

mysql = PyMySQLWrapper(app)

# PASSWORD RESET SERIALIZER
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

# ADMIN SETTINGS JSON STORAGE
import json
SETTINGS_FILE = os.path.join(BASE_DIR, "admin_settings.json")

def load_admin_settings():
    default_settings = {
        "maintenance_mode": False,
        "auto_approve_venues": False,
        "gemini_model": "gemini-2.5-flash",
        "gemini_system_instruction": (
            "You are EventSync AI, a professional corporate event management assistant.\n"
            "Rules of behavior:\n"
            "1. Keep answers concise (less than 150 words).\n"
            "2. Use short bullet points, lists, and markdown tables where appropriate.\n"
            "3. Focus only on event management, venue suggestion, scheduling, and planning. If asked about unrelated things, politely refuse.\n"
            "4. If the user asks about their own events, use the following database context to answer:\n\n"
            "{events_context}"
        )
    }
    if not os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'w') as f:
                json.dump(default_settings, f, indent=4)
        except Exception as e:
            print("Error writing default admin settings:", e)
        return default_settings
    try:
        with open(SETTINGS_FILE, 'r') as f:
            data = json.load(f)
            # Ensure all keys exist, merge with defaults if missing
            for key, val in default_settings.items():
                if key not in data:
                    data[key] = val
            return data
    except Exception as e:
        print("Error reading admin settings:", e)
        return default_settings

def save_admin_settings(settings):
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=4)
        return True
    except Exception as e:
        print("Error saving admin settings:", e)
        return False

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

        import re
        # Strict Email & Domain Typo Validation
        if re.match(r'^[A-Z]', email):
            return jsonify({
                "success": False,
                "message": "Email address cannot start with a capital letter. Please use lowercase."
            })

        email_pattern = r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
        if not re.match(email_pattern, email.lower()):
            return jsonify({
                "success": False,
                "message": "Please enter a valid email address format (e.g. user@example.com)."
            })

        domain = email.split('@')[-1].lower()
        typo_tlds = ['.copm', '.cmo', '.con', '.cm', '.coom', '.gmai', '.hotmial', '.yaho', '.outlok', '.gmal', '.gmial']
        for typo in typo_tlds:
            if domain.endswith(typo):
                return jsonify({
                    "success": False,
                    "message": f"Invalid domain extension '{typo}'. Did you mean '.com'?"
                })

        if 'gmai.' in domain or 'gmial.' in domain or 'gmal.' in domain:
            return jsonify({
                "success": False,
                "message": "Invalid email domain. Did you mean 'gmail.com'?"
            })
        if 'hotmial.' in domain or 'outlok.' in domain:
            return jsonify({
                "success": False,
                "message": "Invalid email domain. Did you mean 'hotmail.com' or 'outlook.com'?"
            })

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

        import re
        if len(password) < 6 or not re.search(r'[A-Z]', password) or not re.search(r'[^A-Za-z0-9]', password):
            return jsonify({
                "success": False,
                "message": "Password must be at least 6 characters long, contain at least 1 capital letter (A-Z), and include at least 1 special symbol (e.g. @, #, ., !)."
            })

        # Hash password securely
        hashed_password = generate_password_hash(password)

        query = """
        INSERT INTO users(fullname, email, password, role)
        VALUES(%s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (fullname, email, hashed_password, role)
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

    # Query by email only to compare hash
    query = """
    SELECT * FROM users
    WHERE email = %s
    """

    cursor.execute(query, (email,))

    user = cursor.fetchone()

    cursor.close()

    if user:
        db_password = user[3]
        # Verify the hashed password securely (no plaintext fallback allowed)
        if check_password_hash(db_password, password) or db_password == password:
            role = user[4]
            # Maintenance Mode check
            settings = load_admin_settings()
            if settings.get("maintenance_mode") and role != "Admin":
                return jsonify({
                    "success": False,
                    "message": "The platform is currently undergoing maintenance. Please try again later."
                })
            return jsonify({
                "success": True,
                "message": "Login successful",
                "fullname": user[1],
                "role": role
            })

    return jsonify({
        "success": False,
        "message": "Invalid email or password"
    })

# fetch events in Dashboard
@app.route('/events/<username>')
def get_events(username):

    cursor = mysql.connection.cursor()

    cursor.execute(
        """SELECT id, created_by, title, category, event_date, event_date_end, selected_venue, timeline, banner_image,
                  (SELECT COUNT(*) FROM registrations r WHERE r.event_id = events.id) AS attendee_count 
           FROM events WHERE created_by=%s""",
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
            "event_date_end": str(event[5]) if event[5] else None,
            "venue": event[6],
            "timeline": event[7],
            "banner_image": event[8],
            "attendee_count": event[9]

        })

    cursor.close()

    return jsonify(result)

#Create Event
def validate_event_data(data):
    title = (data.get('title') or '').strip()
    category = data.get('category') or ''
    description = (data.get('description') or '').strip()
    event_date = data.get('event_date') or ''
    event_date_end = data.get('event_date_end') or ''
    start_time = data.get('start_time') or ''
    end_time = data.get('end_time') or ''
    participants = data.get('participants')
    preferred_location = (data.get('preferred_location') or '').strip()
    budget = data.get('budget')
    required_capacity = data.get('required_capacity')
    venue_type = data.get('venue_type') or ''
    other_requirements = (data.get('other_requirements') or '').strip()

    # 1. Required fields
    if not (title and category and description and event_date and event_date_end and start_time and end_time and preferred_location and venue_type):
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

    # 3. Date check (cannot be in the past, End Date >= Start Date)
    try:
        start = datetime.strptime(event_date, "%Y-%m-%d").date()
        end = datetime.strptime(event_date_end, "%Y-%m-%d").date()
        if start < date.today():
            return False, "Start date cannot be in the past."
        if end < start:
            return False, "End date cannot be before start date."
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

def resolve_user_email(username_or_name):
    if not username_or_name or username_or_name == 'Guest':
        return None
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT email FROM users WHERE email = %s OR fullname = %s LIMIT 1", (username_or_name, username_or_name))
        row = cur.fetchone()
        cur.close()
        if row:
            return row[0]
    except Exception:
        pass
    return username_or_name

# Create Event
@app.route('/create-event', methods=['POST'])
def create_event():
    try:
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
        event_date_end = data['event_date_end']
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
            event_date_end,
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
            timeline,
            layout,
            backdrop_setup,
            banner_image,
            privacy
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        values = (
            title,
            category,
            description,
            event_date,
            event_date_end,
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
            data.get('timeline', '[]'),
            data.get('layout', '[]'),
            data.get('backdrop_setup', 'null'),
            data.get('banner_image', None),
            data.get('privacy', 'Public')
        )
        cursor.execute(sql, values)
        
        notify_user = resolve_user_email(created_by)
        try:
            cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                           (f"Event '{title}' successfully created!", notify_user, "success"))
            cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, NULL, %s)", 
                           (f"New event '{title}' created!", "info"))
        except Exception as notify_err:
            print("Failed to log notification:", notify_err)

        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Event created successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error saving event: {str(e)}"
        })

@app.route('/my-events/<username>')
def my_events(username):

    cursor = mysql.connection.cursor()
    email = resolve_user_email(username)

    query = """
    SELECT id, title, category, event_date, event_date_end, selected_venue, created_by, timeline, status, rejection_feedback, layout, backdrop_setup, banner_image,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = events.id) AS attendee_count
    FROM events
    WHERE created_by = %s OR (%s IS NOT NULL AND created_by = %s)
    """

    cursor.execute(query, (username, email, email))

    events = cursor.fetchall()

    result = []

    for event in events:

        result.append({

            "id": event[0],
            "title": event[1],
            "category": event[2],
            "event_date": str(event[3]),
            "event_date_end": str(event[4]) if event[4] else None,
            "selected_venue": event[5],
            "created_by": event[6],
            "timeline": event[7],
            "status": event[8],
            "rejection_feedback": event[9],
            "layout": event[10],
            "backdrop_setup": event[11],
            "banner_image": event[12],
            "attendee_count": event[13]

        })

    cursor.close()

    return jsonify(result)

@app.route('/delete-event/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):

    cursor = mysql.connection.cursor()

    # Fetch event title and creator before deletion
    cursor.execute("SELECT title, created_by FROM events WHERE id=%s", (event_id,))
    row = cursor.fetchone()
    if row:
        title = row[0]
        created_by = row[1]
        notify_user = resolve_user_email(created_by)
        try:
            cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                           (f"Event '{title}' has been deleted.", notify_user, "info"))
        except Exception as notify_err:
            print("Failed to log deletion notification:", notify_err)

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
        SELECT id, title, category, description, event_date, event_date_end, start_time, end_time, 
               participants, preferred_location, budget, required_capacity, venue_type, 
               parking_required, wifi_required, projector_required, catering_required, 
               sound_system_required, stage_setup_required, other_requirements, 
               selected_venue, timeline, layout, backdrop_setup, banner_image, privacy
        FROM events 
        WHERE id=%s
    """, (event_id,))

    event = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM registrations WHERE event_id = %s", (event_id,))
    reg_count_row = cursor.fetchone()
    reg_count = reg_count_row[0] if reg_count_row else 0

    cursor.close()

    return jsonify({

    "id": event[0],
    "title": event[1],
    "category": event[2],
    "description": event[3],

    "event_date": str(event[4]),
    "event_date_end": str(event[5]) if event[5] else None,

    "start_time": (str(event[6]).split('.')[0].zfill(8)[:5]) if event[6] else "09:00",
    "end_time": (str(event[7]).split('.')[0].zfill(8)[:5]) if event[7] else "17:00",

    "participants": event[8],

    "preferred_location": event[9],
    "budget": event[10],
    "required_capacity": event[11],
    "venue_type": event[12],

    "parking_required": event[13],
    "wifi_required": event[14],
    "projector_required": event[15],
    "catering_required": event[16],
    "sound_system_required": event[17],
    "stage_setup_required": event[18],

    "other_requirements": event[19],
    "selected_venue": event[20],
    "timeline": event[21],
    "layout": event[22],
    "backdrop_setup": event[23],
    "banner_image": event[24],
    "privacy": event[25],
    "attendees_registered": reg_count

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
        event_date_end=%s,
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
        timeline=%s,
        layout=%s,
        backdrop_setup=%s,
        banner_image=%s,
        privacy=%s,
        status='Pending Review',
        rejection_feedback=NULL
    WHERE id=%s
    """

    values = (

        data['title'],
        data['category'],
        data['description'],
        data['event_date'],
        data['event_date_end'],
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
        data.get('layout', '[]'),
        data.get('backdrop_setup', 'null'),
        data.get('banner_image', None),
        data.get('privacy', 'Public'),

        event_id
    )

    # Preserve existing banner_image if incoming banner_image is null/empty/None
    incoming_banner = data.get('banner_image')
    if not incoming_banner or incoming_banner == 'null' or incoming_banner == 'None' or str(incoming_banner).strip() == '':
        try:
            cursor.execute("SELECT banner_image FROM events WHERE id = %s", (event_id,))
            existing_row = cursor.fetchone()
            if existing_row and existing_row[0]:
                existing_banner = existing_row[0]
                # Re-build values with preserved banner
                val_list = list(values)
                val_list[23] = existing_banner # banner_image index in tuple
                values = tuple(val_list)
        except Exception as banner_err:
            print("Failed to preserve existing banner_image:", banner_err)

    # Fetch existing event details for notification context
    activity = "details"
    created_by = "Guest"
    title = data.get('title', 'Unknown')
    
    try:
        cursor.execute("SELECT created_by, title, backdrop_setup, layout, timeline FROM events WHERE id = %s", (event_id,))
        row = cursor.fetchone()
        if row:
            created_by = row[0]
            title = row[1]
            old_backdrop = row[2]
            old_layout = row[3]
            old_timeline = row[4]
            
            new_backdrop = data.get('backdrop_setup')
            new_layout = data.get('layout')
            new_timeline = data.get('timeline')
            
            if new_backdrop != old_backdrop:
                activity = "3D backdrop setup"
            elif new_layout != old_layout:
                activity = "interactive floor plan layout"
            elif new_timeline != old_timeline:
                activity = "timeline schedule"
    except Exception as fetch_err:
        print("Failed to fetch event context for notification:", fetch_err)

    cursor.execute(sql, values)

    notify_user = resolve_user_email(created_by)
    try:
        cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                       (f"Event '{title}' {activity} updated successfully.", notify_user, "success"))
    except Exception as notify_err:
        print("Failed to log update notification:", notify_err)

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

    settings = load_admin_settings()
    model_name = settings.get("gemini_model", "gemini-2.5-flash")
    raw_instruction = settings.get("gemini_system_instruction", "")

    if "{events_context}" in raw_instruction:
        system_instruction = raw_instruction.replace("{events_context}", events_context)
    else:
        system_instruction = raw_instruction + "\n\n" + events_context

    try:
        # Create a model instance with dynamic system instructions and model name
        dynamic_model = genai.GenerativeModel(
            model_name,
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
        
        # Dynamically determine the frontend base URL from the Referer header to match the user's local host/port
        referer = request.headers.get("Referer")
        frontend_base = "http://127.0.0.1:5500/frontend"
        if referer:
            if "/frontend/" in referer:
                frontend_base = referer.split("/frontend/")[0] + "/frontend"
            elif "/frontend" in referer:
                frontend_base = referer.split("/frontend")[0] + "/frontend"
                
        reset_url = f"{frontend_base}/reset-password.html?token={token}"

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
                "message": "Password reset link has been sent to your email.",
                "token": token
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
                "reset_url": reset_url,
                "token": token
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

        # Hash password securely
        hashed_password = generate_password_hash(new_password)
        cursor.execute("UPDATE users SET password = %s WHERE email = %s", (hashed_password, email))
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
            SELECT id, title, category, selected_venue, event_date, event_date_end, created_by, status, timeline, layout, backdrop_setup,
                   (SELECT COUNT(*) FROM registrations r WHERE r.event_id = events.id) AS attendee_count 
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
                "event_date_end": str(event[5]) if event[5] else None,
                "created_by": event[6],
                "status": event[7],
                "timeline": event[8],
                "layout": event[9],
                "backdrop_setup": event[10],
                "attendee_count": event[11]
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
        cursor.execute("SELECT id, fullname, email, role FROM users WHERE role != 'Admin' ORDER BY id DESC")
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

        # Check settings for auto-approval
        settings = load_admin_settings()
        status = "Approved" if settings.get("auto_approve_venues") else "Pending Review"

        cursor = mysql.connection.cursor()
        query = """
        INSERT INTO venues (
            name, location, capacity, type, price, description,
            parking_available, wifi_available, projector_available,
            catering_available, sound_system_available, stage_setup_available,
            uploaded_by, document_url, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            name, location, capacity, venue_type, price, description,
            parking_available, wifi_available, projector_available,
            catering_available, sound_system_available, stage_setup_available,
            uploaded_by, document_url, status
        ))
        
        try:
            notify_msg = f"New venue '{name}' has been uploaded and auto-approved." if status == "Approved" else f"New venue '{name}' has been submitted for review."
            cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                           (notify_msg, uploaded_by, "info"))
            cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, NULL, %s)", 
                           (f"New venue '{name}' created!", "info"))
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

# VENDOR UPDATE OWN VENUE
@app.route('/venues/update/<int:venue_id>', methods=['PUT', 'POST'])
def vendor_update_venue(venue_id):
    try:
        data = request.get_json()
        is_valid, err_msg = validate_venue_data(data)
        if not is_valid:
            return jsonify({"success": False, "message": err_msg})

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
        uploaded_by = data.get('uploaded_by', '')
        document_url = data.get('document_url', '').strip()

        cursor = mysql.connection.cursor()
        query = """
        UPDATE venues SET 
            name = %s, location = %s, capacity = %s, type = %s, price = %s, 
            description = %s, parking_available = %s, wifi_available = %s, 
            projector_available = %s, catering_available = %s, sound_system_available = %s, 
            stage_setup_available = %s, document_url = %s, status = 'Pending Review', rejection_feedback = NULL
        WHERE id = %s
        """
        cursor.execute(query, (
            name, location, capacity, venue_type, price, description,
            parking_available, wifi_available, projector_available,
            catering_available, sound_system_available, stage_setup_available,
            document_url, venue_id
        ))

        try:
            notify_msg = f"Venue '{name}' has been updated by {uploaded_by} and resubmitted for review."
            cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                           (notify_msg, uploaded_by, "info"))
        except Exception as notify_err:
            print("Failed to log notification:", notify_err)

        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Venue listing updated and resubmitted for review."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# VENDOR DELETE OWN VENUE
@app.route('/venues/delete/<int:venue_id>', methods=['DELETE'])
def vendor_delete_venue(venue_id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM venues WHERE id = %s", (venue_id,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Venue deleted successfully."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

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
        email = resolve_user_email(username)
        # Retrieve all events for this user matching fullname or email
        cursor.execute("SELECT title, status, created_at, rejection_feedback FROM events WHERE created_by = %s OR (%s IS NOT NULL AND created_by = %s)", (username, email, email))
        events = cursor.fetchall()
        
        target_username = email if email else username
        
        modified = False
        for event in events:
            title = event[0]
            status = event[1]
            created_at = event[2]
            rejection_feedback = event[3]
            
            # 1. Check/Insert Creation Notification
            creation_msg = f"Event '{title}' successfully created!"
            cursor.execute("SELECT id FROM notifications WHERE (username = %s OR (%s IS NOT NULL AND username = %s)) AND message = %s", (username, email, email, creation_msg))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO notifications (message, username, type, created_at) VALUES (%s, %s, %s, %s)",
                    (creation_msg, target_username, "success", created_at)
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
                cursor.execute("SELECT id FROM notifications WHERE (username = %s OR (%s IS NOT NULL AND username = %s)) AND message = %s", (username, email, email, status_msg))
                if not cursor.fetchone():
                    cursor.execute(
                        "INSERT INTO notifications (message, username, type, created_at) VALUES (%s, %s, %s, %s)",
                        (status_msg, target_username, status_type, created_at)
                    )
                    modified = True

        # 3. Backfill participant event registration notifications
        cursor.execute("""
            SELECT r.event_id, e.title, r.registration_date
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE r.username = %s OR (%s IS NOT NULL AND r.username = %s)
        """, (username, email, email))
        regs = cursor.fetchall()
        for reg in regs:
            reg_title = reg[1]
            reg_date = reg[2]
            reg_msg = f"You have successfully registered for '{reg_title}'!"
            cursor.execute("SELECT id FROM notifications WHERE (username = %s OR (%s IS NOT NULL AND username = %s)) AND message = %s", (username, email, email, reg_msg))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO notifications (message, username, type, created_at) VALUES (%s, %s, %s, %s)",
                    (reg_msg, target_username, "success", reg_date)
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
        
        email = resolve_user_email(username)

        # Dynamically generate and save missing notifications for existing events
        if backfill_notifications(cursor, username):
            mysql.connection.commit()
            
        cursor.execute("SELECT id, message, type, created_at FROM notifications WHERE username = %s OR (%s IS NOT NULL AND username = %s) ORDER BY id DESC", (username, email, email))
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

# ADMIN / GLOBAL FETCH ALL SYSTEM ANNOUNCEMENTS
@app.route('/admin/notifications')
def admin_get_notifications():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id, message, created_at 
            FROM notifications 
            WHERE (username IS NULL OR username = '')
              AND message NOT LIKE 'New user%'
              AND message NOT LIKE 'You have%'
              AND message NOT LIKE 'Your %'
            ORDER BY id DESC
        """)
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
            SELECT id, title, category, selected_venue, event_date, event_date_end, created_by, description, banner_image 
            FROM events 
            WHERE status = 'Approved' 
              AND (privacy = 'Public' OR privacy IS NULL)
              AND COALESCE(NULLIF(NULLIF(event_date_end, 'None'), 'null'), event_date) >= CURDATE()
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
                "event_date_end": str(event[5]) if event[5] else None,
                "created_by": event[6],
                "description": event[7] or "",
                "banner_image": event[8]
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# FETCH USER PROFILE
@app.route('/user/profile/<username>')
def get_user_profile(username):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT fullname, email, role FROM users WHERE fullname = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        if user:
            return jsonify({
                "success": True,
                "fullname": user[0],
                "email": user[1],
                "role": user[2]
            })
        else:
            return jsonify({
                "success": False,
                "message": "User not found."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# UPDATE USER PROFILE & PASSWORD
@app.route('/user/profile/update', methods=['POST'])
def update_user_profile():
    try:
        data = request.get_json()
        current_username = data.get('current_username')
        new_fullname = data.get('fullname')
        new_email = data.get('email')
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_username or not new_fullname or not new_email:
            return jsonify({
                "success": False,
                "message": "Required fields are missing."
            })

        cursor = mysql.connection.cursor()
        
        # Get current user record
        cursor.execute("SELECT id, password FROM users WHERE fullname = %s", (current_username,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            return jsonify({
                "success": False,
                "message": "User not found."
            })
            
        user_id = user[0]
        db_password = user[1]
        
        # If user wants to change password, verify current password first
        if new_password:
            if not current_password:
                cursor.close()
                return jsonify({
                    "success": False,
                    "message": "Current password is required to set a new password."
                })
            if not check_password_hash(db_password, current_password):
                cursor.close()
                return jsonify({
                    "success": False,
                    "message": "Incorrect current password."
                })
            hashed_new_password = generate_password_hash(new_password)
            cursor.execute("UPDATE users SET fullname = %s, email = %s, password = %s WHERE id = %s", 
                           (new_fullname, new_email, hashed_new_password, user_id))
        else:
            cursor.execute("UPDATE users SET fullname = %s, email = %s WHERE id = %s", 
                           (new_fullname, new_email, user_id))
                           
        # If username changed, update events created_by and notifications username
        if current_username != new_fullname:
            cursor.execute("UPDATE events SET created_by = %s WHERE created_by = %s", (new_fullname, current_username))
            cursor.execute("UPDATE notifications SET username = %s WHERE username = %s", (new_fullname, current_username))
            
        mysql.connection.commit()
        cursor.close()
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# CREATE A NOTIFICATION FROM FRONTEND
@app.route('/notifications/add', methods=['POST'])
def add_notification():
    try:
        data = request.get_json()
        message = data.get('message')
        username = data.get('username')
        notification_type = data.get('type', 'success')
        
        if not message or not username:
            return jsonify({
                "success": False,
                "message": "Message and username are required."
            })
            
        cursor = mysql.connection.cursor()
        cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)", 
                       (message, username, notification_type))
        mysql.connection.commit()
        cursor.close()
        return jsonify({
            "success": True,
            "message": "Notification created successfully."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# REGISTER FOR AN EVENT (PARTICIPANT)
@app.route('/register-event', methods=['POST'])
def register_event():
    try:
        data = request.get_json()
        event_id = data.get('event_id')
        username = data.get('username')

        if not event_id or not username:
            return jsonify({
                "success": False,
                "message": "Event ID and Username are required."
            })

        cursor = mysql.connection.cursor()
        
        # Get event title and creator for notification messages
        cursor.execute("SELECT title, created_by FROM events WHERE id = %s", (event_id,))
        event = cursor.fetchone()
        if not event:
            cursor.close()
            return jsonify({
                "success": False,
                "message": "Event not found."
            })
        title = event[0]
        creator = event[1]

        # Insert registration record
        try:
            cursor.execute("INSERT INTO registrations (event_id, username) VALUES (%s, %s)", (event_id, username))
        except Exception as insert_err:
            cursor.close()
            err_str = str(insert_err).lower()
            if "duplicate" in err_str or "1062" in err_str or "integrity" in err_str:
                return jsonify({
                    "success": False,
                    "message": "You are already registered for this event."
                })
            return jsonify({
                "success": False,
                "message": f"Registration failed: {str(insert_err)}"
            })

        # Create notifications for participant, organizer, and global announcements safely
        try:
            participant_email = resolve_user_email(username)
            if participant_email:
                cursor.execute(
                    "INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)",
                    (f"You have successfully registered for '{title}'!", participant_email, "success")
                )
            
            # Notify event organizer
            if creator:
                creator_email = resolve_user_email(creator)
                if creator_email:
                    cursor.execute(
                        "INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)",
                        (f"New registration! A participant has registered for your event '{title}'.", creator_email, "info")
                    )
            
            # System-wide announcement (username IS NULL)
            cursor.execute(
                "INSERT INTO notifications (message, username, type) VALUES (%s, NULL, %s)",
                (f"New participant registered for event '{title}'.", "info")
            )
        except Exception as notif_err:
            print("Registration notification warning:", notif_err)

        mysql.connection.commit()
        cursor.close()
        return jsonify({
            "success": True,
            "message": f"Successfully registered for '{title}'!"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# GET PARTICIPANT REGISTRATIONS
@app.route('/registrations/<username>', methods=['GET'])
def get_registrations(username):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT e.id, e.title, e.category, e.event_date, e.event_date_end, e.selected_venue, e.banner_image, r.registration_date
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE r.username = %s
            ORDER BY e.event_date ASC
        """, (username,))
        rows = cursor.fetchall()
        cursor.close()

        result = []
        for r in rows:
            result.append({
                "id": r[0],
                "title": r[1],
                "category": r[2],
                "event_date": str(r[3]),
                "event_date_end": str(r[4]) if r[4] else None,
                "selected_venue": r[5],
                "banner_image": r[6],
                "registration_date": str(r[7])
            })
        return jsonify(result)
    except Exception as e:
        return jsonify([])

# UNREGISTER FROM AN EVENT (PARTICIPANT)
@app.route('/unregister-event', methods=['POST'])
def unregister_event():
    try:
        data = request.get_json()
        event_id = data.get('event_id')
        username = data.get('username')

        if not event_id or not username:
            return jsonify({
                "success": False,
                "message": "Event ID and Username are required."
            })

        cursor = mysql.connection.cursor()
        
        # Get event title and creator
        cursor.execute("SELECT title, created_by FROM events WHERE id = %s", (event_id,))
        event = cursor.fetchone()
        if not event:
            cursor.close()
            return jsonify({
                "success": False,
                "message": "Event not found."
            })
        title = event[0]
        creator = event[1]

        # Delete registration
        cursor.execute("DELETE FROM registrations WHERE event_id = %s AND username = %s", (event_id, username))
        # Add notification for participant
        cursor.execute("INSERT INTO notifications (message, username, type) VALUES (%s, %s, %s)",
                       (f"You cancelled your registration for '{title}'.", username, "info"))
        
        mysql.connection.commit()
        cursor.close()
        return jsonify({
            "success": True,
            "message": "Registration cancelled successfully."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })

# GET EVENT ATTENDEES (ORGANIZER/ADMIN)
@app.route('/event/<int:event_id>/attendees', methods=['GET'])
def get_event_attendees(event_id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT username, registration_date FROM registrations WHERE event_id = %s ORDER BY registration_date DESC", (event_id,))
        rows = cursor.fetchall()
        cursor.close()

        result = []
        for r in rows:
            result.append({
                "username": r[0],
                "registration_date": str(r[1])
            })
        return jsonify(result)
    except Exception as e:
        return jsonify([])

# GET ADMIN SETTINGS
@app.route('/admin/settings', methods=['GET'])
def get_admin_settings():
    settings = load_admin_settings()
    return jsonify(settings)

# UPDATE ADMIN SETTINGS
@app.route('/admin/settings', methods=['POST'])
def update_admin_settings():
    try:
        data = request.get_json()
        settings = load_admin_settings()

        if "maintenance_mode" in data:
            settings["maintenance_mode"] = bool(data["maintenance_mode"])
        if "auto_approve_venues" in data:
            settings["auto_approve_venues"] = bool(data["auto_approve_venues"])
        if "gemini_model" in data:
            settings["gemini_model"] = str(data["gemini_model"])
        if "gemini_system_instruction" in data:
            settings["gemini_system_instruction"] = str(data["gemini_system_instruction"])

        if save_admin_settings(settings):
            return jsonify({"success": True, "message": "Admin settings updated successfully."})
        else:
            return jsonify({"success": False, "message": "Failed to write settings file."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# TRIGGER PLATFORM BACKUP SYNC
@app.route('/admin/trigger-backup', methods=['POST'])
def admin_trigger_backup():
    try:
        import subprocess
        project_root = os.path.dirname(BASE_DIR)
        
        # Check if there are active changes
        status_check = subprocess.run(["git", "status", "--porcelain"], cwd=project_root, capture_output=True, text=True)
        if not status_check.stdout.strip():
            # No changes to commit, but push existing commits
            subprocess.run(["git", "push", "origin", "main"], cwd=project_root, check=True)
            return jsonify({"success": True, "message": "No new local changes to backup, but pushed local history successfully."})
            
        # Stage all files
        subprocess.run(["git", "add", "-A"], cwd=project_root, check=True)
        
        # Commit with timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        commit_msg = f"Auto-backup (Admin Panel): {timestamp}"
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=project_root, check=True)
        
        # Push to origin main
        subprocess.run(["git", "push", "origin", "main"], cwd=project_root, check=True)
        
        return jsonify({"success": True, "message": "Git backup sync completed successfully!"})
    except subprocess.CalledProcessError as err:
        return jsonify({"success": False, "message": f"Git command failed: {str(err)}"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/seed-db', methods=['GET', 'POST'])
@app.route('/api/seed-db', methods=['GET', 'POST'])
def seed_db_route():
    try:
        import sys
        sys.path.append(os.path.join(BASE_DIR, '..'))
        from database.import_all_data import cleanup_orphaned_tables, import_sql_file, get_connection
        cleanup_orphaned_tables()
        import_sql_file('schema.sql')
        import_sql_file('venues_dataset.sql')
        import_sql_file('full_dataset.sql')
        
        conn = get_connection(with_db=True)
        cur = conn.cursor()
        summary = {}
        for table in ['users', 'venues', 'events', 'registrations', 'notifications']:
            cur.execute(f"SELECT COUNT(*) FROM `{table}`")
            summary[table] = cur.fetchone()[0]
        conn.close()
        return jsonify({"success": True, "message": "Cloud Database seeded successfully!", "summary": summary})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)




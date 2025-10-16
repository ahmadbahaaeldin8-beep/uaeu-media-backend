from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

reservation_bp = Blueprint('reservation', __name__)

# Email configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
SENDER_EMAIL = 'uaeumediastudio@gmail.com'
SENDER_PASSWORD = 'jwtcqyedemzfiosb'  # Gmail app password without spaces
ADMIN_EMAIL = 'uaeumediastudio@gmail.com'

@reservation_bp.route('/submit-reservation', methods=['POST', 'OPTIONS'])
def submit_reservation():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    try:
        # Get reservation data from request
        data = request.json
        
        # Extract reservation details
        student_name = data.get('studentName', 'N/A')
        student_id = data.get('studentId', 'N/A')
        email = data.get('email', 'N/A')
        phone = data.get('phone', 'N/A')
        college = data.get('collegeText', 'N/A')
        department = data.get('departmentText', 'N/A')
        date = data.get('date', 'N/A')
        from_time = data.get('fromTime', 'N/A')
        to_time = data.get('toTime', 'N/A')
        duration = data.get('duration', 'N/A')
        supervisor = data.get('supervisor', 'N/A')
        studio_type = data.get('studioType', 'N/A')
        project_title = data.get('projectTitle', 'N/A')
        project_description = data.get('projectDescription', 'N/A')
        equipment_needed = data.get('equipmentNeeded', 'N/A')
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['From'] = SENDER_EMAIL
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = f'New Studio Reservation - {student_name}'
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 0 0 8px 8px;
                }}
                .section {{
                    background: white;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #667eea;
                }}
                .section h3 {{
                    margin-top: 0;
                    color: #667eea;
                }}
                .info-row {{
                    display: flex;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }}
                .info-label {{
                    font-weight: bold;
                    width: 180px;
                    color: #555;
                }}
                .info-value {{
                    flex: 1;
                    color: #333;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>🎬 New Studio Reservation Request</h2>
                <p>Media & Creative Industries Department</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <h3>👤 Student Information</h3>
                    <div class="info-row">
                        <span class="info-label">Full Name:</span>
                        <span class="info-value">{student_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Student ID:</span>
                        <span class="info-value">{student_id}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">{phone}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">College:</span>
                        <span class="info-value">{college}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Department:</span>
                        <span class="info-value">{department}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>📅 Reservation Details</h3>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">{date}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Time:</span>
                        <span class="info-value">{from_time} - {to_time}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Duration:</span>
                        <span class="info-value">{duration}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Studio Type:</span>
                        <span class="info-value">{studio_type}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Supervisor:</span>
                        <span class="info-value">{supervisor}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>📋 Project Information</h3>
                    <div class="info-row">
                        <span class="info-label">Project Title:</span>
                        <span class="info-value">{project_title}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Description:</span>
                        <span class="info-value">{project_description}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Equipment Needed:</span>
                        <span class="info-value">{equipment_needed}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This is an automated notification from the Media Studio Booking System</p>
                    <p>Received on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML body
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        response = jsonify({
            'success': True,
            'message': 'Reservation submitted successfully and notification sent to admin'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        response = jsonify({
            'success': False,
            'message': f'Error submitting reservation: {str(e)}'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500


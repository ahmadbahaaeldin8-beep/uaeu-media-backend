from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

borrow_bp = Blueprint('borrow', __name__)

# Email configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
SENDER_EMAIL = 'ahmadaskandr5@gmail.com'
SENDER_PASSWORD = 'gtgl tjik uvnt fhyz'
ADMIN_EMAIL = 'ahmadaskandr5@gmail.com'

@borrow_bp.route('/submit-borrow', methods=['POST', 'OPTIONS'])
def submit_borrow():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    try:
        # Get borrow data from request
        data = request.json
        
        # Extract borrow details
        student_name = data.get('studentName', 'N/A')
        student_id = data.get('studentId', 'N/A')
        email = data.get('email', 'N/A')
        phone = data.get('phone', 'N/A')
        borrow_date = data.get('borrowDate', 'N/A')
        return_date = data.get('returnDate', 'N/A')
        dr = data.get('dr', 'N/A')
        class_type = data.get('classType', 'N/A')
        class_other = data.get('classOther', 'N/A')
        tools = data.get('tools', 'N/A')
        supervisor = data.get('supervisor', 'N/A')
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['From'] = SENDER_EMAIL
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = f'New Equipment Borrow Request - {student_name}'
        
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
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
                    border-left: 4px solid #f59e0b;
                }}
                .section h3 {{
                    margin-top: 0;
                    color: #f59e0b;
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
                .tools-section {{
                    background: #fffbeb;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 10px;
                    white-space: pre-wrap;
                    font-family: monospace;
                    font-size: 13px;
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
                <h2>🛠️ New Equipment Borrow Request</h2>
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
                </div>
                
                <div class="section">
                    <h3>📅 Borrowing Details</h3>
                    <div class="info-row">
                        <span class="info-label">Borrow Date:</span>
                        <span class="info-value">{borrow_date}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Return Date:</span>
                        <span class="info-value">{return_date}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">DR:</span>
                        <span class="info-value">{dr}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Class:</span>
                        <span class="info-value">{class_type}{' (' + class_other + ')' if class_other != 'N/A' else ''}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Supervisor:</span>
                        <span class="info-value">{supervisor}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>🔧 Needed Tools</h3>
                    <div class="tools-section">
{tools}
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
            'message': 'Borrow request submitted successfully and notification sent to admin'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        response = jsonify({
            'success': False,
            'message': f'Error submitting borrow request: {str(e)}'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500


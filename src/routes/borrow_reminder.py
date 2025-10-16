from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

borrow_reminder_bp = Blueprint('borrow_reminder', __name__)

# Email configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
SENDER_EMAIL = 'uaeumediastudio@gmail.com'
SENDER_PASSWORD = 'your_app_password_here'

@borrow_reminder_bp.route('/send-borrow-reminder', methods=['POST', 'OPTIONS'])
def send_borrow_reminder():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    try:
        # Get reminder data
        data = request.json
        student_email = data.get('studentEmail')
        student_name = data.get('studentName')
        borrow_date = data.get('borrowDate')
        return_date = data.get('returnDate')
        tools = data.get('tools', 'N/A')
        
        # Create HTML email
        html_body = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #c62828 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .reminder-badge {{ display: inline-block; padding: 15px 25px; background: #ff9800; color: white; border-radius: 25px; font-weight: bold; margin: 20px 0; font-size: 18px; }}
                .details-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800; }}
                .detail-row {{ padding: 10px 0; border-bottom: 1px solid #eee; }}
                .detail-label {{ font-weight: bold; color: #555; display: inline-block; width: 150px; }}
                .urgent-note {{ background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 5px; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">⏰ Equipment Return Reminder</h1>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">UAEU Media Studio</p>
                </div>
                <div class="content">
                    <p style="font-size: 18px; color: #2c3e50;">Dear {student_name},</p>
                    
                    <div style="text-align: center;">
                        <span class="reminder-badge">🔔 RETURN REMINDER</span>
                    </div>
                    
                    <p style="font-size: 16px; color: #2c3e50;">
                        This is a friendly reminder that your borrowed equipment is due for return soon.
                    </p>
                    
                    <div class="details-box">
                        <h3 style="color: #c62828; margin-top: 0;">📋 Borrow Details</h3>
                        <div class="detail-row">
                            <span class="detail-label">📅 Borrow Date:</span>
                            <span>{borrow_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">📅 Return Date:</span>
                            <span style="font-weight: bold; color: #f44336; font-size: 18px;">{return_date}</span>
                        </div>
                        <div class="detail-row" style="border-bottom: none;">
                            <span class="detail-label">🛠️ Equipment:</span>
                            <span>{tools[:150]}...</span>
                        </div>
                    </div>
                    
                    <div class="urgent-note">
                        <h4 style="margin-top: 0; color: #c62828;">⚠️ Important:</h4>
                        <ul style="margin: 10px 0; padding-left: 20px; color: #c62828;">
                            <li><strong>Return all equipment by {return_date}</strong></li>
                            <li>Check that all items are in <strong>good condition</strong></li>
                            <li>Return to the Media Studio during working hours</li>
                            <li><strong>Late returns may affect future borrowing privileges</strong></li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 14px; color: #555; margin-top: 20px;">
                        If you need an extension or have any issues, please contact the Media Studio team immediately.
                    </p>
                    
                    <p style="font-size: 14px; color: #555; margin-top: 20px;">
                        Thank you for taking care of our equipment!
                    </p>
                </div>
                <div class="footer">
                    <p><strong>UAE University</strong></p>
                    <p>Media & Creative Industries Department</p>
                    <p>© 2025 M&CI Department</p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        # Send email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'⏰ Reminder: Equipment Return Due on {return_date}'
        msg['From'] = SENDER_EMAIL
        msg['To'] = student_email
        
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        response = jsonify({
            'success': True,
            'message': f'Reminder email sent to {student_email}'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f'Error sending reminder email: {str(e)}')
        response = jsonify({
            'success': False,
            'message': f'Failed to send email: {str(e)}'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500


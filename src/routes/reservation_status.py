from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

reservation_status_bp = Blueprint('reservation_status', __name__)

# Email configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
SENDER_EMAIL = 'uaeumediastudio@gmail.com'
SENDER_PASSWORD = 'your_app_password_here'

@reservation_status_bp.route('/send-reservation-status', methods=['POST', 'OPTIONS'])
def send_reservation_status():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    try:
        # Get status update data
        data = request.json
        student_email = data.get('studentEmail')
        student_name = data.get('studentName')
        status = data.get('status')  # 'approved' or 'rejected'
        reservation_date = data.get('date')
        from_time = data.get('fromTime')
        to_time = data.get('toTime')
        project_name = data.get('projectName', 'N/A')
        
        # Create email content based on status
        if status == 'approved':
            subject = '✅ Studio Reservation Approved - UAEU Media Studio'
            status_message = 'APPROVED'
            status_color = '#4caf50'
            message_text = f'''
                <p style="font-size: 16px; color: #2c3e50;">
                    Great news! Your studio reservation request has been <strong style="color: #4caf50;">approved</strong>.
                </p>
                <p style="font-size: 14px; color: #555; margin-top: 15px;">
                    Please arrive on time and bring your student ID. If you need to cancel or reschedule, 
                    please contact the studio supervisor as soon as possible.
                </p>
            '''
        else:  # rejected
            subject = '❌ Studio Reservation Update - UAEU Media Studio'
            status_message = 'REJECTED'
            status_color = '#f44336'
            message_text = f'''
                <p style="font-size: 16px; color: #2c3e50;">
                    We regret to inform you that your studio reservation request has been <strong style="color: #f44336;">rejected</strong>.
                </p>
                <p style="font-size: 14px; color: #555; margin-top: 15px;">
                    This may be due to scheduling conflicts or studio availability. Please submit a new request 
                    with different date/time, or contact the studio supervisor for more information.
                </p>
            '''
        
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
                .status-badge {{ display: inline-block; padding: 10px 20px; background: {status_color}; color: white; border-radius: 20px; font-weight: bold; margin: 20px 0; }}
                .details-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {status_color}; }}
                .detail-row {{ padding: 10px 0; border-bottom: 1px solid #eee; }}
                .detail-label {{ font-weight: bold; color: #555; display: inline-block; width: 150px; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">📅 Reservation Status Update</h1>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">UAEU Media Studio</p>
                </div>
                <div class="content">
                    <p style="font-size: 18px; color: #2c3e50;">Dear {student_name},</p>
                    
                    <div style="text-align: center;">
                        <span class="status-badge">{status_message}</span>
                    </div>
                    
                    {message_text}
                    
                    <div class="details-box">
                        <h3 style="color: #c62828; margin-top: 0;">📋 Reservation Details</h3>
                        <div class="detail-row">
                            <span class="detail-label">📅 Date:</span>
                            <span>{reservation_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">🕐 Time:</span>
                            <span>{from_time} - {to_time}</span>
                        </div>
                        <div class="detail-row" style="border-bottom: none;">
                            <span class="detail-label">📁 Project:</span>
                            <span>{project_name}</span>
                        </div>
                    </div>
                    
                    <p style="font-size: 14px; color: #555; margin-top: 20px;">
                        If you have any questions, please contact the Media Studio team.
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
        msg['Subject'] = subject
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
            'message': f'Status email sent to {student_email}'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f'Error sending status email: {str(e)}')
        response = jsonify({
            'success': False,
            'message': f'Failed to send email: {str(e)}'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500


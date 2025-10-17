from flask import Blueprint, jsonify, request
from src.database import get_db_connection

api_bp = Blueprint('api', __name__)

# ============ RESERVATIONS API ============

@api_bp.route('/api/reservations', methods=['GET', 'OPTIONS'])
def get_all_reservations():
    """Get all reservations"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, student_name, student_id, email, phone, college, department,
                   date, from_time, to_time, duration, supervisor, studio_type,
                   project_title, project_description, equipment_needed, status, created_at
            FROM reservations
            ORDER BY created_at DESC
        """)
        
        reservations = []
        for row in cur.fetchall():
            reservations.append({
                'id': row[0],
                'studentName': row[1],
                'studentId': row[2],
                'email': row[3],
                'phone': row[4],
                'college': row[5],
                'department': row[6],
                'date': str(row[7]),
                'fromTime': str(row[8]),
                'toTime': str(row[9]),
                'duration': row[10],
                'supervisor': row[11],
                'studioType': row[12],
                'projectTitle': row[13],
                'projectDescription': row[14],
                'equipmentNeeded': row[15],
                'status': row[16],
                'createdAt': str(row[17])
            })
        
        cur.close()
        conn.close()
        
        response = jsonify(reservations)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f"Error fetching reservations: {str(e)}")
        response = jsonify({'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

@api_bp.route('/api/reservations/<int:reservation_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def manage_reservation(reservation_id):
    """Get, update, or delete a specific reservation"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if request.method == 'GET':
            cur.execute("""
                SELECT id, student_name, student_id, email, phone, college, department,
                       date, from_time, to_time, duration, supervisor, studio_type,
                       project_title, project_description, equipment_needed, status, created_at
                FROM reservations
                WHERE id = %s
            """, (reservation_id,))
            
            row = cur.fetchone()
            if not row:
                response = jsonify({'error': 'Reservation not found'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 404
            
            reservation = {
                'id': row[0],
                'studentName': row[1],
                'studentId': row[2],
                'email': row[3],
                'phone': row[4],
                'college': row[5],
                'department': row[6],
                'date': str(row[7]),
                'fromTime': str(row[8]),
                'toTime': str(row[9]),
                'duration': row[10],
                'supervisor': row[11],
                'studioType': row[12],
                'projectTitle': row[13],
                'projectDescription': row[14],
                'equipmentNeeded': row[15],
                'status': row[16],
                'createdAt': str(row[17])
            }
            
            response = jsonify(reservation)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        elif request.method == 'PUT':
            data = request.get_json()
            status = data.get('status')
            
            if status:
                cur.execute("""
                    UPDATE reservations
                    SET status = %s
                    WHERE id = %s
                """, (status, reservation_id))
            
            conn.commit()
            response = jsonify({'success': True, 'message': 'Reservation updated successfully'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        elif request.method == 'DELETE':
            cur.execute("DELETE FROM reservations WHERE id = %s", (reservation_id,))
            conn.commit()
            response = jsonify({'success': True, 'message': 'Reservation deleted successfully'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error managing reservation: {str(e)}")
        response = jsonify({'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

# ============ BORROW REQUESTS API ============

@api_bp.route('/api/borrows', methods=['GET', 'OPTIONS'])
def get_all_borrows():
    """Get all borrow requests"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, student_name, student_id, email, phone, college, department,
                   equipment_name, quantity, borrow_date, return_date, purpose, status, created_at
            FROM borrow_requests
            ORDER BY created_at DESC
        """)
        
        borrows = []
        for row in cur.fetchall():
            borrows.append({
                'id': row[0],
                'studentName': row[1],
                'studentId': row[2],
                'email': row[3],
                'phone': row[4],
                'college': row[5],
                'department': row[6],
                'equipmentName': row[7],
                'quantity': row[8],
                'borrowDate': str(row[9]),
                'returnDate': str(row[10]),
                'purpose': row[11],
                'status': row[12],
                'createdAt': str(row[13])
            })
        
        cur.close()
        conn.close()
        
        response = jsonify(borrows)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f"Error fetching borrow requests: {str(e)}")
        response = jsonify({'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

@api_bp.route('/api/borrows/<int:borrow_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def manage_borrow(borrow_id):
    """Get, update, or delete a specific borrow request"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if request.method == 'GET':
            cur.execute("""
                SELECT id, student_name, student_id, email, phone, college, department,
                       equipment_name, quantity, borrow_date, return_date, purpose, status, created_at
                FROM borrow_requests
                WHERE id = %s
            """, (borrow_id,))
            
            row = cur.fetchone()
            if not row:
                response = jsonify({'error': 'Borrow request not found'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 404
            
            borrow = {
                'id': row[0],
                'studentName': row[1],
                'studentId': row[2],
                'email': row[3],
                'phone': row[4],
                'college': row[5],
                'department': row[6],
                'equipmentName': row[7],
                'quantity': row[8],
                'borrowDate': str(row[9]),
                'returnDate': str(row[10]),
                'purpose': row[11],
                'status': row[12],
                'createdAt': str(row[13])
            }
            
            response = jsonify(borrow)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        elif request.method == 'PUT':
            data = request.get_json()
            status = data.get('status')
            
            if status:
                cur.execute("""
                    UPDATE borrow_requests
                    SET status = %s
                    WHERE id = %s
                """, (status, borrow_id))
            
            conn.commit()
            response = jsonify({'success': True, 'message': 'Borrow request updated successfully'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        elif request.method == 'DELETE':
            cur.execute("DELETE FROM borrow_requests WHERE id = %s", (borrow_id,))
            conn.commit()
            response = jsonify({'success': True, 'message': 'Borrow request deleted successfully'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error managing borrow request: {str(e)}")
        response = jsonify({'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

# ============ CLASS SCHEDULES API ============

@api_bp.route('/api/classes', methods=['GET', 'OPTIONS'])
def get_all_classes():
    """Get all class schedules"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response
    
    # For now, return empty array as we don't have a classes table yet
    response = jsonify([])
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


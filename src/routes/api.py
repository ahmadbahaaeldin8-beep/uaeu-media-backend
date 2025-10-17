from flask import Blueprint, jsonify, request
from src.models.user import db
from src.models.reservation import Reservation
from src.models.borrow import Borrow

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
        reservations = Reservation.query.order_by(Reservation.created_at.desc()).all()
        reservations_list = [r.to_dict() for r in reservations]
        
        response = jsonify(reservations_list)
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
        reservation = Reservation.query.get(reservation_id)
        
        if request.method == 'GET':
            if not reservation:
                response = jsonify({'error': 'Reservation not found'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 404
            
            response = jsonify(reservation.to_dict())
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        elif request.method == 'PUT':
            if not reservation:
                response = jsonify({'error': 'Reservation not found'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 404
                
            data = request.get_json()
            status = data.get('status')
            
            if status:
                reservation.status = status
                db.session.commit()
            
            response = jsonify({'success': True, 'message': 'Reservation updated successfully'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        elif request.method == 'DELETE':
            if not reservation:
                response = jsonify({'error': 'Reservation not found'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 404
                
            db.session.delete(reservation)
            db.session.commit()
            
            response = jsonify({'success': True, 'message': 'Reservation deleted successfully'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
    except Exception as e:
        print(f"Error managing reservation: {str(e)}")
        db.session.rollback()
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
        borrows = Borrow.query.order_by(Borrow.created_at.desc()).all()
        borrows_list = [b.to_dict() for b in borrows]
        
        response = jsonify(borrows_list)
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
        borrow = Borrow.query.get(borrow_id)
        
        if request.method == 'GET':
            if not borrow:
                response = jsonify({'error': 'Borrow request not found'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 404
            
            response = jsonify(borrow.to_dict())
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        elif request.method == 'PUT':
            if not borrow:
                response = jsonify({'error': 'Borrow request not found'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 404
                
            data = request.get_json()
            status = data.get('status')
            
            if status:
                borrow.status = status
                db.session.commit()
            
            response = jsonify({'success': True, 'message': 'Borrow request updated successfully'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        elif request.method == 'DELETE':
            if not borrow:
                response = jsonify({'error': 'Borrow request not found'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 404
                
            db.session.delete(borrow)
            db.session.commit()
            
            response = jsonify({'success': True, 'message': 'Borrow request deleted successfully'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
    except Exception as e:
        print(f"Error managing borrow request: {str(e)}")
        db.session.rollback()
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


from src.models.user import db
from datetime import datetime

class Borrow(db.Model):
    __tablename__ = 'borrows'
    
    id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(200), nullable=False)
    student_id = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    college = db.Column(db.String(200), nullable=False)
    major = db.Column(db.String(200), nullable=False)
    equipment_type = db.Column(db.String(200), nullable=False)
    equipment_name = db.Column(db.String(300), nullable=False)
    borrow_date = db.Column(db.String(50), nullable=False)
    return_date = db.Column(db.String(50), nullable=False)
    purpose = db.Column(db.Text, nullable=False)
    supervisor = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default='Pending', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Borrow {self.id}: {self.student_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'studentName': self.student_name,
            'studentId': self.student_id,
            'email': self.email,
            'phone': self.phone,
            'college': self.college,
            'major': self.major,
            'equipmentType': self.equipment_type,
            'equipmentName': self.equipment_name,
            'borrowDate': self.borrow_date,
            'returnDate': self.return_date,
            'purpose': self.purpose,
            'supervisor': self.supervisor,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


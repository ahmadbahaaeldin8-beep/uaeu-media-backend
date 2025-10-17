from src.models.user import db
from datetime import datetime

class Reservation(db.Model):
    __tablename__ = 'reservations'
    
    id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(200), nullable=False)
    student_id = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    college = db.Column(db.String(200), nullable=False)
    major = db.Column(db.String(200), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    time_from = db.Column(db.String(50), nullable=False)
    time_to = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.String(50), nullable=False)
    supervisor = db.Column(db.String(200), nullable=False)
    project_name = db.Column(db.String(300), nullable=False)
    project_description = db.Column(db.Text, nullable=False)
    needed_tools = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='Pending', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Reservation {self.id}: {self.student_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'studentName': self.student_name,
            'studentId': self.student_id,
            'email': self.email,
            'phone': self.phone,
            'college': self.college,
            'major': self.major,
            'date': self.date,
            'timeFrom': self.time_from,
            'timeTo': self.time_to,
            'duration': self.duration,
            'supervisor': self.supervisor,
            'projectName': self.project_name,
            'projectDescription': self.project_description,
            'neededTools': self.needed_tools,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


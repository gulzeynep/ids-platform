from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base

class Aler(Base):
    __tablename__= "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    severity = Column(String)
    source_ip = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    
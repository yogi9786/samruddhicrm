from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class CallLogSchema(BaseModel):
    callId: Optional[str] = None
    callType: Optional[str] = "simulated"  # web, phone, simulated
    durationSeconds: Optional[int] = 0
    transcript: Optional[List[Dict[str, Any]]] = []
    qualification: Optional[Dict[str, Any]] = {}
    recordingUrl: Optional[str] = None
    timestamp: Optional[str] = None
    status: Optional[str] = "completed"

class LeadSchema(BaseModel):
    id: Optional[str] = None
    name: str
    email: Optional[str] = ""
    phone: str
    source: Optional[str] = "Walk-in"
    status: Optional[str] = "New Lead"
    interestedIn: Optional[str] = "Gold Jewelry"
    notes: Optional[str] = ""
    scheduledCall: Optional[str] = ""
    createdAt: Optional[str] = None
    callLogs: Optional[List[Dict[str, Any]]] = []

class LeadUpdateSchema(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    interestedIn: Optional[str] = None
    notes: Optional[str] = None
    scheduledCall: Optional[str] = None
    createdAt: Optional[str] = None
    callLogs: Optional[List[Dict[str, Any]]] = None

class ClientSchema(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: str
    totalPurchases: Optional[float] = 0.0
    status: Optional[str] = "Won"

class TaskSchema(BaseModel):
    title: str
    dueDate: str
    status: Optional[str] = "Pending"
    assignedTo: Optional[str] = "siriadmin"
    leadId: Optional[str] = ""


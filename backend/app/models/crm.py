from pydantic import BaseModel
from typing import Optional

class LeadSchema(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: str
    source: Optional[str] = "Walk-in"
    status: Optional[str] = "New Lead"
    interestedIn: Optional[str] = ""
    notes: Optional[str] = ""
    scheduledCall: Optional[str] = ""

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

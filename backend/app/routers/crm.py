from fastapi import APIRouter, Depends
from typing import List
from app.dependencies.deps import get_current_user
from app.models.crm import LeadSchema, ClientSchema, TaskSchema
from app.services.crm import CRMService

router = APIRouter()

# --- Leads Endpoints ---

@router.get("/leads")
async def get_leads(current_user: str = Depends(get_current_user)):
    return await CRMService.get_leads()

@router.post("/leads")
async def create_lead(lead: LeadSchema, current_user: str = Depends(get_current_user)):
    return await CRMService.create_lead(lead.model_dump())

@router.post("/leads/bulk")
async def create_leads_bulk(leads: List[LeadSchema], current_user: str = Depends(get_current_user)):
    return await CRMService.create_leads_bulk([l.model_dump() for l in leads])

@router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, lead: LeadSchema, current_user: str = Depends(get_current_user)):
    return await CRMService.update_lead(lead_id, lead.model_dump())

@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: str = Depends(get_current_user)):
    await CRMService.delete_lead(lead_id)
    return {"message": "Lead deleted successfully"}

# --- Clients Endpoints ---

@router.get("/clients")
async def get_clients(current_user: str = Depends(get_current_user)):
    return await CRMService.get_clients()

@router.post("/clients")
async def create_client(client: ClientSchema, current_user: str = Depends(get_current_user)):
    return await CRMService.create_client(client.model_dump())

@router.put("/clients/{client_id}")
async def update_client(client_id: str, client: ClientSchema, current_user: str = Depends(get_current_user)):
    return await CRMService.update_client(client_id, client.model_dump())

@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: str = Depends(get_current_user)):
    await CRMService.delete_client(client_id)
    return {"message": "Client deleted successfully"}

# --- Tasks Endpoints ---

@router.get("/tasks")
async def get_tasks(current_user: str = Depends(get_current_user)):
    return await CRMService.get_tasks()

@router.post("/tasks")
async def create_task(task: TaskSchema, current_user: str = Depends(get_current_user)):
    return await CRMService.create_task(task.model_dump())

@router.put("/tasks/{task_id}")
async def update_task(task_id: str, task: TaskSchema, current_user: str = Depends(get_current_user)):
    return await CRMService.update_task(task_id, task.model_dump())

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: str = Depends(get_current_user)):
    await CRMService.delete_task(task_id)
    return {"message": "Task deleted successfully"}

from datetime import datetime
import uuid
from app.core.firebase import db

class CRMService:
    @staticmethod
    async def get_leads() -> list:
        leads_ref = db.collection("leads").stream()
        return [doc.to_dict() for doc in leads_ref]

    @staticmethod
    async def create_lead(lead_data: dict) -> dict:
        lead_id = f"lead_{uuid.uuid4().hex[:8]}"
        lead_data["id"] = lead_id
        lead_data["createdAt"] = datetime.utcnow().isoformat() + "Z"
        db.collection("leads").document(lead_id).set(lead_data)
        
        return lead_data

    @staticmethod
    async def create_leads_bulk(leads_data: list) -> list:
        inserted = []
        batch = db.batch()
        for idx, lead in enumerate(leads_data):
            lead_id = f"lead_{uuid.uuid4().hex[:8]}"
            lead["id"] = lead_id
            if not lead.get("createdAt"):
                lead["createdAt"] = datetime.utcnow().isoformat() + "Z"
            
            doc_ref = db.collection("leads").document(lead_id)
            batch.set(doc_ref, lead)
            inserted.append(lead)
            
            if (idx + 1) % 500 == 0:
                batch.commit()
                batch = db.batch()
                
        batch.commit()
        return inserted

    @staticmethod
    async def update_lead(lead_id: str, lead_data: dict) -> dict:
        doc_ref = db.collection("leads").document(lead_id)
        if not doc_ref.get().exists:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Lead not found")
        lead_data["id"] = lead_id
        doc_ref.set(lead_data, merge=True)
        
        return lead_data

    @staticmethod
    async def delete_lead(lead_id: str) -> None:
        db.collection("leads").document(lead_id).delete()

    @staticmethod
    async def get_clients() -> list:
        clients_ref = db.collection("clients").stream()
        return [doc.to_dict() for doc in clients_ref]

    @staticmethod
    async def create_client(client_data: dict) -> dict:
        client_id = f"client_{uuid.uuid4().hex[:8]}"
        client_data["id"] = client_id
        db.collection("clients").document(client_id).set(client_data)
        return client_data

    @staticmethod
    async def update_client(client_id: str, client_data: dict) -> dict:
        doc_ref = db.collection("clients").document(client_id)
        if not doc_ref.get().exists:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Client not found")
        client_data["id"] = client_id
        doc_ref.set(client_data, merge=True)
        return client_data

    @staticmethod
    async def delete_client(client_id: str) -> None:
        db.collection("clients").document(client_id).delete()

    @staticmethod
    async def get_tasks() -> list:
        tasks_ref = db.collection("tasks").stream()
        return [doc.to_dict() for doc in tasks_ref]

    @staticmethod
    async def create_task(task_data: dict) -> dict:
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        task_data["id"] = task_id
        db.collection("tasks").document(task_id).set(task_data)
        return task_data

    @staticmethod
    async def update_task(task_id: str, task_data: dict) -> dict:
        doc_ref = db.collection("tasks").document(task_id)
        if not doc_ref.get().exists:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Task not found")
        task_data["id"] = task_id
        doc_ref.set(task_data, merge=True)
        return task_data

    @staticmethod
    async def delete_task(task_id: str) -> None:
        db.collection("tasks").document(task_id).delete()

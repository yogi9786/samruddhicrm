import uuid
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
from app.core.database import get_db_connection

logger = logging.getLogger(__name__)

def row_to_lead_dict(row) -> dict:
    if not row:
        return None
    d = dict(row)
    if "callLogs" in d and isinstance(d["callLogs"], str):
        try:
            d["callLogs"] = json.loads(d["callLogs"])
        except Exception:
            d["callLogs"] = []
    return d

class CRMService:
    @staticmethod
    async def get_leads() -> list:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM leads ORDER BY createdAt DESC")
            rows = cursor.fetchall()
            conn.close()
            return [row_to_lead_dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Error fetching leads from SQLite: {e}")
            return []

    @staticmethod
    async def get_lead_by_id(lead_id: str) -> dict:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
            row = cursor.fetchone()
            conn.close()
            return row_to_lead_dict(row)
        except Exception as e:
            logger.error(f"Error fetching lead {lead_id} from SQLite: {e}")
            return None

    @staticmethod
    async def create_lead(lead_data: dict) -> dict:
        lead_id = lead_data.get("id") or f"lead_{uuid.uuid4().hex[:8]}"
        name = lead_data.get("name", "New Lead")
        phone = lead_data.get("phone", "")
        email = lead_data.get("email", "")
        source = lead_data.get("source", "Walk-in")
        status = lead_data.get("status", "New Lead")
        interested_in = lead_data.get("interestedIn", "Gold Jewelry")
        notes = lead_data.get("notes", "")
        scheduled_call = lead_data.get("scheduledCall", "")
        created_at = lead_data.get("createdAt") or datetime.utcnow().isoformat() + "Z"
        call_logs = json.dumps(lead_data.get("callLogs", []))

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO leads (id, name, phone, email, source, status, interestedIn, notes, scheduledCall, createdAt, callLogs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (lead_id, name, phone, email, source, status, interested_in, notes, scheduled_call, created_at, call_logs))
        conn.commit()
        conn.close()

        lead_data["id"] = lead_id
        lead_data["createdAt"] = created_at
        return lead_data

    @staticmethod
    async def create_leads_bulk(leads_data: list) -> list:
        inserted = []
        for lead in leads_data:
            created = await CRMService.create_lead(lead)
            inserted.append(created)
        return inserted

    @staticmethod
    async def update_lead(lead_id: str, lead_data: dict) -> dict:
        existing = await CRMService.get_lead_by_id(lead_id) or {}
        
        name = lead_data.get("name") if lead_data.get("name") is not None else existing.get("name", "")
        phone = lead_data.get("phone") if lead_data.get("phone") is not None else existing.get("phone", "")
        email = lead_data.get("email") if lead_data.get("email") is not None else existing.get("email", "")
        source = lead_data.get("source") if lead_data.get("source") is not None else existing.get("source", "Walk-in")
        status = lead_data.get("status") if lead_data.get("status") is not None else existing.get("status", "New Lead")
        interested_in = lead_data.get("interestedIn") if lead_data.get("interestedIn") is not None else existing.get("interestedIn", "Gold Jewelry")
        notes = lead_data.get("notes") if lead_data.get("notes") is not None else existing.get("notes", "")
        scheduled_call = lead_data.get("scheduledCall") if lead_data.get("scheduledCall") is not None else existing.get("scheduledCall", "")
        created_at = existing.get("createdAt") or datetime.utcnow().isoformat() + "Z"
        
        call_logs = lead_data.get("callLogs")
        if call_logs is None:
            call_logs_str = json.dumps(existing.get("callLogs", []))
        else:
            call_logs_str = json.dumps(call_logs)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO leads (id, name, phone, email, source, status, interestedIn, notes, scheduledCall, createdAt, callLogs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (lead_id, name, phone, email, source, status, interested_in, notes, scheduled_call, created_at, call_logs_str))
        conn.commit()
        conn.close()

        return await CRMService.get_lead_by_id(lead_id)

    @staticmethod
    async def save_call_log(lead_id: str, call_log: dict) -> dict:
        if not call_log.get("callId"):
            call_log["callId"] = f"call_{uuid.uuid4().hex[:8]}"
        if not call_log.get("timestamp"):
            call_log["timestamp"] = datetime.utcnow().isoformat() + "Z"

        existing = await CRMService.get_lead_by_id(lead_id)
        if existing:
            logs = existing.get("callLogs", [])
            logs.append(call_log)
            
            update_data = {"callLogs": logs}
            if call_log.get("notes"):
                prev_notes = existing.get("notes", "")
                update_data["notes"] = f"{call_log['notes']}\n\n{prev_notes}".strip()
            if call_log.get("status"):
                update_data["status"] = call_log["status"]
                
            return await CRMService.update_lead(lead_id, update_data)
        else:
            new_lead = {
                "id": lead_id,
                "name": call_log.get("customerName", "Customer"),
                "phone": call_log.get("customerPhone", ""),
                "source": "AI Voice Call",
                "status": call_log.get("status", "Interested"),
                "notes": call_log.get("notes", ""),
                "callLogs": [call_log]
            }
            return await CRMService.create_lead(new_lead)

    @staticmethod
    async def delete_lead(lead_id: str) -> None:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        conn.commit()
        conn.close()

    # --- Clients ---
    @staticmethod
    async def get_clients() -> list:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM clients ORDER BY rowid DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    async def create_client(client_data: dict) -> dict:
        client_id = client_data.get("id") or f"client_{uuid.uuid4().hex[:8]}"
        name = client_data.get("name", "")
        phone = client_data.get("phone", "")
        email = client_data.get("email", "")
        total_purchases = float(client_data.get("totalPurchases", 0.0))
        status = client_data.get("status", "Won")
        created_at = datetime.utcnow().isoformat() + "Z"

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO clients (id, name, phone, email, totalPurchases, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (client_id, name, phone, email, total_purchases, status, created_at))
        conn.commit()
        conn.close()
        client_data["id"] = client_id
        return client_data

    @staticmethod
    async def update_client(client_id: str, client_data: dict) -> dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE clients SET name = ?, phone = ?, email = ?, totalPurchases = ?, status = ?
        WHERE id = ?
        """, (
            client_data.get("name", ""),
            client_data.get("phone", ""),
            client_data.get("email", ""),
            float(client_data.get("totalPurchases", 0.0)),
            client_data.get("status", "Won"),
            client_id
        ))
        conn.commit()
        conn.close()
        client_data["id"] = client_id
        return client_data

    @staticmethod
    async def delete_client(client_id: str) -> None:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM clients WHERE id = ?", (client_id,))
        conn.commit()
        conn.close()

    # --- Tasks ---
    @staticmethod
    async def get_tasks() -> list:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks ORDER BY rowid DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    async def create_task(task_data: dict) -> dict:
        task_id = task_data.get("id") or f"task_{uuid.uuid4().hex[:8]}"
        title = task_data.get("title", "")
        due_date = task_data.get("dueDate", "")
        status = task_data.get("status", "Pending")
        assigned_to = task_data.get("assignedTo", "siriadmin")
        lead_id = task_data.get("leadId", "")
        created_at = datetime.utcnow().isoformat() + "Z"

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO tasks (id, title, dueDate, status, assignedTo, leadId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (task_id, title, due_date, status, assigned_to, lead_id, created_at))
        conn.commit()
        conn.close()
        task_data["id"] = task_id
        return task_data

    @staticmethod
    async def update_task(task_id: str, task_data: dict) -> dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE tasks SET title = ?, dueDate = ?, status = ?, assignedTo = ?, leadId = ?
        WHERE id = ?
        """, (
            task_data.get("title", ""),
            task_data.get("dueDate", ""),
            task_data.get("status", "Pending"),
            task_data.get("assignedTo", "siriadmin"),
            task_data.get("leadId", ""),
            task_id
        ))
        conn.commit()
        conn.close()
        task_data["id"] = task_id
        return task_data

    @staticmethod
    async def delete_task(task_id: str) -> None:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        conn.close()

from datetime import datetime
from collections import Counter
from app.core.database import get_db_connection

class AnalyticsService:
    @staticmethod
    async def get_summary() -> dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM leads")
        leads = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM clients")
        clients = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM tasks")
        tasks = [dict(r) for r in cursor.fetchall()]
        
        conn.close()
        
        total_leads = len(leads)
        active_clients = len(clients)
        
        status_counts = Counter([lead.get("status") for lead in leads if lead.get("status")])
        source_counts = Counter([lead.get("source") for lead in leads if lead.get("source")])
        service_counts = Counter([lead.get("interestedIn") for lead in leads if lead.get("interestedIn")])
        
        trend_dict = {}
        for lead in leads:
            created_at = lead.get("createdAt", "")
            if created_at:
                try:
                    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    month_name = dt.strftime("%b %Y")
                    trend_dict[month_name] = trend_dict.get(month_name, 0) + 1
                except Exception:
                    pass
                    
        trend_data = [{"date": k, "leads": v} for k, v in trend_dict.items()]
        sources_data = [{"name": k, "value": v} for k, v in source_counts.items()]
        services_data = [{"name": k, "value": v} for k, v in service_counts.items()]

        won_clients = len([c for c in clients if c.get("status") == "Won"])
        conversion_rate = round((won_clients / total_leads * 100), 1) if total_leads > 0 else 0.0

        pending_tasks = len([t for t in tasks if t.get("status") == "Pending"])

        return {
            "kpis": {
                "totalLeads": total_leads,
                "activeClients": active_clients,
                "conversionRate": conversion_rate,
                "pendingTasks": pending_tasks
            },
            "trends": trend_data,
            "sources": sources_data,
            "services": services_data,
            "stages": [
                {"name": "Lead", "count": status_counts.get("New Lead", 0)},
                {"name": "Contacted", "count": status_counts.get("Contacted", 0)},
                {"name": "Interested", "count": status_counts.get("Interested", 0)},
                {"name": "Quotation", "count": status_counts.get("Quotation", 0)},
                {"name": "Closed", "count": status_counts.get("Won", 0)}
            ]
        }

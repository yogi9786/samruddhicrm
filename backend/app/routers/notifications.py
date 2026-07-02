from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any
from app.dependencies.deps import get_current_user
from app.core.firebase import db

router = APIRouter()

class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]

@router.post("/subscribe")
async def subscribe_push(sub: PushSubscription, current_user: str = Depends(get_current_user)):
    try:
        # Store subscription in Firestore keyed by user
        doc_ref = db.collection('push_subscriptions').document(current_user)
        # We can store multiple subscriptions (e.g. array) but for simplicity storing latest is fine, 
        # or we could store an array. Let's store an array.
        
        doc = doc_ref.get()
        if doc.exists:
            subs = doc.to_dict().get('subscriptions', [])
            # Check if exists
            if not any(s.get('endpoint') == sub.endpoint for s in subs):
                subs.append(sub.model_dump())
                doc_ref.set({'subscriptions': subs}, merge=True)
        else:
            doc_ref.set({'subscriptions': [sub.model_dump()]})
            
        return {"message": "Subscription saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

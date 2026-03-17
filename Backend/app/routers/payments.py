from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import base64
import hashlib
import hmac
import json
from datetime import datetime
from pydantic import BaseModel

from app.core import database, deps
from app.models.payment import Payment
from app.models.user import User
from app.models.book import Book

router = APIRouter()

# eSewa Sandbox Credentials
ESEWA_SECRET_KEY = "8gBm/:&EnhH.1/q"
ESEWA_PRODUCT_CODE = "EPAYTEST"

class PaymentInitiate(BaseModel):
    book_id: int
    amount: float = 99.0

class PaymentVerify(BaseModel):
    data: str  # Base64 encoded payload from eSewa

class PaymentStatus(BaseModel):
    book_id: int
    purchased: bool
    transaction_id: Optional[str] = None

@router.post("/initiate")
def initiate_payment(
    payload: PaymentInitiate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Check if book exists
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Create a pending payment record
    transaction_uuid = str(uuid.uuid4())
    
    # Store payment in db
    db_payment = Payment(
        user_id=current_user.id,
        book_id=payload.book_id,
        amount=payload.amount,
        status="pending",
        transaction_id=transaction_uuid
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)

    # Format amount consistently — many APIs prefer no decimals if they are .0
    # We will format it as a string and ensure it matches exactly what the frontend sends
    if float(payload.amount) == float(int(payload.amount)):
        total_amount_str = str(int(payload.amount))
    else:
        total_amount_str = f"{payload.amount:.2f}"

    # Prepare signature for eSewa
    # Formula: total_amount,transaction_uuid,product_code
    message = f"total_amount={total_amount_str},transaction_uuid={transaction_uuid},product_code={ESEWA_PRODUCT_CODE}"
    
    # Debug log for the user to see in their terminal
    print(f"DEBUG: eSewa message to sign: '{message}'")

    hash_obj = hmac.new(
        ESEWA_SECRET_KEY.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()

    signature = base64.b64encode(hash_obj).decode('utf-8')
    print(f"DEBUG: Generated signature: {signature}")

    return {
        "transaction_uuid": transaction_uuid,
        "total_amount": total_amount_str,
        "product_code": ESEWA_PRODUCT_CODE,
        "signature": signature,
        "signed_field_names": "total_amount,transaction_uuid,product_code"
    }

@router.post("/verify")
def verify_payment(
    payload: PaymentVerify,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    try:
        decoded_data = base64.b64decode(payload.data).decode('utf-8')
        data_dict = json.loads(decoded_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid data format")

    transaction_uuid = data_dict.get('transaction_uuid')
    status = data_dict.get('status')
    signature = data_dict.get('signature')
    
    if status != 'COMPLETE':
        raise HTTPException(status_code=400, detail="Payment not complete")

    # Recreate signature to verify authenticity
    signed_field_names = data_dict.get('signed_field_names', '')
    signed_fields = signed_field_names.split(',')
    message_parts = []
    for field in signed_fields:
        message_parts.append(f"{field}={data_dict.get(field, '')}")
    expected_message = ",".join(message_parts)

    print(f"DEBUG: eSewa verification message: '{expected_message}'")

    expected_hash = hmac.new(
        ESEWA_SECRET_KEY.encode('utf-8'), 
        expected_message.encode('utf-8'), 
        hashlib.sha256
    ).digest()
    expected_signature = base64.b64encode(expected_hash).decode('utf-8')
    
    print(f"DEBUG: Calculated expected signature: {expected_signature}")
    print(f"DEBUG: Received eSewa signature: {signature}")
    
    if signature != expected_signature:
        raise HTTPException(status_code=400, detail="Signature verification failed")

    # Find the pending payment
    payment = db.query(Payment).filter(
        Payment.transaction_id == transaction_uuid,
        Payment.user_id == current_user.id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    # Update payment status
    payment.status = "success"
    payment.esewa_id = data_dict.get('transaction_code')
    db.commit()

    return {"status": "success", "message": "Payment verified successfully", "book_id": payment.book_id}

@router.get("/status/{book_id}", response_model=PaymentStatus)
def get_payment_status(
    book_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Check if there is a successful payment for this book by this user
    payment = db.query(Payment).filter(
        Payment.book_id == book_id,
        Payment.user_id == current_user.id,
        Payment.status == "success"
    ).first()

    return {
        "book_id": book_id,
        "purchased": True if payment else False,
        "transaction_id": payment.transaction_id if payment else None
    }

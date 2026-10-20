from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.user import User
from app.schemas.user import UserPublic
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/friends",
    tags=["Friends"]
)


def _get_user_or_404(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _remove_id(ids: list[int] | None, value: int) -> list[int]:
    """SQLAlchemy needs a NEW list assigned back to the column to notice an
    ARRAY changed in place — mutating the list returned by an attribute
    doesn't get picked up. Every removal below re-assigns through this."""
    return [i for i in (ids or []) if i != value]


@router.get("/search", response_model=list[UserPublic])
def search_users(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Username search — the only way to find someone to friend (spec: never
    search/identify people by email)."""
    if not q or len(q.strip()) < 2:
        return []

    return (
        db.query(User)
        .filter(User.username.ilike(f"%{q.strip()}%"))
        .filter(User.user_id != current_user.user_id)
        .limit(20)
        .all()
    )


@router.post("/request/{user_id}", response_model=UserPublic)
def send_friend_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You can't friend yourself")

    target = _get_user_or_404(user_id, db)

    if user_id in (current_user.friend_ids or []):
        raise HTTPException(status_code=409, detail="Already friends")
    if user_id in (current_user.outgoing_friend_request_ids or []):
        raise HTTPException(status_code=409, detail="Request already sent")
    if user_id in (current_user.incoming_friend_request_ids or []):
        raise HTTPException(
            status_code=409,
            detail="This person already sent you a request — accept it instead"
        )

    current_user.outgoing_friend_request_ids = [*(current_user.outgoing_friend_request_ids or []), user_id]
    target.incoming_friend_request_ids = [*(target.incoming_friend_request_ids or []), current_user.user_id]

    db.commit()
    return target


@router.post("/accept/{user_id}", response_model=UserPublic)
def accept_friend_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id not in (current_user.incoming_friend_request_ids or []):
        raise HTTPException(status_code=404, detail="No pending request from this user")

    requester = _get_user_or_404(user_id, db)

    if user_id in (current_user.friend_ids or []):
        # Already friends (e.g. a retried request after a lost update, see
        # Obsidian: Bugs and Issues.md) — treat as success rather than
        # silently appending a duplicate.
        return requester

    current_user.incoming_friend_request_ids = _remove_id(current_user.incoming_friend_request_ids, user_id)
    requester.outgoing_friend_request_ids = _remove_id(requester.outgoing_friend_request_ids, current_user.user_id)

    current_user.friend_ids = [*(current_user.friend_ids or []), user_id]
    requester.friend_ids = [*(requester.friend_ids or []), current_user.user_id]

    db.commit()
    return requester


@router.delete("/reject/{user_id}")
def reject_friend_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id not in (current_user.incoming_friend_request_ids or []):
        raise HTTPException(status_code=404, detail="No pending request from this user")

    requester = db.query(User).filter(User.user_id == user_id).first()

    current_user.incoming_friend_request_ids = _remove_id(current_user.incoming_friend_request_ids, user_id)
    if requester:
        requester.outgoing_friend_request_ids = _remove_id(requester.outgoing_friend_request_ids, current_user.user_id)

    db.commit()
    return {"message": "Request rejected"}


@router.delete("/cancel/{user_id}")
def cancel_friend_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id not in (current_user.outgoing_friend_request_ids or []):
        raise HTTPException(status_code=404, detail="No pending request to this user")

    addressee = db.query(User).filter(User.user_id == user_id).first()

    current_user.outgoing_friend_request_ids = _remove_id(current_user.outgoing_friend_request_ids, user_id)
    if addressee:
        addressee.incoming_friend_request_ids = _remove_id(addressee.incoming_friend_request_ids, current_user.user_id)

    db.commit()
    return {"message": "Request cancelled"}


@router.delete("/{user_id}")
def remove_friend(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id not in (current_user.friend_ids or []):
        raise HTTPException(status_code=404, detail="Not friends with this user")

    other = db.query(User).filter(User.user_id == user_id).first()

    current_user.friend_ids = _remove_id(current_user.friend_ids, user_id)
    if other:
        other.friend_ids = _remove_id(other.friend_ids, current_user.user_id)

    db.commit()
    return {"message": "Friend removed"}


@router.get("/mine", response_model=list[UserPublic])
def get_my_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.friend_ids:
        return []
    return db.query(User).filter(User.user_id.in_(current_user.friend_ids)).all()


@router.get("/incoming", response_model=list[UserPublic])
def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """People who've sent ME a request — the ones I can accept/reject."""
    if not current_user.incoming_friend_request_ids:
        return []
    return db.query(User).filter(User.user_id.in_(current_user.incoming_friend_request_ids)).all()


@router.get("/outgoing", response_model=list[UserPublic])
def get_outgoing_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """People I've sent a request to that's still pending — the ones I can cancel."""
    if not current_user.outgoing_friend_request_ids:
        return []
    return db.query(User).filter(User.user_id.in_(current_user.outgoing_friend_request_ids)).all()

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.connection import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True)

    # Tracked so PATCH /auth/username can enforce a 1-minute cooldown
    # between changes. Null until the first change.
    username_changed_at = Column(DateTime(timezone=True), nullable=True)

    email = Column(String, unique=True, index=True)

    full_name = Column(String)

    password = Column(String)

    # Set via drag-and-drop upload in Settings (uploads to Cloudinary, same
    # free-tier path as hangout cover images) or left null for the navbar's
    # initial-letter avatar fallback.
    profile_picture_url = Column(String, nullable=True)

    is_verified = Column(Boolean, default=False)

    verification_token = Column(String, nullable=True)

    # Which flow this token authorizes — "signup" (verify_email) or
    # "password_reset" (confirm_password_change). The same single-slot
    # token column is reused for both rather than adding a second table:
    # only one verification action can be in flight per user at a time,
    # which is the right behavior anyway (requesting a new one invalidates
    # whatever was pending before).
    verification_token_purpose = Column(String, nullable=True)

    verification_token_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Last time ANY verification-type email was sent — powers the resend
    # cooldown in routers/auth.py, independent of which purpose.
    verification_sent_at = Column(DateTime(timezone=True), nullable=True)

    # Embedded in every JWT this user is issued (see utils/security.py). A
    # token's embedded version has to match this column or get_current_user
    # rejects it — so bumping this instantly invalidates every previously
    # issued token, without a session/blacklist table. See Obsidian: Bugs
    # and Issues.md for why this fits better than a blacklist here.
    token_version = Column(Integer, nullable=False, default=1)

    google_calendar_refresh_token = Column(String, nullable=True)

    hangout_ids = Column(
        ARRAY(Integer),
        default=list
    )

    # Friendships live here as plain arrays of user_id, the same pattern as
    # hangout_ids above — no separate Friendship table/model. A friendship
    # has no extra data worth its own row (no message, no timestamp shown
    # anywhere), so it's just "is this id present in that array" rather
    # than a joined entity. Kept in sync on both sides by routers/friends.py
    # (e.g. accepting adds each user's id to the OTHER's friend_ids).
    #
    # Trade-off worth knowing: a plain ARRAY has no DB-level uniqueness
    # constraint, so nothing at the database itself stops a duplicate id
    # from being appended under a genuine race (two clicks at once). That's
    # the same trade-off hangout_ids above already lives with; this isn't a
    # new category of risk for this codebase, just an existing one applied
    # again. routers/friends.py checks in Python before appending, which
    # covers everything except that narrow race.
    friend_ids = Column(ARRAY(Integer), default=list)

    # Requests I've sent that are still pending (mirrored by the recipient's
    # incoming_friend_request_ids below).
    outgoing_friend_request_ids = Column(ARRAY(Integer), default=list)

    # Requests sent TO me that I haven't responded to yet.
    incoming_friend_request_ids = Column(ARRAY(Integer), default=list)
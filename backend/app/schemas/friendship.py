# Deprecated — see models/friendship.py's stub for why. routers/friends.py
# now returns UserPublic (schemas/user.py) directly instead of a
# Friendship-shaped response; there's no separate friendship_id/status to
# represent since a friendship is just "is this id in that array."
#
# Stub rather than deleted because Claude's filesystem tools can't delete
# files, only overwrite them — safe to delete by hand; nothing imports it
# anymore.

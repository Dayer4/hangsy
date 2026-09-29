# Deprecated — friendships are no longer their own table/model. They live
# as plain array columns directly on User (friend_ids,
# outgoing_friend_request_ids, incoming_friend_request_ids — see
# models/user.py), the same pattern User.hangout_ids already used for a
# similar many-to-many. See routers/friends.py for the logic.
#
# This file is a stub rather than deleted because Claude's filesystem tools
# can't delete files, only overwrite them — safe to delete by hand; nothing
# imports it anymore.

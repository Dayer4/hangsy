# controllers/hangout_controller.py

from models.hangout import Hangout



def create_hangout(
    db,
    hangout_data,
    user_id
):

    hangout = Hangout(
        **hangout_data.dict(),
        owner_id=user_id
    )

    db.add(hangout)
    db.commit()
    db.refresh(hangout)

    return hangout



def get_user_hangouts(
    db,
    user_id
):

    return db.query(Hangout)\
        .filter(
            Hangout.owner_id == user_id
        )\
        .all()



def get_hangout(
    db,
    hangout_id
):

    return db.query(Hangout)\
        .filter(
            Hangout.hangout_id == hangout_id
        )\
        .first()



def delete_hangout(
    db,
    hangout_id
):

    hangout = get_hangout(
        db,
        hangout_id
    )

    if hangout:

        db.delete(hangout)
        db.commit()

    return hangout
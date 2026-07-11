# controllers/store_controller.py


from models.store import Store



def create_store(
    db,
    store_data,
    hangout_id
):

    store = Store(
        **store_data.dict(),
        hangout_id=hangout_id
    )

    db.add(store)
    db.commit()
    db.refresh(store)

    return store



def get_stores(
    db,
    hangout_id
):

    return db.query(Store)\
        .filter(
            Store.hangout_id == hangout_id
        )\
        .all()



def update_store(
    db,
    store_id,
    data
):

    store = db.query(Store)\
        .filter(
            Store.store_id == store_id
        )\
        .first()


    for key,value in data.dict().items():
        setattr(store,key,value)


    db.commit()
    db.refresh(store)

    return store



def delete_store(
    db,
    store_id
):

    store = db.query(Store)\
        .filter(
            Store.store_id == store_id
        )\
        .first()


    db.delete(store)
    db.commit()

    return store
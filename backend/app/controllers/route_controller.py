# controllers/route_controller.py


from models.route import Route



def add_stop(
    db,
    stop_data,
    hangout_id
):

    stop = Route(
        **stop_data.dict(),
        hangout_id=hangout_id
    )

    db.add(stop)
    db.commit()
    db.refresh(stop)

    return stop



def get_route(
    db,
    hangout_id
):

    return db.query(Route)\
        .filter(
            Route.hangout_id == hangout_id
        )\
        .order_by(
            Route.stop_order
        )\
        .all()



def update_stop(
    db,
    stop_id,
    data
):

    stop = db.query(Route)\
        .filter(
            Route.route_id == stop_id
        )\
        .first()


    for key,value in data.dict().items():
        setattr(
            stop,
            key,
            value
        )


    db.commit()
    db.refresh(stop)

    return stop



def delete_stop(
    db,
    stop_id
):

    stop = db.query(Route)\
        .filter(
            Route.route_id == stop_id
        )\
        .first()


    db.delete(stop)
    db.commit()

    return stop
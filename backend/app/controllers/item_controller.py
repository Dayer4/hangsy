# controllers/item_controller.py


from models.item import Item



def create_item(
    db,
    item_data,
    store_id
):

    item = Item(
        **item_data.dict(),
        store_id=store_id
    )


    item.total_item_cost = (
        item.quantity *
        item.cost_per_unit
    )


    db.add(item)
    db.commit()
    db.refresh(item)


    return item




def get_items(
    db,
    store_id
):

    return db.query(Item)\
        .filter(
            Item.store_id == store_id
        )\
        .all()



def update_item(
    db,
    item_id,
    data
):

    item = db.query(Item)\
        .filter(
            Item.item_id == item_id
        )\
        .first()


    for key,value in data.dict().items():

        setattr(
            item,
            key,
            value
        )


    item.total_item_cost = (
        item.quantity *
        item.cost_per_unit
    )


    db.commit()
    db.refresh(item)

    return item



def delete_item(
    db,
    item_id
):

    item = db.query(Item)\
        .filter(
            Item.item_id == item_id
        )\
        .first()


    db.delete(item)
    db.commit()

    return item
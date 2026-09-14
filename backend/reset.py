from app.db.connection import engine, Base

# import all models so SQLAlchemy knows about every table
# Postgress updates db tables if its a completly new table not just a single column 
# alambres is better cuz it actually saves data created in run time but faster if nuke and rerun since its a small scale project
from app.models import hangout, driver, item, user, route, store, pickup

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

print("Database reset complete.")

#cd backend
#python -m reset_db
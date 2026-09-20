from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/todos",
    tags=["Todos"]
)


# Every endpoint here is scoped to the logged-in user — there's no
# "get all todos" the way there is for hangouts; a to-do list is personal.


@router.get("/mine", response_model=list[TodoResponse])
def get_my_todos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Todo).filter(Todo.user_id == current_user.user_id).all()


@router.post("/", response_model=TodoResponse)
def create_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_todo = Todo(text=todo.text, user_id=current_user.user_id)

    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)

    return new_todo


def _get_owned_todo(todo_id: int, db: Session, current_user: User) -> Todo:
    todo = db.query(Todo).filter(Todo.todo_id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.user_id != current_user.user_id:
        # 404, not 403 — don't confirm to a caller that some other user's
        # todo_id exists at all.
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = _get_owned_todo(todo_id, db, current_user)

    updates = todo_update.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(todo, key, value)

    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = _get_owned_todo(todo_id, db, current_user)

    db.delete(todo)
    db.commit()

    return {"message": "Todo deleted"}

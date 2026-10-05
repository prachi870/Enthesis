from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.models.user import Base, User
from backend.app.services.auth import authenticate_user, hash_password


def test_authenticate_user_accepts_username_or_email():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    user = User(
        email="alex@example.com",
        username="alex",
        hashed_password=hash_password("correct-password"),
    )
    session.add(user)
    session.commit()

    try:
        assert authenticate_user(session, "alex", "correct-password") == user
        assert authenticate_user(session, "alex@example.com", "correct-password") == user
        assert authenticate_user(session, "ALEX@example.com", "correct-password") == user
        assert authenticate_user(session, "  alex  ", "correct-password") == user
        assert authenticate_user(session, "  ALEX@example.com  ", "correct-password") == user
        assert authenticate_user(session, "alex@example.com", "wrong-password") is None
    finally:
        session.close()
        engine.dispose()

import importlib
import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("ENTHESIS_STORAGE_DIR", str(tmp_path))
    import backend.app.config, backend.app.api.papers, backend.app.main
    for m in (backend.app.config, backend.app.api.papers, backend.app.main):
        importlib.reload(m)
    return TestClient(backend.app.main.app)


def _upload(c):
    r = c.post("/api/v1/papers/upload", files={"file": ("d.md", b"Abstract\nWe propose BERT for tagging on the SciERC dataset.\n")}, data={"author": "P"})
    assert r.status_code == 200
    return r.json()["paper_id"]


def test_rejects_unsupported_file(client):
    r = client.post("/api/v1/papers/upload", files={"file": ("d.exe", b"x")})
    assert r.status_code == 400


def test_approval_gates_enforced(client):
    pid = _upload(client)
    client.post(f"/api/v1/papers/{pid}/pipeline/start")
    # cannot approve a stage that hasn't completed
    assert client.post(f"/api/v1/papers/{pid}/stages/novelty/approve").status_code == 409
    # approving parse runs ONLY related_work, not everything
    client.post(f"/api/v1/papers/{pid}/stages/parse/approve")
    st = client.get(f"/api/v1/papers/{pid}").json()["states"]
    assert st["parse"] == "approved" and st["related_work"] == "completed" and st["novelty"] == "pending"


def test_full_flow_and_report(client):
    pid = _upload(client)
    client.post(f"/api/v1/papers/{pid}/pipeline/start")
    for stage in ["parse", "related_work", "novelty", "weaknesses", "clarity", "reviewer_feedback"]:
        assert client.post(f"/api/v1/papers/{pid}/stages/{stage}/approve").status_code == 200
    rep = client.get(f"/api/v1/papers/{pid}/report").json()
    assert rep["complete"] is True
    assert "does not predict paper acceptance" in rep["notice"]
    nov = next(s for s in rep["sections"] if s["stage"] == "novelty")
    assert nov["result"]["status"] == "not_evaluated"

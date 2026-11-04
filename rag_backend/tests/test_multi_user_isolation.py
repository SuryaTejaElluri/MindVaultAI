import io
import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Ensure OpenBLAS thread allocation is single-threaded
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

# Set a test secret key for JWT verification during test run
TEST_JWT_SECRET = "super-secret-test-jwt-key-for-rag-backend-verification-32chars"
os.environ["AUTH_SECRET_KEY"] = TEST_JWT_SECRET
os.environ["AUTH_ALGORITHMS"] = "HS256"

import jwt
from fastapi.testclient import TestClient
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.main import app

client = TestClient(app)


def make_token(user_id: str, email: str = "user@example.com") -> str:
    """Creates a signed JWT bearer token with stable sub claim."""
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


def generate_pdf_bytes(title: str, lines: list) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, title)
    y = 700
    for line in lines:
        c.drawString(100, y, line)
        y -= 25
    c.showPage()
    c.save()
    return buffer.getvalue()


def test_authentication_required():
    print("--> Test 1: Authentication required on protected endpoints...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"

    res = client.get("/documents")
    assert res.status_code in {401, 403}, f"Expected 401/403 without token, got: {res.status_code}"

    res = client.post("/chat", json={"question": "hello"})
    assert res.status_code in {401, 403}, f"Expected 401/403 without token, got: {res.status_code}"

    res = client.get("/chat/sessions")
    assert res.status_code in {401, 403}, f"Expected 401/403 without token, got: {res.status_code}"

    print("    [PASS] Protected endpoints reject unauthenticated requests.")


def test_pdf_ingestion_and_citations():
    print("--> Test 2: PDF ingestion, human-readable page citations, and grounded retrieval...")
    token_charlie = make_token(user_id="user_charlie_gamma_003", email="charlie@test.com")
    headers_c = {"Authorization": f"Bearer {token_charlie}"}

    pdf_bytes = generate_pdf_bytes(
        "Project Solar Flare Technical Report",
        [
            "Project Solar Flare observes geomagnetic anomalies on Jupiter.",
            "Primary sensor payload is the Helios-X Spectrometer.",
            "Mission director is Dr. Evelyn Vance.",
        ],
    )

    res = client.post(
        "/documents",
        headers=headers_c,
        files={"file": ("solar_flare_report.pdf", pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200, f"PDF upload failed: {res.text}"
    doc_id = res.json()["document_id"]
    print(f"    Charlie uploaded PDF doc ID: {doc_id}")

    # Query with answer in context
    chat_res = client.post(
        "/chat",
        headers=headers_c,
        json={"question": "Who is the mission director and what sensor payload is used in Project Solar Flare?"},
    )
    assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
    data = chat_res.json()
    print("    Charlie answer:", data["answer"][:120], "...")
    assert "evelyn vance" in data["answer"].lower() or "helios" in data["answer"].lower()
    assert len(data["sources"]) > 0
    source = data["sources"][0]
    assert source["filename"] == "solar_flare_report.pdf"
    assert source["page"] == 1, f"Expected 1-indexed page 1, got: {source.get('page')}"

    # Query with unrelated topic (must trigger relevance threshold filter and not hallucinate)
    unrelated_res = client.post(
        "/chat",
        headers=headers_c,
        json={"question": "How do I bake a triple chocolate fudge cake at home?"},
    )
    assert unrelated_res.status_code == 200
    unrelated_data = unrelated_res.json()
    print("    Unrelated query answer:", unrelated_data["answer"])
    assert len(unrelated_data["sources"]) == 0, "Weak match should have been filtered out!"
    assert "could not find" in unrelated_data["answer"].lower() or "not find" in unrelated_data["answer"].lower()

    # Clean up
    client.delete(f"/documents/{doc_id}", headers=headers_c)
    client.delete(f"/chat/sessions/{data['session_id']}", headers=headers_c)
    print("    [PASS] PDF ingestion, page citations, and weak match thresholding verified.")


def test_multi_user_isolation():
    print("--> Test 3: Multi-user isolation across 2 separate accounts...")
    token_a = make_token(user_id="user_alice_alpha_001", email="alice@test.com")
    token_b = make_token(user_id="user_bob_beta_002", email="bob@test.com")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. User A uploads a TXT document
    alice_content = (
        "Alice's confidential project is Project Starlight.\n"
        "The primary launch window for Project Starlight is October 14, 2027.\n"
        "Budget allocation for Project Starlight is $42 million.\n"
    )
    res_a = client.post(
        "/documents",
        headers=headers_a,
        files={"file": ("project_starlight.txt", alice_content.encode("utf-8"), "text/plain")},
    )
    assert res_a.status_code == 200, f"User A upload failed: {res_a.text}"
    doc_a_id = res_a.json()["document_id"]
    print(f"    User A uploaded doc ID: {doc_a_id}")

    # 2. User B uploads a Markdown document
    bob_content = (
        "# Project Quantum Falcon\n\n"
        "Project Quantum Falcon is Bob's private autonomous drone initiative.\n"
        "The primary deployment zone for Quantum Falcon is the Mariana Trench.\n"
        "Budget allocation for Quantum Falcon is $98 million.\n"
    )
    res_b = client.post(
        "/documents",
        headers=headers_b,
        files={"file": ("quantum_falcon.md", bob_content.encode("utf-8"), "text/markdown")},
    )
    assert res_b.status_code == 200, f"User B upload failed: {res_b.text}"
    doc_b_id = res_b.json()["document_id"]
    print(f"    User B uploaded doc ID: {doc_b_id}")

    # 3. Document listing isolation: User A sees only A's docs, User B sees only B's docs
    list_a = client.get("/documents", headers=headers_a).json()
    list_b = client.get("/documents", headers=headers_b).json()

    list_a_ids = [d["id"] for d in list_a]
    list_b_ids = [d["id"] for d in list_b]

    assert doc_a_id in list_a_ids, "User A doc not found in User A listing"
    assert doc_b_id not in list_a_ids, "SECURITY LEAK: User B doc appeared in User A listing!"

    assert doc_b_id in list_b_ids, "User B doc not found in User B listing"
    assert doc_a_id not in list_b_ids, "SECURITY LEAK: User A doc appeared in User B listing!"
    print("    [PASS] Document listing is strictly owner-scoped.")

    # 4. Cross-user access check (GET /documents/{id})
    res_cross_get = client.get(f"/documents/{doc_a_id}", headers=headers_b)
    assert res_cross_get.status_code == 404, f"SECURITY LEAK: User B could view User A's doc! Got: {res_cross_get.status_code}"
    print("    [PASS] Cross-user document inspection returns 404.")

    # 5. Cross-user rename check (PATCH /documents/{id})
    res_cross_rename = client.patch(
        f"/documents/{doc_a_id}",
        headers=headers_b,
        json={"filename": "hacked_by_bob.txt"},
    )
    assert res_cross_rename.status_code == 404, f"SECURITY LEAK: User B could rename User A's doc! Got: {res_cross_rename.status_code}"
    print("    [PASS] Cross-user document rename returns 404.")

    # 6. Cross-user deletion check (DELETE /documents/{id})
    res_cross_delete = client.delete(f"/documents/{doc_a_id}", headers=headers_b)
    assert res_cross_delete.status_code == 404, f"SECURITY LEAK: User B could delete User A's doc! Got: {res_cross_delete.status_code}"
    print("    [PASS] Cross-user document deletion returns 404.")

    # 7. Document rename by owner
    res_rename = client.patch(
        f"/documents/{doc_a_id}",
        headers=headers_a,
        json={"filename": "renamed_starlight.txt"},
    )
    assert res_rename.status_code == 200, f"Owner rename failed: {res_rename.text}"
    assert res_rename.json()["new_filename"] == "renamed_starlight.txt"
    print("    [PASS] Document rename by owner succeeded.")

    # 8. RAG Question Answering isolation
    chat_a = client.post(
        "/chat",
        headers=headers_a,
        json={"question": "What is the launch window and budget for Project Starlight?"},
    )
    assert chat_a.status_code == 200, f"User A chat failed: {chat_a.text}"
    ans_a = chat_a.json()
    print("    User A answer:", ans_a["answer"][:100], "...")
    assert "2027" in ans_a["answer"] or "42" in ans_a["answer"], f"Expected launch window/budget in answer: {ans_a['answer']}"
    assert any("starlight" in s["filename"].lower() for s in ans_a["sources"]), "Expected starlight source in citations"

    # User A asks about Bob's project (Must NOT find or answer!)
    chat_a_cross = client.post(
        "/chat",
        headers=headers_a,
        json={"question": "What is the deployment zone for Quantum Falcon?"},
    )
    assert chat_a_cross.status_code == 200
    ans_a_cross = chat_a_cross.json()
    print("    User A cross-query result:", ans_a_cross["answer"][:100], "...")
    assert "mariana" not in ans_a_cross["answer"].lower(), "SECURITY LEAK: User A retrieved User B's secret content!"
    assert len(ans_a_cross["sources"]) == 0, "SECURITY LEAK: User A received citations for User B's document!"

    # User B asks about their project
    chat_b = client.post(
        "/chat",
        headers=headers_b,
        json={"question": "What is the deployment zone and budget for Quantum Falcon?"},
    )
    assert chat_b.status_code == 200, f"User B chat failed: {chat_b.text}"
    ans_b = chat_b.json()
    print("    User B answer:", ans_b["answer"][:100], "...")
    assert "mariana" in ans_b["answer"].lower() or "98" in ans_b["answer"], f"Expected deployment zone in answer: {ans_b['answer']}"

    # User B asks about Alice's project (Must NOT find or answer!)
    chat_b_cross = client.post(
        "/chat",
        headers=headers_b,
        json={"question": "What is the budget for Project Starlight?"},
    )
    assert chat_b_cross.status_code == 200
    ans_b_cross = chat_b_cross.json()
    print("    User B cross-query result answer:", ans_b_cross["answer"][:120], "...")
    print("    User B cross-query sources:", [s["filename"] for s in ans_b_cross["sources"]])
    assert "42" not in ans_b_cross["answer"], "SECURITY LEAK: User B retrieved User A's secret content!"
    assert not any("starlight" in s["filename"].lower() for s in ans_b_cross["sources"]), "SECURITY LEAK: User B received citations for User A's document!"

    print("    [PASS] Cross-user vector retrieval isolation verified.")

    # 9. Chat sessions and history isolation
    sess_a_id = ans_a["session_id"]
    sess_b_id = ans_b["session_id"]

    sessions_a = client.get("/chat/sessions", headers=headers_a).json()
    sess_a_ids = [s["id"] for s in sessions_a]
    assert sess_a_id in sess_a_ids
    assert sess_b_id not in sess_a_ids, "SECURITY LEAK: User B's session visible to User A!"

    cross_session_get = client.get(f"/chat/sessions/{sess_a_id}", headers=headers_b)
    assert cross_session_get.status_code == 404, "SECURITY LEAK: User B accessed User A's chat session history!"

    cross_session_del = client.delete(f"/chat/sessions/{sess_a_id}", headers=headers_b)
    assert cross_session_del.status_code == 404, "SECURITY LEAK: User B deleted User A's chat session!"

    print("    [PASS] Chat session history is strictly owner-scoped.")

    # 10. Document deletion by owner & verification that chunks are purged
    del_res = client.delete(f"/documents/{doc_a_id}", headers=headers_a)
    assert del_res.status_code == 200, f"Owner deletion failed: {del_res.text}"

    list_a_after = client.get("/documents", headers=headers_a).json()
    assert doc_a_id not in [d["id"] for d in list_a_after]

    chat_a_after = client.post(
        "/chat",
        headers=headers_a,
        json={"question": "What is the launch window for Project Starlight?"},
    )
    assert len(chat_a_after.json()["sources"]) == 0, "Deleted document chunks still retrieved!"

    chat_b_after = client.post(
        "/chat",
        headers=headers_b,
        json={"question": "What is the deployment zone for Quantum Falcon?"},
    )
    assert "mariana" in chat_b_after.json()["answer"].lower()

    # Clean up User B's test document and sessions
    client.delete(f"/documents/{doc_b_id}", headers=headers_b)
    client.delete(f"/chat/sessions/{sess_b_id}", headers=headers_b)
    client.delete(f"/chat/sessions/{sess_a_id}", headers=headers_a)

    print("    [PASS] Document deletion and vector purging verified.")
    print("--> All multi-user isolation tests passed successfully!")


def test_rate_limiting_and_quotas():
    print("--> Test 4: Rate limiting and storage quotas...")
    token_dave = make_token(user_id="user_dave_delta_004", email="dave@test.com")
    headers_d = {"Authorization": f"Bearer {token_dave}"}

    # Test rate limiter
    from app.rate_limiter import rate_limiter
    user_test_id = "user_throttled_999"
    # Fill up limit
    for _ in range(60):
        rate_limiter.check_rate_limit(user_test_id, max_requests=60)
    
    # Next call must raise 429
    try:
        rate_limiter.check_rate_limit(user_test_id, max_requests=60)
        assert False, "Rate limiter failed to trigger 429!"
    except Exception as exc:
        from fastapi import HTTPException
        assert isinstance(exc, HTTPException)
        assert exc.status_code == 429
        assert "Retry-After" in exc.headers
        print("    [PASS] Rate limiter triggered 429 Too Many Requests with Retry-After header.")

    # Test background ingestion parameter
    txt_content = "This is a document ingested via background task processing.\n"
    res_bg = client.post(
        "/documents?background=true",
        headers=headers_d,
        files={"file": ("background_doc.txt", txt_content.encode("utf-8"), "text/plain")},
    )
    assert res_bg.status_code == 200, f"Background upload failed: {res_bg.text}"
    bg_data = res_bg.json()
    assert bg_data["status"] == "processing"
    bg_doc_id = bg_data["document_id"]
    print(f"    Dave submitted background doc ID: {bg_doc_id}")

    # Give background task worker a moment to process
    time.sleep(3)

    # Check status
    doc_status = client.get(f"/documents/{bg_doc_id}", headers=headers_d).json()
    print("    Background document status after wait:", doc_status["status"])
    assert doc_status["status"] in {"completed", "processing"}

    # Cleanup Dave's doc
    client.delete(f"/documents/{bg_doc_id}", headers=headers_d)
    print("    [PASS] Background task dispatch and status reporting verified.")


def test_identical_file_upload_different_users():
    print("--> Test 5: Identical file uploads by two different users (per-user deduplication)...")
    token_u1 = make_token(user_id="user_dup_111", email="u1@test.com")
    token_u2 = make_token(user_id="user_dup_222", email="u2@test.com")

    headers_1 = {"Authorization": f"Bearer {token_u1}"}
    headers_2 = {"Authorization": f"Bearer {token_u2}"}

    identical_content = "This exact content is uploaded independently by two distinct user accounts.\n"

    # User 1 uploads the file
    res1 = client.post(
        "/documents",
        headers=headers_1,
        files={"file": ("shared_manifesto.txt", identical_content.encode("utf-8"), "text/plain")},
    )
    assert res1.status_code == 200, f"User 1 upload failed: {res1.text}"
    doc1_id = res1.json()["document_id"]
    assert res1.json()["status"] == "ingested"

    # User 2 uploads the EXACT SAME bytes
    res2 = client.post(
        "/documents",
        headers=headers_2,
        files={"file": ("shared_manifesto.txt", identical_content.encode("utf-8"), "text/plain")},
    )
    assert res2.status_code == 200, f"User 2 upload failed (uniqueness conflict!): {res2.text}"
    doc2_id = res2.json()["document_id"]
    assert res2.json()["status"] == "ingested"
    assert doc1_id != doc2_id, "Both users received the exact same document ID!"

    # User 1 re-uploads identical file -> should report already_ingested
    res1_re = client.post(
        "/documents",
        headers=headers_1,
        files={"file": ("shared_manifesto.txt", identical_content.encode("utf-8"), "text/plain")},
    )
    assert res1_re.status_code == 200
    assert res1_re.json()["status"] == "already_ingested"

    # User 1 deletes their document
    del1 = client.delete(f"/documents/{doc1_id}", headers=headers_1)
    assert del1.status_code == 200

    # User 2's document must still be present and completed
    get2 = client.get(f"/documents/{doc2_id}", headers=headers_2)
    assert get2.status_code == 200
    assert get2.json()["status"] == "completed"

    # Cleanup User 2's document
    client.delete(f"/documents/{doc2_id}", headers=headers_2)
    print("    [PASS] Per-user deduplication works: identical files ingested without collision.")


if __name__ == "__main__":
    test_authentication_required()
    test_pdf_ingestion_and_citations()
    test_multi_user_isolation()
    test_rate_limiting_and_quotas()
    test_identical_file_upload_different_users()

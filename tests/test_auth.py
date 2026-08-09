def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Jane SRE",
            "email": "jane@aiops.local",
            "password": "SecurePass123!",
            "role": "SRE",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "jane@aiops.local"
    assert "hashed_password" not in body  # never leak password hash


def test_register_duplicate_email_rejected(client):
    payload = {
        "full_name": "Jane SRE",
        "email": "dup@aiops.local",
        "password": "SecurePass123!",
        "role": "SRE",
    }
    client.post("/api/v1/auth/register", json=payload)
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


def test_login_success(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.local", "password": "Password123!"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_invalid_password(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.local", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_protected_route_requires_token(client):
    response = client.get("/api/v1/servers")
    assert response.status_code == 401

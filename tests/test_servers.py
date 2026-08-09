def test_register_server(client, auth_headers):
    response = client.post(
        "/api/v1/servers",
        json={
            "hostname": "prod-web-99",
            "ip_address": "10.0.1.99",
            "environment": "PRODUCTION",
            "cloud_provider": "AWS",
            "region": "us-east-1",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["hostname"] == "prod-web-99"
    assert "api_key" in body  # returned once at registration


def test_list_servers(client, auth_headers):
    client.post(
        "/api/v1/servers",
        json={"hostname": "srv-a", "ip_address": "10.0.0.1"},
        headers=auth_headers,
    )
    response = client.get("/api/v1/servers", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_nonexistent_server_returns_404(client, auth_headers):
    response = client.get(
        "/api/v1/servers/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )
    assert response.status_code == 404

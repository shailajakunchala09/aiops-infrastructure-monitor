def _register_server(client, auth_headers):
    response = client.post(
        "/api/v1/servers",
        json={"hostname": "log-test-srv", "ip_address": "10.0.7.7"},
        headers=auth_headers,
    )
    return response.json()


def test_ingest_and_search_logs(client, auth_headers):
    server = _register_server(client, auth_headers)
    client.post(
        "/api/v1/logs/ingest",
        json={
            "source_application": "checkout-service",
            "level": "ERROR",
            "message": "Payment gateway timeout after 30s",
        },
        headers={"X-API-Key": server["api_key"]},
    )

    response = client.get(
        "/api/v1/logs", params={"keyword": "Payment gateway"}, headers=auth_headers
    )
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["level"] == "ERROR"


def test_repeated_critical_logs_auto_create_incident(client, auth_headers):
    server = _register_server(client, auth_headers)
    for _ in range(3):
        client.post(
            "/api/v1/logs/ingest",
            json={
                "source_application": "auth-service",
                "level": "CRITICAL",
                "message": "Unhandled exception in token validation",
            },
            headers={"X-API-Key": server["api_key"]},
        )

    incidents = client.get(
        "/api/v1/incidents", params={"server_id": server["id"]}, headers=auth_headers
    ).json()
    assert any(i["source"] == "AUTO_LOG_ERROR" for i in incidents)


def test_log_level_distribution(client, auth_headers):
    server = _register_server(client, auth_headers)
    client.post(
        "/api/v1/logs/ingest",
        json={"source_application": "web", "level": "INFO", "message": "Request handled"},
        headers={"X-API-Key": server["api_key"]},
    )
    response = client.get("/api/v1/logs/analytics/level-distribution", headers=auth_headers)
    assert response.status_code == 200

def test_create_and_resolve_incident(client, auth_headers):
    create_response = client.post(
        "/api/v1/incidents",
        json={
            "title": "Database connection pool exhausted",
            "description": "App servers reporting connection timeouts to prod-db-01",
            "severity": "SEV2_HIGH",
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    incident = create_response.json()
    assert incident["status"] == "OPEN"

    update_response = client.patch(
        f"/api/v1/incidents/{incident['id']}",
        json={"status": "RESOLVED", "resolution_notes": "Increased pool size and restarted service"},
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["status"] == "RESOLVED"
    assert updated["resolved_at"] is not None


def test_incident_stats_endpoint(client, auth_headers):
    client.post(
        "/api/v1/incidents",
        json={"title": "Disk almost full", "description": "desc", "severity": "SEV3_MEDIUM"},
        headers=auth_headers,
    )
    response = client.get("/api/v1/incidents/stats", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_open"] >= 1


def test_list_incidents_filter_by_severity(client, auth_headers):
    client.post(
        "/api/v1/incidents",
        json={"title": "Minor cache miss spike", "description": "desc", "severity": "SEV4_LOW"},
        headers=auth_headers,
    )
    response = client.get(
        "/api/v1/incidents", params={"severity": "SEV4_LOW"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert all(i["severity"] == "SEV4_LOW" for i in response.json())

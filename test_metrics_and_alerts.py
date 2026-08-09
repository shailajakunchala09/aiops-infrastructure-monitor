def _register_server(client, auth_headers, cpu_threshold=80.0):
    response = client.post(
        "/api/v1/servers",
        json={
            "hostname": "metrics-test-srv",
            "ip_address": "10.0.9.9",
            "cpu_threshold": cpu_threshold,
        },
        headers=auth_headers,
    )
    return response.json()


def test_ingest_metric_below_threshold_keeps_server_healthy(client, auth_headers):
    server = _register_server(client, auth_headers, cpu_threshold=90)
    response = client.post(
        "/api/v1/metrics/ingest",
        json={
            "cpu_percent": 40.0,
            "memory_percent": 50.0,
            "disk_percent": 30.0,
        },
        headers={"X-API-Key": server["api_key"]},
    )
    assert response.status_code == 201

    server_check = client.get(f"/api/v1/servers/{server['id']}", headers=auth_headers)
    assert server_check.json()["status"] == "HEALTHY"


def test_ingest_metric_above_threshold_triggers_alert_and_incident(client, auth_headers):
    server = _register_server(client, auth_headers, cpu_threshold=80)
    response = client.post(
        "/api/v1/metrics/ingest",
        json={
            "cpu_percent": 97.0,
            "memory_percent": 50.0,
            "disk_percent": 30.0,
        },
        headers={"X-API-Key": server["api_key"]},
    )
    assert response.status_code == 201

    alerts = client.get(
        "/api/v1/alerts", params={"server_id": server["id"]}, headers=auth_headers
    ).json()
    assert len(alerts) == 1
    assert alerts[0]["metric_type"] == "CPU"

    incidents = client.get(
        "/api/v1/incidents", params={"server_id": server["id"]}, headers=auth_headers
    ).json()
    assert len(incidents) == 1
    assert incidents[0]["source"] == "AUTO_METRIC_THRESHOLD"


def test_invalid_api_key_rejected(client):
    response = client.post(
        "/api/v1/metrics/ingest",
        json={"cpu_percent": 10, "memory_percent": 10, "disk_percent": 10},
        headers={"X-API-Key": "not-a-real-key"},
    )
    assert response.status_code == 401


def test_metric_out_of_range_rejected_by_validation(client, auth_headers):
    server = _register_server(client, auth_headers)
    response = client.post(
        "/api/v1/metrics/ingest",
        json={"cpu_percent": 150, "memory_percent": 10, "disk_percent": 10},
        headers={"X-API-Key": server["api_key"]},
    )
    assert response.status_code == 422

#!/usr/bin/env python3
"""
One-time helper to register a new server with the platform and print the
API key that should be exported as AIOPS_API_KEY before starting agent.py.

Usage:
    python register_server.py --hostname prod-web-03 --ip 10.0.1.13 \
        --env PRODUCTION --provider AWS --region us-east-1
"""
import argparse
import json
import socket

import requests


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="http://localhost:8000/api/v1")
    parser.add_argument("--admin-token", required=True, help="JWT for an ADMIN or SRE user")
    parser.add_argument("--hostname", default=socket.gethostname())
    parser.add_argument("--ip", required=True)
    parser.add_argument("--env", default="PRODUCTION", choices=["PRODUCTION", "STAGING", "DEVELOPMENT"])
    parser.add_argument("--provider", default="AWS")
    parser.add_argument("--region", default="us-east-1")
    parser.add_argument("--instance-type", default="t3.medium")
    args = parser.parse_args()

    response = requests.post(
        f"{args.api_url}/servers",
        json={
            "hostname": args.hostname,
            "ip_address": args.ip,
            "environment": args.env,
            "cloud_provider": args.provider,
            "region": args.region,
            "instance_type": args.instance_type,
        },
        headers={"Authorization": f"Bearer {args.admin_token}"},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    print(json.dumps(data, indent=2))
    print(f"\nExport this before starting the agent:\nexport AIOPS_API_KEY={data['api_key']}")


if __name__ == "__main__":
    main()

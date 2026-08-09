# Deployment Guide

This guide describes taking the platform from `docker-compose up` on a laptop
to a real cloud deployment. It is written at the level of detail expected in
a real runbook, without assuming any specific existing cloud account setup.

## 1. Container Images

Each service builds independently from the repository root:

```bash
docker build -f docker/backend.Dockerfile  -t aiops-backend:latest  .
docker build -f docker/frontend.Dockerfile -t aiops-frontend:latest .
docker build -f docker/agent.Dockerfile    -t aiops-agent:latest    .
```

Push to your registry of choice (ECR / ACR / Docker Hub):

```bash
docker tag aiops-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/aiops-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/aiops-backend:latest
```

## 2. AWS Reference Deployment (ECS Fargate)

1. **Database:** Provision an Amazon RDS PostgreSQL instance (Multi-AZ for
   production). Store the connection string in **AWS Secrets Manager**.
2. **Networking:** Deploy into a VPC with public subnets for the ALB and
   private subnets for the ECS tasks and RDS instance.
3. **Backend service:** Create an ECS Fargate service from the
   `aiops-backend` image.
   - Inject `DATABASE_URL` and `SECRET_KEY` from Secrets Manager as task
     environment variables (never bake secrets into the image).
   - Attach an Application Load Balancer target group on port `8000`,
     health-checked against `GET /health`.
   - Set desired count >= 2 and configure ECS Service Auto Scaling on
     CPU/memory utilization for production resilience.
4. **Frontend service:** Deploy `aiops-frontend` similarly behind the same
   ALB (path-based routing: `/api/*` -> backend target group, `/*` ->
   frontend target group), or serve the static build via S3 + CloudFront for
   a lower-cost static hosting option.
5. **Migrations:** Run `alembic upgrade head` as a one-off ECS task
   (or a CodeBuild step in CI/CD) before rolling out a new backend version.
6. **Logs & Monitoring:** Route container stdout to CloudWatch Logs; the
   platform's structured JSON log format (`app/core/logging_config.py`) is
   directly queryable with CloudWatch Logs Insights.
7. **DNS/TLS:** Point a Route 53 record at the ALB; terminate TLS with an
   ACM certificate on the ALB listener.

## 3. Azure Reference Deployment (Container Apps)

Equivalent mapping for teams standardized on Azure:

| AWS | Azure |
|---|---|
| ECS Fargate | Azure Container Apps / AKS |
| RDS PostgreSQL | Azure Database for PostgreSQL - Flexible Server |
| Secrets Manager | Azure Key Vault |
| CloudWatch | Azure Monitor / Log Analytics |
| ALB + Route 53 | Azure Front Door / Application Gateway |

## 4. CI/CD Pipeline

`.github/workflows/ci.yml` already runs on every push/PR:

1. **Backend:** lint (`ruff`), run Alembic migrations against a throwaway
   Postgres service container, run `pytest` with coverage.
2. **Frontend:** lint and production build (`npm run build`), catching
   build-breaking errors before merge.
3. **Docker:** validates that all three images build successfully.

To extend this into full CD, add a deploy job (gated on `main` branch pushes
after the above jobs pass) that:

```yaml
  deploy:
    needs: [backend-tests, frontend-build, docker-build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1
      - name: Build, push, and force new ECS deployment
        run: |
          # docker build/push steps, then:
          aws ecs update-service --cluster aiops-cluster \
            --service aiops-backend --force-new-deployment
```

(Omitted from the default pipeline in this repo since it requires
account-specific secrets - documented here as the next step for a real
deployment.)

## 5. Zero-Downtime Rollouts

- ECS/Container Apps rolling deployments with the `/health` check as the
  readiness gate prevent traffic from hitting a not-yet-ready container.
- Database migrations are additive-first (new columns nullable or
  defaulted) so the previous backend version keeps working during a rollout
  window, following standard expand/contract migration practice.

## 6. Backup & Disaster Recovery

- Enable automated RDS snapshots (or Azure PostgreSQL backups) with a
  retention window matching your incident-data compliance needs.
- `METRIC_RETENTION_DAYS` in application settings governs how long raw
  metric samples are kept before a scheduled cleanup job (not included by
  default, but straightforward to add as a periodic Alembic/cron job) prunes
  them - keep the underlying RDS backups regardless for point-in-time
  recovery of everything else (users, incidents, audit trail).

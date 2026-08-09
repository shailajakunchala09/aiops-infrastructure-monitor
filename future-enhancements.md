# Future Enhancements

Roadmap items that would be the natural next steps toward a fuller
production AIOps product - useful both as a genuine roadmap and to show
interviewers you've thought past the MVP.

## Near-term

- **Notification integrations**: Slack/Microsoft Teams/PagerDuty/email
  webhooks fired on alert-triggered and incident-created events (the
  `Alert.notified` flag already exists as a hook point).
- **Alert rule engine v2**: compound conditions (e.g. "CPU > 85% for 5
  consecutive samples") instead of single-sample threshold breaches, to
  further reduce noise.
- **Refresh token rotation endpoint**: `/auth/refresh` to exchange a valid
  refresh token for a new access token without re-authenticating.
- **Metric retention job**: a scheduled task that prunes `metrics` older
  than `METRIC_RETENTION_DAYS` to bound table growth, with optional
  downsampling (e.g. keep hourly averages beyond 30 days).

## Mid-term

- **Anomaly detection**: replace static thresholds with a lightweight
  statistical baseline (rolling mean/stddev) per server/metric to catch
  gradual drift, not just hard limits - the first real step toward "AIOps"
  in the machine-learning sense.
- **Multi-tenancy**: organization/team scoping so the platform can host
  multiple customers or business units with isolated data.
- **Distributed tracing correlation**: link `LogEntry.trace_id` values
  across services to reconstruct a request's path through a microservice
  architecture (OpenTelemetry-compatible).
- **WebSocket live updates**: push metric/incident updates to the dashboard
  instead of polling, reducing latency and API load.

## Long-term

- **Kubernetes-native deployment**: Helm chart, HPA-based autoscaling, and a
  Kubernetes-aware agent (DaemonSet) that also monitors pod-level metrics.
- **Runbook automation**: attach remediation scripts to specific alert
  types (e.g. auto-restart a service, scale out a group) with an approval
  gate for production environments.
- **SLA/SLO tracking**: define service-level objectives per application and
  report error-budget burn rate alongside the existing uptime metrics.
- **Machine-learning incident correlation**: automatically group related
  alerts/incidents across servers during a cascading failure into a single
  parent incident, reducing alert fatigue during major outages.

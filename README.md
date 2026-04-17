# @microsoft/opentelemetry

Microsoft OpenTelemetry distribution for Node.js — one import, one call, full observability across Azure Monitor, OTLP-compatible backends, and A365.

## Getting Started

```bash
npm install @microsoft/opentelemetry
```

```typescript
import { useMicrosoftOpenTelemetry } from "@microsoft/opentelemetry";

useMicrosoftOpenTelemetry({
  azureMonitor: {
    azureMonitorExporterOptions: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    },
  },
});
```

That's it — traces, metrics, and logs are collected automatically with built-in instrumentations for HTTP, databases, and more.

## Configuration

### `MicrosoftOpenTelemetryOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `resource` | `Resource` | auto-detected | OpenTelemetry Resource (service name, version, etc.) |
| `samplingRatio` | `number` | `1.0` | Ratio of telemetry items to transmit (0.0–1.0) |
| `tracesPerSecond` | `number` | `5` | Max traces per second. Set to `0` to use `samplingRatio` instead |
| `instrumentationOptions` | `InstrumentationOptions` | all enabled | Toggle built-in instrumentations (HTTP, MongoDB, MySQL, PostgreSQL, Redis, Azure SDK, Azure Functions, Winston, Bunyan, OpenAI Agents, LangChain) |
| `spanProcessors` | `SpanProcessor[]` | — | Additional span processors |
| `logRecordProcessors` | `LogRecordProcessor[]` | — | Additional log record processors |
| `metricReaders` | `MetricReader[]` | — | Additional metric readers |
| `views` | `ViewOptions[]` | — | Metric views |
| `azureMonitor` | `AzureMonitorOpenTelemetryOptions` | — | Azure Monitor backend config (see below) |
| `a365` | `A365Options` | — | A365 observability config |

### `azureMonitor` options

| Option | Type | Default | Description |
|---|---|---|---|
| `azureMonitorExporterOptions` | `AzureMonitorExporterOptions` | — | Exporter config including `connectionString`, `storageDirectory`, `disableOfflineStorage` |
| `enableLiveMetrics` | `boolean` | `true` | Enable Live Metrics streaming |
| `enableStandardMetrics` | `boolean` | `true` | Enable standard metrics collection |
| `enableTraceBasedSamplingForLogs` | `boolean` | `false` | Enable log sampling based on trace |
| `enablePerformanceCounters` | `boolean` | `true` | Enable performance counter collection |
| `browserSdkLoaderOptions` | `BrowserSdkLoaderOptions` | — | Application Insights browser SDK loader config |

### OTLP via environment variables

Set `OTEL_EXPORTER_OTLP_ENDPOINT` and OTLP export is enabled automatically — no code changes needed. Signal-specific variables (`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, etc.) override the base endpoint.

See the [OpenTelemetry OTLP Exporter specification](https://opentelemetry.io/docs/specs/otel/protocol/exporter/) for the full list.

### `a365` options

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `false` | Enable A365 observability export |
| `tokenResolver` | `(agentId, tenantId) => string \| Promise<string>` | — | Token resolver for A365 service authentication |
| `clusterCategory` | `ClusterCategory` | `"prod"` | Cluster category for endpoint resolution (`local`, `dev`, `test`, `preprod`, `firstrelease`, `prod`, `gov`, `high`, `dod`, `mooncake`, `ex`, `rx`) |
| `domainOverride` | `string` | — | Override the A365 observability service domain |
| `authScopes` | `string[]` | `["https://api.powerplatform.com/.default"]` | OAuth scopes for A365 service authentication |
| `perRequestExport` | `boolean` | `false` | Buffer spans per trace and export on root completion instead of batch export |

A365 options can also be set via environment variables (highest precedence):

| Environment Variable | Description |
|---|---|
| `MICROSOFT_OTEL_A365_EXPORTER_ENABLED` | `"true"` / `"false"` — override `enabled` |
| `MICROSOFT_OTEL_A365_PER_REQUEST_EXPORT` | `"true"` / `"false"` — override `perRequestExport` |
| `MICROSOFT_OTEL_A365_AUTH_SCOPES` | Comma-separated list of OAuth scopes |
| `MICROSOFT_OTEL_A365_DOMAIN` | Override service domain |
| `MICROSOFT_OTEL_A365_CLUSTER_CATEGORY` | Override cluster category |

### Example

```typescript
import { useMicrosoftOpenTelemetry, shutdownMicrosoftOpenTelemetry } from "@microsoft/opentelemetry";
import { resourceFromAttributes } from "@opentelemetry/resources";

useMicrosoftOpenTelemetry({
  resource: resourceFromAttributes({ "service.name": "my-app" }),
  samplingRatio: 0.5,
  azureMonitor: {
    azureMonitorExporterOptions: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    },
    enableLiveMetrics: true,
  },
});

// On shutdown
await shutdownMicrosoftOpenTelemetry();
```

## Samples

See the [samples/](./samples/) directory for working TypeScript examples covering connection setup, custom metrics, custom traces, sampling, OTLP dual-export, and more.


## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](LICENSE)

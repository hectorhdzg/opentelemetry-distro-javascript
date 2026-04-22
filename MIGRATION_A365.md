# Migrating from `@microsoft/agents-a365-observability` to `@microsoft/opentelemetry`

This guide covers migrating agent observability code from the standalone `@microsoft/agents-a365-observability` package (in [Agent365-nodejs](https://github.com/microsoft/Agent365-nodejs)) to the `@microsoft/opentelemetry` distribution.

## Quick Start

### Before (Agent365-nodejs)

```typescript
import { Builder } from "@microsoft/agents-a365-observability";

const manager = new Builder({
  tokenResolver: async (agentId, tenantId) => getToken(agentId, tenantId),
  clusterCategory: "prod",
}).build();
```

### After (@microsoft/opentelemetry)

```typescript
import { useMicrosoftOpenTelemetry } from "@microsoft/opentelemetry";

useMicrosoftOpenTelemetry({
  a365: {
    enabled: true,
    tokenResolver: async (agentId, tenantId) => getToken(agentId, tenantId),
    clusterCategory: "prod",
  },
});
```

## Package Changes

| Before | After |
|---|---|
| `npm install @microsoft/agents-a365-observability` | `npm install @microsoft/opentelemetry` |
| `import { ... } from "@microsoft/agents-a365-observability"` | `import { ... } from "@microsoft/opentelemetry"` |

## Import Mapping

All public APIs are re-exported from the root `@microsoft/opentelemetry` package:

| `@microsoft/agents-a365-observability` | `@microsoft/opentelemetry` |
|---|---|
| `OpenTelemetryConstants` | `OpenTelemetryConstants` |
| `OpenTelemetryScope` | `OpenTelemetryScope` |
| `InvokeAgentScope` | `InvokeAgentScope` |
| `ExecuteToolScope` | `ExecuteToolScope` |
| `InferenceScope` | `InferenceScope` |
| `OutputScope` | `OutputScope` |
| `BaggageBuilder` | `BaggageBuilder` |
| `BaggageScope` | `BaggageScope` |
| `runWithExportToken` | `runWithExportToken` |
| `updateExportToken` | `updateExportToken` |
| `getExportToken` | `getExportToken` |
| `runWithParentSpanRef` | `runWithParentSpanRef` |
| `createContextWithParentSpanRef` | `createContextWithParentSpanRef` |
| `injectContextToHeaders` | `injectContextToHeaders` |
| `extractContextFromHeaders` | `extractContextFromHeaders` |
| `runWithExtractedTraceContext` | `runWithExtractedTraceContext` |
| `MessageRole` | `MessageRole` |
| `FinishReason` | `FinishReason` |
| `Modality` | `Modality` |
| `InvocationRole` | `InvocationRole` |
| `InferenceOperationType` | `InferenceOperationType` |
| `A365_MESSAGE_SCHEMA_VERSION` | `A365_MESSAGE_SCHEMA_VERSION` |
| `GENERIC_ATTRIBUTES` | `GENERIC_ATTRIBUTES` |
| `INVOKE_AGENT_ATTRIBUTES` | `INVOKE_AGENT_ATTRIBUTES` |

### Types

| `@microsoft/agents-a365-observability` | `@microsoft/opentelemetry` |
|---|---|
| `Request` | `A365Request` (renamed to avoid collision with global `Request`) |
| `SpanDetails` | `A365SpanDetails` (renamed for clarity) |
| `AgentDetails` | `AgentDetails` |
| `UserDetails` | `UserDetails` |
| `CallerDetails` | `CallerDetails` |
| `Channel` | `Channel` |
| `ServiceEndpoint` | `ServiceEndpoint` |
| `InvokeAgentScopeDetails` | `InvokeAgentScopeDetails` |
| `ToolCallDetails` | `ToolCallDetails` |
| `InferenceDetails` | `InferenceDetails` |
| `InferenceResponse` | `InferenceResponse` |
| `OutputResponse` | `OutputResponse` |
| `ParentSpanRef` | `ParentSpanRef` |
| `ParentContext` | `ParentContext` |
| `ChatMessage` | `ChatMessage` |
| `InputMessages` | `InputMessages` |
| `OutputMessage` | `OutputMessage` |
| `OutputMessages` | `OutputMessages` |
| `InputMessagesParam` | `InputMessagesParam` |
| `OutputMessagesParam` | `OutputMessagesParam` |
| `ResponseMessagesParam` | `ResponseMessagesParam` |
| `MessagePart` | `MessagePart` |
| `TextPart` | `TextPart` |
| `ToolCallRequestPart` | `ToolCallRequestPart` |
| `ToolCallResponsePart` | `ToolCallResponsePart` |
| `ReasoningPart` | `ReasoningPart` |
| `HeadersCarrier` | `HeadersCarrier` |

### Processor Classes

| `@microsoft/agents-a365-observability` | `@microsoft/opentelemetry` | Notes |
|---|---|---|
| `SpanProcessor` (from `processors/`) | `A365SpanProcessor` | Renamed to avoid collision with OTel `SpanProcessor` |
| `PerRequestSpanProcessor` | `PerRequestSpanProcessor` | Same name |

## Initialization

### Before: `ObservabilityBuilder`

The Agent365-nodejs package used `ObservabilityBuilder` / `ObservabilityManager`:

```typescript
import { Builder } from "@microsoft/agents-a365-observability";

const manager = new Builder({
  tokenResolver: async (agentId, tenantId) => getToken(agentId, tenantId),
  clusterCategory: "prod",
  perRequestExport: true,
}).build();
```

### After: `useMicrosoftOpenTelemetry`

The new package uses a unified initialization call:

```typescript
import { useMicrosoftOpenTelemetry } from "@microsoft/opentelemetry";

useMicrosoftOpenTelemetry({
  a365: {
    enabled: true,
    tokenResolver: async (agentId, tenantId) => getToken(agentId, tenantId),
    clusterCategory: "prod",
    perRequestExport: true,
  },
  // Optional: also send to Azure Monitor
  azureMonitor: {
    azureMonitorExporterOptions: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    },
  },
});
```

## Environment Variables

Environment variable names are **unchanged** from Agent365-nodejs:

| Environment Variable | Description |
|---|---|
| `ENABLE_A365_OBSERVABILITY_EXPORTER` | Enable/disable A365 exporter (`true`, `1`, `yes`, `on`) |
| `ENABLE_A365_OBSERVABILITY_PER_REQUEST_EXPORT` | Enable/disable per-request export mode |
| `A365_OBSERVABILITY_SCOPES_OVERRIDE` | Space-separated list of OAuth scopes |
| `A365_OBSERVABILITY_DOMAIN_OVERRIDE` | Override service domain |
| `CLUSTER_CATEGORY` | Cluster category (`prod`, `dev`, `test`, etc.) |
| `A365_PER_REQUEST_MAX_TRACES` | Max buffered traces (default: `1000`) |
| `A365_PER_REQUEST_MAX_SPANS_PER_TRACE` | Max spans per trace (default: `5000`) |
| `A365_PER_REQUEST_MAX_CONCURRENT_EXPORTS` | Max concurrent exports (default: `20`) |
| `A365_PER_REQUEST_FLUSH_GRACE_MS` | Grace period after root span ends (default: `250`) |
| `A365_PER_REQUEST_MAX_TRACE_AGE_MS` | Max trace age before forced flush (default: `1800000`) |

## Scopes

Scope API is unchanged. All scopes use static factory methods (`Scope.start(...)`) and are cleaned up with `.dispose()`. Just update the import path:

### Before

```typescript
import {
  InvokeAgentScope,
  InferenceScope,
  ExecuteToolScope,
  OutputScope,
} from "@microsoft/agents-a365-observability";
import type { AgentDetails, Request, InvokeAgentScopeDetails } from "@microsoft/agents-a365-observability";

const request: Request = { conversationId: "conv-123", channel: { name: "msteams" } };
const agentDetails: AgentDetails = { agentId: "agent-123", agentName: "MyAgent", tenantId: "tenant-456" };
const scopeDetails: InvokeAgentScopeDetails = { endpoint: { host: "example.com", port: 443 } };

const scope = InvokeAgentScope.start(request, scopeDetails, agentDetails);
try {
  scope.recordInputMessages(["What is the weather?"]);
  // ... agent work
  scope.recordResponse("It's sunny!");
} finally {
  scope.dispose();
}
```

### After

```typescript
import {
  InvokeAgentScope,
  InferenceScope,
  ExecuteToolScope,
  OutputScope,
} from "@microsoft/opentelemetry";
import type { A365Request, AgentDetails, InvokeAgentScopeDetails } from "@microsoft/opentelemetry";

// Same API — just a different import path (and Request → A365Request)
const request: A365Request = { conversationId: "conv-123", channel: { name: "msteams" } };
const agentDetails: AgentDetails = { agentId: "agent-123", agentName: "MyAgent", tenantId: "tenant-456" };
const scopeDetails: InvokeAgentScopeDetails = { endpoint: { host: "example.com", port: 443 } };

const scope = InvokeAgentScope.start(request, scopeDetails, agentDetails);
try {
  scope.recordInputMessages(["What is the weather?"]);
  // ... agent work
  scope.recordResponse("It's sunny!");
} finally {
  scope.dispose();
}
```

## BaggageBuilder

The `BaggageBuilder` fluent API is identical:

```typescript
import { BaggageBuilder } from "@microsoft/opentelemetry";

const scope = new BaggageBuilder()
  .tenantId("tenant-123")
  .agentId("agent-456")
  .sessionId("session-789")
  .build();

scope.run(() => {
  // Baggage is active in this context
  // A365SpanProcessor copies baggage to span attributes automatically
});
```

## Token Context

Per-request token management is identical:

```typescript
import { runWithExportToken, updateExportToken } from "@microsoft/opentelemetry";

runWithExportToken(initialToken, async () => {
  // Start spans...

  // Refresh token before long-running request completes
  updateExportToken(refreshedToken);

  // End root span — export uses the refreshed token
});
```

## What's Not Migrated

The following Agent365-nodejs components are **not** included in `@microsoft/opentelemetry` because they are runtime/hosting concerns or internal utilities:

| Component | Reason |
|---|---|
| `ObservabilityManager` / `ObservabilityBuilder` / `Builder` | Replaced by `useMicrosoftOpenTelemetry()` |
| `ObservabilityConfiguration` / `BuilderOptions` | Replaced by `A365Options` passed to `useMicrosoftOpenTelemetry()` |
| `IConfigurationProvider` | Replaced by direct options + env vars |
| `@microsoft/agents-a365-runtime` | Runtime configuration framework — not needed |
| `@microsoft/agents-hosting` | HTTP hosting middleware — separate concern |
| `@microsoft/agents-a365-observability-hosting` | Hosting middleware (`BaggageMiddleware`, `OutputLoggingMiddleware`, etc.) — separate concern |
| `AgenticTokenCache` | Token caching is the caller's responsibility |
| `logger` / `setLogger` / `getLogger` / `ILogger` | Use OpenTelemetry's `DiagLogger` API instead |
| `safeSerializeToJson` / `serializeMessages` | Internal utilities — not part of the public API |
| `ExporterEventNames` | Internal exporter events — not needed by consumers |
| `isPerRequestExportEnabled` / `MAX_SPAN_SIZE_BYTES` | Internal constants — not needed by consumers |

## Checklist

- [ ] Replace `@microsoft/agents-a365-observability` dependency with `@microsoft/opentelemetry`
- [ ] Update all imports to use `@microsoft/opentelemetry`
- [ ] Replace `Builder().build()` with `useMicrosoftOpenTelemetry({ a365: { ... } })`
- [ ] Rename `Request` type references to `A365Request`
- [ ] Rename `SpanDetails` type references to `A365SpanDetails`
- [ ] Rename `SpanProcessor` references to `A365SpanProcessor`
- [ ] Verify environment variables work (names are unchanged)
- [ ] Remove `@microsoft/agents-a365-runtime` dependency if no longer needed

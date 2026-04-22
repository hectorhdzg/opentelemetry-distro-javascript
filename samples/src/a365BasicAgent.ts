// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @summary Basic Agent sample — ported from Agent365-nodejs basic-agent-sdk-sample.
 *
 * This sample demonstrates a realistic agents-hosting Express server with
 * full A365 observability using `@microsoft/opentelemetry`. It shows:
 *
 *   1. Initialize the distro with `useMicrosoftOpenTelemetry()`
 *   2. Set up an Express server with a `/api/messages` endpoint
 *   3. Handle incoming messages with InvokeAgentScope, InferenceScope, ExecuteToolScope
 *   4. Use BaggageBuilder for baggage propagation
 *   5. Support both batch and per-request export modes via `runWithExportToken()`
 *
 * This is a standalone sample that simulates the agent-hosting adapter with
 * mock objects, so it does not require `@microsoft/agents-hosting` to run.
 *
 * Original: https://github.com/microsoft/Agent365-nodejs (basic-agent-sdk-sample)
 */

import {
  useMicrosoftOpenTelemetry,
  shutdownMicrosoftOpenTelemetry,
  InvokeAgentScope,
  InferenceScope,
  ExecuteToolScope,
  BaggageBuilder,
  InferenceOperationType,
  runWithExportToken,
} from "@microsoft/opentelemetry";
import type {
  AgentDetails,
  A365Request,
  InferenceDetails,
  ToolCallDetails,
  CallerDetails,
  InvokeAgentScopeDetails,
  ServiceEndpoint,
} from "@microsoft/opentelemetry";
import express from "express";
import "dotenv/config";

// ────────────────────────────────────────────────────────────────────────────
// Simple in-memory token cache
// ────────────────────────────────────────────────────────────────────────────

const tokenCache = new Map<string, string>();

function createAgenticTokenCacheKey(agentId: string, tenantId?: string): string {
  return tenantId ? `agentic-token-${agentId}-${tenantId}` : `agentic-token-${agentId}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Token resolver for batch export mode
// ────────────────────────────────────────────────────────────────────────────

function tokenResolver(agentId: string, tenantId: string): string {
  const cacheKey = createAgenticTokenCacheKey(agentId, tenantId);
  return tokenCache.get(cacheKey) ?? "";
}

// ────────────────────────────────────────────────────────────────────────────
// Agent details helpers
// ────────────────────────────────────────────────────────────────────────────

function resolveAgentId(): string {
  return process.env.AGENT_ID || "aaaaaaaa-0000-1111-2222-bbbbbbbbbbbb";
}

function resolveTenantId(): string {
  return (
    process.env.connections__serviceConnection__settings__tenantId ||
    "aaaabbbb-0000-cccc-1111-dddd2222eeee"
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Simulated agent logic
// ────────────────────────────────────────────────────────────────────────────

async function performInference(
  prompt: string,
  agentDetails: AgentDetails,
  conversationId: string,
): Promise<string> {
  const inferenceDetails: InferenceDetails = {
    operationName: InferenceOperationType.CHAT,
    model: "gpt-4o-mini",
    providerName: "Azure OpenAI",
    inputTokens: 33,
    outputTokens: 32,
  };

  const request: A365Request = {
    conversationId,
    channel: { name: "msteams" },
    sessionId: "__PERSONAL_CHAT_ID__",
  };

  const scope = InferenceScope.start(request, inferenceDetails, agentDetails);

  try {
    return await scope.withActiveSpanAsync(async () => {
      // Simulate LLM call latency
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response =
        "Hello! I can help answer questions, provide information, " +
        "assist with problem-solving, offer writing suggestions, and more. " +
        "Just let me know what you need!";

      scope.recordInputMessages([prompt]);
      scope.recordOutputMessages([response]);
      scope.recordFinishReasons(["stop"]);

      return response;
    });
  } catch (error) {
    scope.recordError(error as Error);
    throw error;
  } finally {
    scope.dispose();
  }
}

async function performToolCall(
  agentDetails: AgentDetails,
  conversationId: string,
): Promise<string> {
  const toolDetails: ToolCallDetails = {
    toolName: "get_weather",
    arguments: "current location",
    toolCallId: "bbbbbbbb-1111-2222-3333-cccccccccccc",
    toolType: "function",
    description: "Executing get_weather tool",
  };

  const request: A365Request = {
    conversationId,
    channel: { name: "msteams" },
    sessionId: "__PERSONAL_CHAT_ID__",
  };

  const scope = ExecuteToolScope.start(request, toolDetails, agentDetails);

  try {
    return await scope.withActiveSpanAsync(async () => {
      // Simulate tool execution
      await new Promise((resolve) => setTimeout(resolve, 200));

      const response = "The weather is sunny with a high of 75 degrees.";
      scope.recordResponse(response);
      return response;
    });
  } catch (error) {
    scope.recordError(error as Error);
    throw error;
  } finally {
    scope.dispose();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Message handler — equivalent to the original agent.ts onActivity handler
// ────────────────────────────────────────────────────────────────────────────

async function handleMessage(userText: string): Promise<string> {
  const agentId = resolveAgentId();
  const tenantId = resolveTenantId();
  const conversationId = "conv-" + Date.now();

  // Build baggage context from agent/tenant details
  const baggageScope = new BaggageBuilder()
    .tenantId(tenantId)
    .agentId(agentId)
    .agentName("Azure OpenAI Agent")
    .conversationId(conversationId)
    .invokeAgentServer("http://localhost", 3978)
    .build();

  return await baggageScope.run(async () => {
    const agentDetails: AgentDetails = {
      agentId,
      agentName: "Azure OpenAI Agent",
      agentDescription: "An AI agent powered by Azure OpenAI",
      agentAUID: "aaaaaaaa-bbbb-cccc-1111-222222222222",
      agentBlueprintId: "00001111-aaaa-2222-bbbb-3333cccc4444",
      tenantId,
    };

    const scopeDetails: InvokeAgentScopeDetails = {
      endpoint: { host: "http://localhost", port: 3978 } as ServiceEndpoint,
    };

    const request: A365Request = {
      conversationId,
      channel: { name: "msteams" },
      sessionId: "__PERSONAL_CHAT_ID__",
    };

    const callerDetails: CallerDetails = {
      userDetails: {
        userId: "bbbbbbbb-cccc-dddd-2222-333333333333",
        userName: "Alex Wilber",
      },
    };

    // Create the top-level InvokeAgentScope
    const invokeScope = InvokeAgentScope.start(
      request,
      scopeDetails,
      agentDetails,
      callerDetails,
    );

    let response: string;
    try {
      await invokeScope.withActiveSpanAsync(async () => {
        invokeScope.recordInputMessages([userText]);

        const llmResponse = await performInference(userText, agentDetails, conversationId);
        const toolResponse = await performToolCall(agentDetails, conversationId);

        response = `${llmResponse}\n\n${toolResponse}`;
        invokeScope.recordOutputMessages([llmResponse, toolResponse]);
      });
    } catch (error) {
      invokeScope.recordError(error as Error);
      throw error;
    } finally {
      invokeScope.dispose();
    }

    return response!;
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Express server — equivalent to the original index.ts
// ────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // ── Initialize the distro (replaces ObservabilityManager.configure) ──────
  useMicrosoftOpenTelemetry({
    a365: {
      enabled: true,
      tokenResolver,
      clusterCategory: "dev",
    },
    // Azure Monitor is always initialized; provide a connection string via env
    // or use this placeholder (telemetry will simply fail to export silently).
    azureMonitor: {
      azureMonitorExporterOptions: {
        connectionString:
          process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
          "InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://localhost",
      },
    },
  });

  const app = express();
  app.use(express.json());

  const isPerRequestExportEnabled =
    process.env.ENABLE_A365_OBSERVABILITY_PER_REQUEST_EXPORT?.toLowerCase() === "true";

  app.post("/api/messages", async (req, res) => {
    try {
      const userText: string = req.body?.text || "hi, what can you do";

      if (!isPerRequestExportEnabled) {
        // Batch export mode — token resolution is handled by tokenResolver callback
        const reply = await handleMessage(userText);
        res.json({ text: reply });
        return;
      }

      // Per-request export mode — wrap in runWithExportToken so the
      // PerRequestSpanProcessor can attach the token to the export
      const token = process.env.A365_BEARER_TOKEN || "<token>";
      await runWithExportToken(token, async () => {
        const reply = await handleMessage(userText);
        res.json({ text: reply });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[diagnostic] request failed:", message);
      if (!res.headersSent) {
        res.status(500).json({ error: "internal_error", detail: message });
      }
    }
  });

  // Health check
  app.get("/", (_req, res) => {
    res.json({ status: "ok", agent: "basic-agent-distro-sample" });
  });

  const port = process.env.PORT || 3978;
  const server = app
    .listen(port, () => {
      console.log(`\nServer listening on port ${port}`);
      console.log(`POST http://localhost:${port}/api/messages  — send { "text": "hello" }`);
      console.log(`GET  http://localhost:${port}/              — health check\n`);
    })
    .on("error", async (err: Error) => {
      console.error(err);
      await shutdownMicrosoftOpenTelemetry();
      process.exit(1);
    });

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    server.close(async () => {
      await shutdownMicrosoftOpenTelemetry();
      console.log("Done.");
      process.exit(0);
    });
  });
}

main().catch(console.error);

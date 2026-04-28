# A365 observability


## Installation

Use these commands to install the observability modules for the languages supported by Agent 365.

### Python

Install the Microsoft OpenTelemetry package.


```bash
pip install microsoft-opentelemetry
```

### JavaScript

Install the Microsoft OpenTelemetry package.


```bash
npm install @microsoft/opentelemetry
```

## Configuration

Use the following settings to enable and customize Agent 365 Observability for your agent.


### Python

```python
from microsoft.opentelemetry import use_microsoft_opentelemetry

# Define a token resolver to authenticate with the observability service for exporting logs
def token_resolver(agent_id, tenant_id):
    # Your token resolution logic here
    return "your-token"

use_microsoft_opentelemetry(
    enable_a365=True,
    a365_token_resolver=token_resolver,
)
```

### JavaScript

```javascript
import { useMicrosoftOpenTelemetry } from '@microsoft/opentelemetry';

// Define a token resolver to authenticate with the observability service for exporting logs
const tokenResolver = (agentId, tenantId) => {
    // Your token resolution logic here
    return "your-token";
};

useMicrosoftOpenTelemetry({
  a365: {
    enabled: true,
    tokenResolver: (agentId, tenantId) => {
      return tokenResolver(agentId, tenantId);
    },
  },
});
```

You can customize the exporter behavior by passing options. This allows you to control the cluster category and other settings.

### Python

```python
from microsoft.opentelemetry import use_microsoft_opentelemetry

use_microsoft_opentelemetry(
    enable_a365=True,
    a365_token_resolver=token_resolver,
    a365_cluster_category="prod",
)
```

### JavaScript

```javascript
import { useMicrosoftOpenTelemetry } from '@microsoft/opentelemetry';

useMicrosoftOpenTelemetry({
  a365: {
    enabled: true,
    tokenResolver: tokenResolver,
    clusterCategory: 'prod',
  },
});
```

## Baggage attributes

Use `BaggageBuilder` to set contextual information that flows through all spans in a request. The SDK implements a `SpanProcessor` that copies all nonempty baggage entries to newly started spans without overwriting existing attributes.

### Python

```python
from microsoft.opentelemetry.a365.core import BaggageBuilder

# Create and apply baggage context
baggage_scope = (
    BaggageBuilder()
    # Core identifiers
    .tenant_id('tenant-123')
    .agent_id('agent-456')
    .conversation_id('conv-789')
    .build()
)

# Execute operations within the baggage context
with baggage_scope:
    # All spans created within this context will inherit the baggage values

    # Invoke another agent
    scope = InvokeAgentScope.start(request, scope_details, agent_details)
    # ... agent logic

    # Execute tools
    tool_scope = ExecuteToolScope.start(request, tool_details, agent_details)
    # ... tool logic
```

### JavaScript

```javascript
import { BaggageBuilder } from '@microsoft/opentelemetry';

// Create and apply baggage context
const baggageScope = new BaggageBuilder()
  // Core identifiers
  .tenantId('tenant-123')
  .agentId('agent-456')
  .conversationId('conv-789')
  .build();

// Execute operations within the baggage context
baggageScope.run(() => {
  // All spans created within this context will inherit the baggage values

  // Invoke another agent
  const agentScope = InvokeAgentScope.start(request, scopeDetails, agentDetails);
  // ... agent logic

  // Execute tools
  const toolScope = ExecuteToolScope.start(request, toolDetails, agentDetails);
  // ... tool logic
});
```

To auto-populate the BaggageBuilder from the TurnContext, use the `fromTurnContext` helper. This helper automatically extracts caller, agent, tenant, channel, and conversation details from the activity.

### JavaScript

```javascript
import { BaggageBuilder, BaggageBuilderUtils } from '@microsoft/opentelemetry';

const baggageScope = BaggageBuilderUtils.fromTurnContext(new BaggageBuilder(), context)
  .invokeAgentServer(context.activity.serviceUrl, 3978)
  .build();

await baggageScope.run(async () => {
  // Baggage is auto-populated from the TurnContext activity
});
```

### Baggage middleware

If your agent uses the hosting integration package, register baggage middleware to automatically populate baggage for every incoming request. This step removes the need to call `BaggageBuilder` manually in each activity handler.

Register `BaggageMiddleware` on the adapter. It automatically extracts caller, agent, tenant, channel, and conversation details from every incoming `TurnContext` and wraps the request in a baggage scope.

#### Python

```python
from microsoft.opentelemetry.a365.hosting.middleware import BaggageMiddleware

# Option 1: Register middleware directly on the adapter
adapter.use(BaggageMiddleware())
```

Alternatively, use `ObservabilityHostingManager` to configure baggage middleware along with other hosting features:

```python
from microsoft.opentelemetry.a365.hosting.middleware import (
    ObservabilityHostingManager,
    ObservabilityHostingOptions,
)

manager = ObservabilityHostingManager()
manager.configure(adapter, ObservabilityHostingOptions(enable_baggage=True))
```

#### JavaScript

```javascript
import { BaggageMiddleware } from '@microsoft/opentelemetry';

// Option 1: Register middleware directly on the adapter
adapter.use(new BaggageMiddleware());
```

Alternatively, use `ObservabilityHostingManager` to configure baggage middleware along with other hosting features:

```javascript
import { ObservabilityHostingManager } from '@microsoft/opentelemetry';

const manager = new ObservabilityHostingManager();
manager.configure(adapter, { enableBaggage: true });
```

The middleware skips baggage setup for async replies (`ContinueConversation` events) to avoid overwriting baggage that the originating request already set.

## Auto-instrumentation

Auto-instrumentation automatically listens to agentic frameworks (SDKs) existing telemetry signals for traces and forwards them to Agent 365 observability service. This feature eliminates the need for developers to write monitoring code manually, simplifies setup, and ensures consistent performance tracking.

Multiple SDKs and platforms support auto-instrumentation:

| Platform | Supported frameworks |
|----------|---------------------|
| Python | Semantic Kernel, OpenAI, Agent Framework, LangChain |
| Node.js | OpenAI, LangChain |

> [!NOTE]
> Support for auto-instrumentation varies by platform and SDK implementation.

### Semantic Kernel

Auto instrumentation requires the use of baggage builder. Set agent ID and tenant ID by using `BaggageBuilder`.

#### Python

```python
from microsoft.opentelemetry import use_microsoft_opentelemetry

use_microsoft_opentelemetry(
    enable_a365=True,
    a365_token_resolver=token_resolver,
    instrumentation_options={
        "semantic_kernel": {"enabled": True},
    },
)
```

#### JavaScript

Semantic Kernel isn't supported with JavaScript.

### OpenAI

Auto instrumentation requires the use of baggage builder. Set agent ID and tenant ID by using `BaggageBuilder`.

#### Python

```python
from microsoft.opentelemetry import use_microsoft_opentelemetry

use_microsoft_opentelemetry(
    enable_a365=True,
    a365_token_resolver=token_resolver,
    instrumentation_options={
        "openai_agents": {"enabled": True},
    },
)
```

#### JavaScript

```javascript
import { useMicrosoftOpenTelemetry } from '@microsoft/opentelemetry';

useMicrosoftOpenTelemetry({
  a365: {
    enabled: true,
    tokenResolver: tokenResolver,
  },
  instrumentationOptions: {
    openaiAgents: { enabled: true },
  },
});
```

### Agent Framework

Auto instrumentation requires the use of baggage builder. Set agent ID and tenant ID by using `BaggageBuilder`.

#### Python

```python
from microsoft.opentelemetry import use_microsoft_opentelemetry

use_microsoft_opentelemetry(
    enable_a365=True,
    a365_token_resolver=token_resolver,
    instrumentation_options={
        "agent_framework": {"enabled": True},
    },
)
```

#### JavaScript

Agent Framework isn't supported with JavaScript.

### LangChain Framework

Auto-instrumentation requires the use of baggage builder. Set agent ID and tenant ID by using `BaggageBuilder`.

#### Python

```python
from microsoft.opentelemetry import use_microsoft_opentelemetry

use_microsoft_opentelemetry(
    enable_a365=True,
    a365_token_resolver=token_resolver,
    instrumentation_options={
        "langchain": {"enabled": True},
    },
)
```

#### JavaScript

```javascript
import { useMicrosoftOpenTelemetry } from '@microsoft/opentelemetry';

useMicrosoftOpenTelemetry({
  a365: {
    enabled: true,
    tokenResolver: tokenResolver,
  },
  instrumentationOptions: {
    langchain: { enabled: true },
  },
});
```

## Manual Instrumentation

Use Agent 365 observability SDK to understand the internal working of the agent. The SDK provides scopes that you can start: `InvokeAgentScope`, `ExecuteToolScope`, `InferenceScope`, and `OutputScope`.

### Agent invocation

Use this scope at the start of your agent process. By using the invoke agent scope, you can capture properties like the current agent being invoked, agent user data, and more.

#### Python

```python
from microsoft.opentelemetry.a365.core import (
    InvokeAgentScope,
    InvokeAgentScopeDetails,
    AgentDetails,
    CallerDetails,
    UserDetails,
    Channel,
    Request,
    ServiceEndpoint,
)

# Use the same agent_details instance across all scopes in a request
agent_details = AgentDetails(
    agent_id='agent-456',
    agent_name='Email Assistant',
    agent_description='An AI agent powered by Azure OpenAI',
    agentic_user_id='auid-123',
    agentic_user_email='agent@contoso.com',
    agent_blueprint_id='blueprint-789',
    tenant_id='tenant-123',
)

scope_details = InvokeAgentScopeDetails(
    endpoint=ServiceEndpoint(hostname='myagent.contoso.com', port=443),
)

# Use the same request instance across all scopes in a request
request = Request(
    content='Please help me organize my emails',
    session_id='session-42',
    conversation_id='conv-xyz',
    channel=Channel(name='msteams'),
)

# Optional: Caller details (human user, or agent-to-agent)
caller_details = CallerDetails(
    user_details=UserDetails(
        user_id='user-123',
        user_email='jane.doe@contoso.com',
        user_name='Jane Doe',
    ),
)

with InvokeAgentScope.start(
    request=request,
    scope_details=scope_details,
    agent_details=agent_details,
    caller_details=caller_details,
) as scope:
    # Record input messages
    scope.record_input_messages(['Please help me organize my emails', 'Focus on urgent items'])

    # Your agent invocation logic here
    response = invoke_agent(request.content)

    # Record output messages
    scope.record_output_messages(['I found 15 urgent emails', 'Here is your organized inbox'])
```

#### JavaScript

```javascript
import {
  InvokeAgentScope,
} from '@microsoft/opentelemetry';
import type {
  InvokeAgentScopeDetails,
  AgentDetails,
  CallerDetails,
  UserDetails,
  Channel,
  A365Request,
  ServiceEndpoint,
} from '@microsoft/opentelemetry';

// Use the same agentDetails instance across all scopes in a request
const agentDetails: AgentDetails = {
  agentId: 'agent-456',
  agentName: 'Email Assistant',
  agentDescription: 'An AI agent powered by Azure OpenAI',
  agentAUID: 'auid-123',
  agentEmail: 'agent@contoso.com',
  agentBlueprintId: 'blueprint-789',
  tenantId: 'tenant-123',
};

const scopeDetails: InvokeAgentScopeDetails = {
  endpoint: { host: 'myagent.contoso.com', port: 443 } as ServiceEndpoint,
};

// Use the same request instance across all scopes in a request
const request: A365Request = {
  content: 'Please help me organize my emails',
  sessionId: 'session-42',
  conversationId: 'conv-xyz',
  channel: { name: 'msteams' } as Channel,
};

// Optional: Caller details (human user, or agent-to-agent)
const callerDetails: CallerDetails = {
  userDetails: {
    userId: 'user-123',
    userEmail: 'jane.doe@contoso.com',
    userName: 'Jane Doe',
  } as UserDetails,
};

const scope = InvokeAgentScope.start(request, scopeDetails, agentDetails, callerDetails);

try {
  await scope.withActiveSpanAsync(async () => {
    // Record input messages
    scope.recordInputMessages(['Please help me organize my emails', 'Focus on urgent items']);

    // Your agent invocation logic here
    const response = await invokeAgent(request.content);

    // Record output messages
    scope.recordOutputMessages(['I found 15 urgent emails', 'Here is your organized inbox']);
  });
} catch (error) {
  scope.recordError(error as Error);
  throw error;
} finally {
  scope.dispose();
}
```

If your agent uses the hosting package, you can use `ScopeUtils.populateInvokeAgentScopeFromTurnContext` to create the scope with agent details, caller details, and channel information automatically derived from the `TurnContext`.

#### JavaScript

```javascript
import { ScopeUtils } from '@microsoft/opentelemetry';
import type { InvokeAgentScopeDetails, AgentDetails, ServiceEndpoint } from '@microsoft/opentelemetry';

const agentDetails: AgentDetails = { agentId: 'agent-456' };
const scopeDetails: InvokeAgentScopeDetails = {
  endpoint: { host: 'myagent.contoso.com', port: 443 } as ServiceEndpoint,
};

const scope = ScopeUtils.populateInvokeAgentScopeFromTurnContext(
  agentDetails,
  scopeDetails,
  context,     // TurnContext
  authToken    // authentication token string
);

try {
  await scope.withActiveSpanAsync(async () => {
    // Agent details, caller details, and channel are auto-populated from context
    const response = await invokeAgent(context.activity.text);
    scope.recordOutputMessages([response]);
  });
} finally {
  scope.dispose();
}
```

### Tool execution

The following examples show how to add observability tracking to your agent's tool execution. This tracking captures telemetry for monitoring and auditing purposes.

#### Python

```python
from microsoft.opentelemetry.a365.core import ExecuteToolScope, ToolCallDetails, ServiceEndpoint, ToolType

# Use the same agent_details and request instances from the InvokeAgentScope example above

tool_details = ToolCallDetails(
    tool_name='email-search',
    arguments={'query': 'from:boss@company.com', 'limit': 10},
    tool_call_id='tool-call-456',
    description='Search emails by criteria',
    tool_type=ToolType.FUNCTION.value,
    endpoint=ServiceEndpoint(
        hostname='tools.contoso.com',
        port=8080,  # Will be recorded since not 443
        protocol='https',
    ),
)

with ExecuteToolScope.start(
    request=request,
    details=tool_details,
    agent_details=agent_details,
) as scope:
    # Execute the tool
    result = search_emails(tool_details.arguments)

    # Record the tool execution result
    scope.record_response(result)
```

#### JavaScript

```javascript
import { ExecuteToolScope } from '@microsoft/opentelemetry';
import type { ToolCallDetails } from '@microsoft/opentelemetry';

// Use the same agentDetails and request instances from the InvokeAgentScope example above

const toolDetails: ToolCallDetails = {
  toolName: 'email-search',
  arguments: JSON.stringify({ query: 'from:boss@company.com', limit: 10 }),
  toolCallId: 'tool-call-456',
  description: 'Search emails by criteria',
  toolType: 'function',
  endpoint: {
    host: 'tools.contoso.com',
    port: 8080,  // Will be recorded since not 443
    protocol: 'https'
  },
};

const scope = ExecuteToolScope.start(request, toolDetails, agentDetails);

try {
  return await scope.withActiveSpanAsync(async () => {
    // Execute the tool
    const result = await searchEmails(toolDetails.arguments);

    // Record the tool execution result
    scope.recordResponse(result);

    return result;
  });
} catch (error) {
  scope.recordError(error as Error);
  throw error;
} finally {
  scope.dispose();
}
```

If your agent uses the hosting package, use `ScopeUtils.populateExecuteToolScopeFromTurnContext` to create the scope with agent details automatically derived from the `TurnContext`.

#### JavaScript

```javascript
import { ScopeUtils } from '@microsoft/opentelemetry';
import type { ToolCallDetails } from '@microsoft/opentelemetry';

const toolDetails: ToolCallDetails = {
  toolName: 'email-search',
  arguments: JSON.stringify({ query: 'from:boss@company.com' }),
  toolCallId: 'tool-call-456',
  toolType: 'function',
};

const scope = ScopeUtils.populateExecuteToolScopeFromTurnContext(
  toolDetails,
  context,     // TurnContext
  authToken    // authentication token string
);

try {
  await scope.withActiveSpanAsync(async () => {
    const result = await searchEmails(toolDetails.arguments);
    scope.recordResponse(JSON.stringify(result));
  });
} finally {
  scope.dispose();
}
```

### Inference

The following examples show how to instrument AI model inference calls with observability tracking to capture token usage, model details, and response metadata.

#### Python

```python
from microsoft.opentelemetry.a365.core import InferenceScope, InferenceCallDetails, InferenceOperationType

# Use the same agent_details and request instances from the InvokeAgentScope example above

inference_details = InferenceCallDetails(
    operationName=InferenceOperationType.CHAT,
    model='gpt-4o-mini',
    providerName='azure-openai',
)

with InferenceScope.start(
    request=request,
    details=inference_details,
    agent_details=agent_details,
) as scope:
    # Record input messages
    scope.record_input_messages(['Summarize the following emails for me...'])

    # Call the LLM
    response = call_llm()

    # Record detailed telemetry with granular methods
    scope.record_output_messages(['Here is your email summary...'])
    scope.record_input_tokens(145)
    scope.record_output_tokens(82)
    scope.record_finish_reasons(['stop'])
```

#### JavaScript

```javascript
import { InferenceScope, InferenceOperationType } from '@microsoft/opentelemetry';
import type { InferenceDetails } from '@microsoft/opentelemetry';

// Use the same agentDetails and request instances from the InvokeAgentScope example above

const inferenceDetails: InferenceDetails = {
  operationName: InferenceOperationType.CHAT,
  model: 'gpt-4o-mini',
  providerName: 'azure-openai',
};

const scope = InferenceScope.start(request, inferenceDetails, agentDetails);

try {
  return await scope.withActiveSpanAsync(async () => {
    // Record input messages
    scope.recordInputMessages(['Summarize the following emails for me...']);

    // Call the LLM
    const response = await callLLM();

    // Record detailed telemetry with granular methods
    scope.recordOutputMessages(['Here is your email summary...']);
    scope.recordInputTokens(145);
    scope.recordOutputTokens(82);
    scope.recordFinishReasons(['stop']);

    return response.text;
  });
} catch (error) {
  scope.recordError(error as Error);
  throw error;
} finally {
  scope.dispose();
}
```

If your agent uses the hosting package, you can use `ScopeUtils.populateInferenceScopeFromTurnContext` to create the scope with agent details automatically derived from the `TurnContext`.

#### JavaScript

```javascript
import { ScopeUtils } from '@microsoft/opentelemetry';
import type { InferenceDetails } from '@microsoft/opentelemetry';
import { InferenceOperationType } from '@microsoft/opentelemetry';

const inferenceDetails: InferenceDetails = {
  operationName: InferenceOperationType.CHAT,
  model: 'gpt-4o-mini',
  providerName: 'azure-openai',
};

const scope = ScopeUtils.populateInferenceScopeFromTurnContext(
  inferenceDetails,
  context,     // TurnContext
  authToken    // authentication token string
);

try {
  await scope.withActiveSpanAsync(async () => {
    const response = await callLLM();
    scope.recordOutputMessages([response.text]);
    scope.recordInputTokens(response.usage.inputTokens);
    scope.recordOutputTokens(response.usage.outputTokens);
  });
} finally {
  scope.dispose();
}
```

### Output

Use this scope for asynchronous scenarios where `InvokeAgentScope`, `ExecuteToolScope`, or `InferenceScope` can't capture output data synchronously. Start `OutputScope` as a child span to record the final output messages after the parent scope finishes.

#### Python

```python
from microsoft.opentelemetry.a365.core import OutputScope, Response, SpanDetails

# Use the same agent_details and request instances from the InvokeAgentScope example above

# Get the parent context from the originating scope
# parent_context = invoke_scope.get_span_context()

response = Response(
    messages=['Here is your organized inbox with 15 urgent emails.'],
)

with OutputScope.start(
    request=request,
    response=response,
    agent_details=agent_details,
    user_details=None,
    # span_details=SpanDetails(parent_context=parent_context),
) as scope:
    # Output messages are recorded automatically from the response
    pass
```

#### JavaScript

```javascript
import { OutputScope } from '@microsoft/opentelemetry';
import type { OutputResponse, A365SpanDetails } from '@microsoft/opentelemetry';

// Use the same agentDetails and request instances from the InvokeAgentScope example above

// Get the parent context from the originating scope
const parentContext = invokeScope.getSpanContext();

const response: OutputResponse = {
  messages: ['Here is your organized inbox with 15 urgent emails.'],
};

const scope = OutputScope.start(
  request,
  response,
  agentDetails,
  undefined, // userDetails
  { parentContext } as A365SpanDetails
);

// Output messages are recorded automatically from the response
scope.dispose();
```

## Validate locally

To verify that you successfully integrated with the observability SDK, examine the console logs generated by your agent and logs from observability SDK.

Set the environment variable `ENABLE_A365_OBSERVABILITY_EXPORTER` to `false`. This setting exports spans (traces) to the console.

To investigate export failures, set environment variables in `.env` or shell:

```bash
# Enable the Agent365 exporter
ENABLE_A365_OBSERVABILITY_EXPORTER=true

# Enable verbose logging
A365_OBSERVABILITY_LOG_LEVEL=info|warn|error
```

Review console output for messages like:

```text
[INFO]  [Agent365Exporter] Exporting 245 spans
[INFO]  [Agent365Exporter] Partitioned into 3 identity groups (2 spans skipped)
[INFO]  [Agent365Exporter] Token resolved successfully via tokenResolver
[EVENT] export-group succeeded in 98ms {"tenantId":"...","agentId":"...","correlationId":"abc-123"}
[ERROR] [Agent365Exporter] Failed with status 401, correlation ID: abc-123
[WARN]  export-partition-span-missing-identity: 5 spans skipped due to missing tenant or agent ID
```

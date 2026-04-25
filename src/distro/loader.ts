// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * ESM loader entry point for Microsoft OpenTelemetry distro.
 *
 * For ESM applications, this loader should be preloaded with the --import flag
 * so OpenTelemetry import hooks are registered before application modules load.
 *
 * Usage: node --import @microsoft/opentelemetry/loader <your-app-entry-point>
 */

import * as nodeModule from "node:module";
import { Logger } from "../shared/logging/index.js";
import { getModuleParentURL } from "../shared/module.js";

const OTEL_LOADER_SPECIFIER = "@opentelemetry/instrumentation/hook.mjs";

const registerFn = (nodeModule as { register?: (specifier: string, parentURL?: string) => void })
  .register;

if (typeof registerFn === "function") {
  const parentURL = getModuleParentURL();
  if (parentURL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = registerFn(OTEL_LOADER_SPECIFIER, parentURL) as any;

      if (result && typeof result.catch === "function") {
        void result.catch((error: unknown) => {
          Logger.getInstance().warn(
            "Failed to register OpenTelemetry instrumentation loader",
            error,
          );
        });
      }
    } catch (error) {
      Logger.getInstance().warn("Failed to register OpenTelemetry instrumentation loader", error);
    }
  }
}

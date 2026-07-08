import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { i as __toESM, t as __commonJSMin } from "../../_runtime.mjs";
//#endregion
//#region ../../node_modules/.pnpm/@workflow+utils@5.0.0-beta.5/node_modules/@workflow/utils/dist/time.js
var import_ms = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
})))(), 1);
/**
* Parses a duration parameter (string, number, or Date) and returns a Date object
* representing when the duration should elapse.
*
* - For strings: Parses duration strings like "1s", "5m", "1h", etc. using the `ms` library
* - For numbers: Treats as milliseconds from now
* - For Date objects: Returns the date directly (handles both Date instances and date-like objects from deserialization)
*
* @param param - The duration parameter (StringValue, Date, or number of milliseconds)
* @returns A Date object representing when the duration should elapse
* @throws {Error} If the parameter is invalid or cannot be parsed
*/
function parseDurationToDate(param) {
	if (typeof param === "string") {
		const durationMs = (0, import_ms.default)(param);
		if (typeof durationMs !== "number" || durationMs < 0) throw new Error(`Invalid duration: "${param}". Expected a valid duration string like "1s", "1m", "1h", etc.`);
		return new Date(Date.now() + durationMs);
	} else if (typeof param === "number") {
		if (param < 0 || !Number.isFinite(param)) throw new Error(`Invalid duration: ${param}. Expected a non-negative finite number of milliseconds.`);
		return new Date(Date.now() + param);
	} else if (param instanceof Date || param && typeof param === "object" && typeof param.getTime === "function") return param instanceof Date ? param : new Date(param.getTime());
	else throw new Error(`Invalid duration parameter. Expected a duration string, number (milliseconds), or Date object.`);
}
//#endregion
//#region ../../node_modules/.pnpm/@workflow+errors@5.0.0-beta.9/node_modules/@workflow/errors/dist/index.js
const BASE_URL = "https://workflow-sdk.dev/err";
/**
* @internal
* Check if a value is an Error without relying on Node.js utilities.
* This is needed for error classes that can be used in VM contexts where
* Node.js imports are not available.
*/
function isError(value) {
	return typeof value === "object" && value !== null && "name" in value && "message" in value;
}
/**
* @internal
* Compose a framed-detail body for an error message — same `╰▶` /
* `├▶` box-drawing structure used by `ContextViolationError` (in
* `@workflow/core`), so every error class with a hint or docs slug
* renders consistently:
*
*     <title>
*     ├▶ hint: <hint>
*     ╰▶ docs: https://workflow-sdk.dev/err/<slug>
*
* Plain text only — no ANSI here, since `@workflow/errors`'s main entry
* stays chalk-free. The runtime logger renders the same chars with
* dim styling at log time.
*
* Returns just `title` when there are no details to frame. Multi-line
* detail values are indented under their branch so the tree stays
* readable.
*/
function appendFramedDetails(title, details) {
	if (details.length === 0) return title;
	const lines = [title];
	details.forEach((detail, index) => {
		const isLast = index === details.length - 1;
		const head = isLast ? "╰▶ " : "├▶ ";
		const cont = isLast ? "   " : "│  ";
		`${detail.label}: ${detail.value}`.split("\n").forEach((line, i) => lines.push(`${i === 0 ? head : cont}${line}`));
	});
	return lines.join("\n");
}
function buildFramedDetails(hint, slug) {
	const out = [];
	if (hint) out.push({
		label: "hint",
		value: hint
	});
	if (slug) out.push({
		label: "docs",
		value: `${BASE_URL}/${slug}`
	});
	return out;
}
/**
* @internal
* All the slugs of the errors used for documentation links.
*/
const ERROR_SLUGS = {
	NODE_JS_MODULE_IN_WORKFLOW: "node-js-module-in-workflow",
	START_INVALID_WORKFLOW_FUNCTION: "start-invalid-workflow-function",
	SERIALIZATION_FAILED: "serialization-failed",
	WEBHOOK_INVALID_RESPOND_WITH_VALUE: "webhook-invalid-respond-with-value",
	WEBHOOK_RESPONSE_NOT_SENT: "webhook-response-not-sent",
	FETCH_IN_WORKFLOW_FUNCTION: "fetch-in-workflow",
	TIMEOUT_FUNCTIONS_IN_WORKFLOW: "timeout-in-workflow",
	HOOK_CONFLICT: "hook-conflict",
	CORRUPTED_EVENT_LOG: "corrupted-event-log",
	REPLAY_DIVERGENCE: "replay-divergence",
	STEP_NOT_REGISTERED: "step-not-registered",
	WORKFLOW_NOT_REGISTERED: "workflow-not-registered",
	RUNTIME_DECRYPTION_FAILED: "runtime-decryption-failed"
};
/**
* The base class for all Workflow-related errors.
*
* This error is thrown by the Workflow SDK when internal operations fail.
* You can use this class with `instanceof` to catch any Workflow SDK error.
*
* @example
* ```ts
* try {
*   await getRun(runId);
* } catch (error) {
*   if (error instanceof WorkflowError) {
*     console.error('Workflow SDK error:', error.message);
*   }
* }
* ```
*/
var WorkflowError = class extends Error {
	cause;
	constructor(message, options) {
		const msgDocs = appendFramedDetails(message, buildFramedDetails(void 0, options?.slug));
		super(msgDocs, { cause: options?.cause });
		if (options?.cause !== void 0) this.cause = options.cause;
		if (options?.cause instanceof Error) this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
	}
	static is(value) {
		return isError(value) && value.name === "WorkflowError";
	}
};
/**
* Thrown when a world (storage backend) operation fails unexpectedly.
*
* This is the catch-all error for world implementations. Specific,
* well-known failure modes have dedicated error types (e.g.
* EntityConflictError, RunExpiredError, ThrottleError). This error
* covers everything else — validation failures, missing entities
* without a dedicated type, or unexpected HTTP errors from world-vercel.
*/
var WorkflowWorldError = class extends WorkflowError {
	status;
	code;
	url;
	/** Retry-After value in seconds, present on 429 and 425 responses */
	retryAfter;
	constructor(message, options) {
		super(message, { cause: options?.cause });
		this.name = "WorkflowWorldError";
		this.status = options?.status;
		this.code = options?.code;
		this.url = options?.url;
		this.retryAfter = options?.retryAfter;
	}
	static is(value) {
		return isError(value) && value.name === "WorkflowWorldError";
	}
};
/**
* Thrown when the Workflow runtime encounters an internal error.
*
* This error indicates an issue with workflow execution, such as
* serialization failures, starting an invalid workflow function, or
* other runtime problems.
*/
var WorkflowRuntimeError = class extends WorkflowError {
	constructor(message, options) {
		super(message, { ...options });
		this.name = "WorkflowRuntimeError";
	}
	static is(value) {
		return isError(value) && value.name === "WorkflowRuntimeError";
	}
};
/**
* Thrown when the SDK's built-in AES-GCM encryption layer fails to encrypt
* or decrypt a workflow payload.
*
* This is an internal SDK failure — user code never invokes the SDK's
* encryption primitives directly. Common causes:
*
* - A ciphertext / auth tag mismatch, typically surfaced as the native Web
*   Crypto `OperationError: The operation failed for an operation-specific
*   reason`. Usually caused by ciphertext mutation or truncation in transit
*   between storage and read (truncated HTTP response, edge-cache miss
*   returning a partial 200, proxy drop during streaming, etc.).
* - A key resolution mismatch (wrong deployment, missing key material).
* - A malformed encrypted envelope (too short to contain the GCM nonce
*   and tag).
*
* Extends {@link WorkflowRuntimeError} so the run-failure classifier
* routes it to `RUNTIME_ERROR`.
*/
var RuntimeDecryptionError = class extends WorkflowRuntimeError {
	constructor(message, options) {
		super(message, {
			cause: options?.cause,
			slug: ERROR_SLUGS.RUNTIME_DECRYPTION_FAILED
		});
		this.name = "RuntimeDecryptionError";
		if (options?.context !== void 0) this.context = options.context;
	}
	static is(value) {
		return isError(value) && value.name === "RuntimeDecryptionError";
	}
};
/**
* Thrown when performing operations on a workflow run that does not exist.
*
* This error occurs when you call methods on a run object (e.g. `run.status`,
* `run.cancel()`, `run.returnValue`) but the underlying run ID does not match
* any known workflow run. Note that `getRun(id)` itself is synchronous and will
* not throw — this error is raised when subsequent operations discover the run
* is missing.
*
* Use the static `WorkflowRunNotFoundError.is()` method for type-safe checking
* in catch blocks.
*
* @example
* ```ts
* import { WorkflowRunNotFoundError } from "workflow/internal/errors";
*
* try {
*   const status = await run.status;
* } catch (error) {
*   if (WorkflowRunNotFoundError.is(error)) {
*     console.error(`Run ${error.runId} does not exist`);
*   }
* }
* ```
*/
var WorkflowRunNotFoundError = class extends WorkflowError {
	runId;
	constructor(runId) {
		super(`Workflow run "${runId}" not found`, {});
		this.name = "WorkflowRunNotFoundError";
		this.runId = runId;
	}
	static is(value) {
		return isError(value) && value.name === "WorkflowRunNotFoundError";
	}
};
/**
* Thrown when a hook token is already in use by another active workflow run.
*
* This is a user error — it means the same custom token was passed to
* `createHook` in two or more concurrent runs. Use a unique token per run
* (or omit the token to let the runtime generate one automatically).
*/
var HookConflictError = class extends WorkflowError {
	token;
	conflictingRunId;
	constructor(token, conflictingRunId) {
		super(`Hook token "${token}" is already in use by another workflow${conflictingRunId ? ` (run "${conflictingRunId}")` : ""}`, { slug: ERROR_SLUGS.HOOK_CONFLICT });
		this.name = "HookConflictError";
		this.token = token;
		if (conflictingRunId !== void 0) this.conflictingRunId = conflictingRunId;
	}
	static is(value) {
		return isError(value) && value.name === "HookConflictError";
	}
};
/**
* Thrown when calling `resumeHook()` or `resumeWebhook()` with a token that
* does not match any active hook.
*
* Common causes:
* - The hook has expired (past its TTL)
* - The hook was already disposed after being consumed
* - The workflow has not started yet, so the hook does not exist
*
* A common pattern is to catch this error and start a new workflow run when
* the hook does not exist yet (the "resume or start" pattern).
*
* Use the static `HookNotFoundError.is()` method for type-safe checking in
* catch blocks.
*
* @example
* ```ts
* import { HookNotFoundError } from "workflow/internal/errors";
*
* try {
*   await resumeHook(token, payload);
* } catch (error) {
*   if (HookNotFoundError.is(error)) {
*     // Hook doesn't exist — start a new workflow run instead
*     await startWorkflow("myWorkflow", payload);
*   }
* }
* ```
*/
var HookNotFoundError = class extends WorkflowError {
	token;
	constructor(token) {
		super("Hook not found", {});
		this.name = "HookNotFoundError";
		this.token = token;
	}
	static is(value) {
		return isError(value) && value.name === "HookNotFoundError";
	}
};
/**
* Thrown when an operation conflicts with the current state of an entity.
* This includes attempts to modify an entity already in a terminal state,
* create an entity that already exists, or any other 409-style conflict.
*
* The workflow runtime handles this error automatically. Users interacting
* with world storage backends directly may encounter it.
*/
var EntityConflictError = class extends WorkflowWorldError {
	constructor(message) {
		super(message);
		this.name = "EntityConflictError";
	}
	static is(value) {
		return isError(value) && value.name === "EntityConflictError";
	}
};
/**
* Thrown when a run is no longer available — either because it has been
* cleaned up, expired, or already reached a terminal state (completed/failed).
*
* The workflow runtime handles this error automatically. Users interacting
* with world storage backends directly may encounter it.
*/
var RunExpiredError = class extends WorkflowWorldError {
	constructor(message) {
		super(message);
		this.name = "RunExpiredError";
	}
	static is(value) {
		return isError(value) && value.name === "RunExpiredError";
	}
};
/**
* Thrown when an operation cannot proceed because a required timestamp
* (e.g. retryAfter) has not been reached yet.
*
* The workflow runtime handles this error automatically. Users interacting
* with world storage backends directly may encounter it.
*
* @property retryAfter - Delay in seconds before the operation can be retried.
*/
var TooEarlyError = class extends WorkflowWorldError {
	constructor(message, options) {
		super(message, { retryAfter: options?.retryAfter });
		this.name = "TooEarlyError";
	}
	static is(value) {
		return isError(value) && value.name === "TooEarlyError";
	}
};
/**
* Thrown when attempting to operate on a workflow run that requires a newer World version.
*
* This error occurs when a run was created with a newer spec version than the
* current World implementation supports. To resolve this, upgrade your
* `workflow` packages to a version that supports the required spec version.
*
* Use the static `RunNotSupportedError.is()` method for type-safe checking in
* catch blocks.
*
* @example
* ```ts
* import { RunNotSupportedError } from "workflow/internal/errors";
*
* try {
*   const status = await run.status;
* } catch (error) {
*   if (RunNotSupportedError.is(error)) {
*     console.error(
*       `Run requires spec v${error.runSpecVersion}, ` +
*       `but world supports v${error.worldSpecVersion}`
*     );
*   }
* }
* ```
*/
var RunNotSupportedError = class extends WorkflowError {
	runSpecVersion;
	worldSpecVersion;
	constructor(runSpecVersion, worldSpecVersion) {
		super(`Run requires spec version ${runSpecVersion}, but world supports version ${worldSpecVersion}. Please upgrade 'workflow' package.`);
		this.name = "RunNotSupportedError";
		this.runSpecVersion = runSpecVersion;
		this.worldSpecVersion = worldSpecVersion;
	}
	static is(value) {
		return isError(value) && value.name === "RunNotSupportedError";
	}
};
/**
* A fatal error is an error that cannot be retried.
* It will cause the step to fail and the error will
* be bubbled up to the workflow logic.
*
* Any error can opt into the non-retry behavior by setting a `fatal: true`
* own property. This is how structured error classes that aren't direct
* `FatalError` subclasses (e.g. context-violation errors) signal to the
* step handler that retrying will never help — the user's code is calling
* a workflow-only API from the wrong context, or similar — and burning
* retry attempts just produces a wall of duplicated log output.
*/
var FatalError = class extends Error {
	fatal = true;
	constructor(message) {
		super(message);
		this.name = "FatalError";
	}
	static is(value) {
		if (!isError(value)) return false;
		if (value.name === "FatalError") return true;
		return value.fatal === true;
	}
};
/**
* An error that can happen during a step execution, allowing
* for configuration of the retry behavior.
*/
var RetryableError = class extends Error {
	/**
	* The Date when the step should be retried.
	*/
	retryAfter;
	constructor(message, options = {}) {
		super(message);
		this.name = "RetryableError";
		if (options.retryAfter !== void 0) this.retryAfter = parseDurationToDate(options.retryAfter);
		else this.retryAfter = new Date(Date.now() + 1e3);
	}
	static is(value) {
		return isError(value) && value.name === "RetryableError";
	}
};
const FATAL_ERROR_KEY = Symbol.for("@workflow/errors//FatalError");
const RETRYABLE_ERROR_KEY = Symbol.for("@workflow/errors//RetryableError");
const HOOK_CONFLICT_ERROR_KEY = Symbol.for("@workflow/errors//HookConflictError");
const RUNTIME_DECRYPTION_ERROR_KEY = Symbol.for("@workflow/errors//RuntimeDecryptionError");
if (typeof globalThis !== "undefined") {
	if (!Object.hasOwn(globalThis, FATAL_ERROR_KEY)) Object.defineProperty(globalThis, FATAL_ERROR_KEY, {
		value: FatalError,
		writable: false,
		enumerable: false,
		configurable: false
	});
	if (!Object.hasOwn(globalThis, RETRYABLE_ERROR_KEY)) Object.defineProperty(globalThis, RETRYABLE_ERROR_KEY, {
		value: RetryableError,
		writable: false,
		enumerable: false,
		configurable: false
	});
	if (!Object.hasOwn(globalThis, HOOK_CONFLICT_ERROR_KEY)) Object.defineProperty(globalThis, HOOK_CONFLICT_ERROR_KEY, {
		value: HookConflictError,
		writable: false,
		enumerable: false,
		configurable: false
	});
	if (!Object.hasOwn(globalThis, RUNTIME_DECRYPTION_ERROR_KEY)) Object.defineProperty(globalThis, RUNTIME_DECRYPTION_ERROR_KEY, {
		value: RuntimeDecryptionError,
		writable: false,
		enumerable: false,
		configurable: false
	});
}
//#endregion
export { TooEarlyError as a, RunNotSupportedError as i, HookNotFoundError as n, WorkflowRunNotFoundError as o, RunExpiredError as r, WorkflowWorldError as s, EntityConflictError as t };

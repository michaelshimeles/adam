import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { $ as string, A as resolve, B as _instanceof, C as isFullMediaType, D as lazySchema, F as validateTypes, G as discriminatedUnion, H as array$1, I as withUserAgentSuffix, J as never, K as lazy, L as zodSchema, M as safeParseJSON, N as safeValidateTypes, Q as strictObject, S as isExecutableTool, T as isUrlSupported, U as boolean, V as _null, W as custom, X as object$1, Y as number, Z as record, _ as fetchWithValidatedRedirects, b as isAbortError, c as DownloadError, ct as TypeValidationError, d as cancelResponseBody, et as union, f as convertBase64ToUint8Array, g as executeTool, h as detectMediaType, i as gateway, it as APICallError, j as retryWithExponentialBackoff, k as readResponseWithSizeLimit, l as asArray, lt as UnsupportedFunctionalityError, m as createIdGenerator, n as GatewayError, ot as InvalidPromptError, p as convertUint8ArrayToBase64, q as literal, rt as AISDKError, s as DelayedPromise, t as GatewayAuthenticationError, tt as unknown, u as asSchema, ut as getErrorMessage, v as filterNullable, w as isProviderReference, x as isBuffer, y as getRuntimeEnvironmentUserAgent, z as _enum } from "./@ai-sdk/gateway+[...].mjs";
//#region ../../node_modules/.pnpm/ai@7.0.17_zod@4.4.3/node_modules/ai/dist/index.js
var __defProp = Object.defineProperty;
var __export = (target, all) => {
	for (var name22 in all) __defProp(target, name22, {
		get: all[name22],
		enumerable: true
	});
};
var name = "AI_InvalidArgumentError";
var marker = `vercel.ai.error.${name}`;
var symbol = Symbol.for(marker);
var _a;
var InvalidArgumentError = class extends AISDKError {
	constructor({ parameter, value, message }) {
		super({
			name,
			message: `Invalid argument for parameter ${parameter}: ${message}`
		});
		this[_a] = true;
		this.parameter = parameter;
		this.value = value;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker);
	}
};
_a = symbol;
var name3 = "AI_InvalidToolApprovalError";
var marker3 = `vercel.ai.error.${name3}`;
var symbol3 = Symbol.for(marker3);
var _a3;
var InvalidToolApprovalError = class extends AISDKError {
	constructor({ approvalId }) {
		super({
			name: name3,
			message: `Tool approval response references unknown approvalId: "${approvalId}". No matching tool-approval-request found in message history.`
		});
		this[_a3] = true;
		this.approvalId = approvalId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker3);
	}
};
_a3 = symbol3;
var name4 = "AI_InvalidToolApprovalSignatureError";
var marker4 = `vercel.ai.error.${name4}`;
var symbol4 = Symbol.for(marker4);
var _a4;
var InvalidToolApprovalSignatureError = class extends AISDKError {
	constructor({ approvalId, toolCallId, reason }) {
		super({
			name: name4,
			message: `Tool approval signature verification failed for approval "${approvalId}" (tool call "${toolCallId}"): ${reason}`
		});
		this[_a4] = true;
		this.approvalId = approvalId;
		this.toolCallId = toolCallId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker4);
	}
};
_a4 = symbol4;
var name5 = "AI_InvalidToolInputError";
var marker5 = `vercel.ai.error.${name5}`;
var symbol5 = Symbol.for(marker5);
var _a5;
var InvalidToolInputError = class extends AISDKError {
	constructor({ toolInput, toolName, cause, message = `Invalid input for tool ${toolName}: ${getErrorMessage(cause)}` }) {
		super({
			name: name5,
			message,
			cause
		});
		this[_a5] = true;
		this.toolInput = toolInput;
		this.toolName = toolName;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker5);
	}
};
_a5 = symbol5;
var name6 = "AI_ToolCallNotFoundForApprovalError";
var marker6 = `vercel.ai.error.${name6}`;
var symbol6 = Symbol.for(marker6);
var _a6;
var ToolCallNotFoundForApprovalError = class extends AISDKError {
	constructor({ toolCallId, approvalId }) {
		super({
			name: name6,
			message: `Tool call "${toolCallId}" not found for approval request "${approvalId}".`
		});
		this[_a6] = true;
		this.toolCallId = toolCallId;
		this.approvalId = approvalId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker6);
	}
};
_a6 = symbol6;
var name7 = "AI_MissingToolResultsError";
var marker7 = `vercel.ai.error.${name7}`;
var symbol7 = Symbol.for(marker7);
var _a7;
var MissingToolResultsError = class extends AISDKError {
	constructor({ toolCallIds }) {
		super({
			name: name7,
			message: `Tool result${toolCallIds.length > 1 ? "s are" : " is"} missing for tool call${toolCallIds.length > 1 ? "s" : ""} ${toolCallIds.join(", ")}.`
		});
		this[_a7] = true;
		this.toolCallIds = toolCallIds;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker7);
	}
};
_a7 = symbol7;
var name9 = "AI_NoObjectGeneratedError";
var marker9 = `vercel.ai.error.${name9}`;
var symbol9 = Symbol.for(marker9);
var _a9;
var NoObjectGeneratedError = class extends AISDKError {
	constructor({ message = "No object generated.", cause, text: text2, response, usage, finishReason }) {
		super({
			name: name9,
			message,
			cause
		});
		this[_a9] = true;
		this.text = text2;
		this.response = response;
		this.usage = usage;
		this.finishReason = finishReason;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker9);
	}
};
_a9 = symbol9;
var name10 = "AI_NoOutputGeneratedError";
var marker10 = `vercel.ai.error.${name10}`;
var symbol10 = Symbol.for(marker10);
var _a10;
var NoOutputGeneratedError = class extends AISDKError {
	constructor({ message = "No output generated.", cause } = {}) {
		super({
			name: name10,
			message,
			cause
		});
		this[_a10] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker10);
	}
};
_a10 = symbol10;
var name14 = "AI_NoSuchToolError";
var marker14 = `vercel.ai.error.${name14}`;
var symbol14 = Symbol.for(marker14);
var _a14;
var NoSuchToolError = class extends AISDKError {
	constructor({ toolName, availableTools = void 0, message = `Model tried to call unavailable tool '${toolName}'. ${availableTools === void 0 ? "No tools are available." : `Available tools: ${availableTools.join(", ")}.`}` }) {
		super({
			name: name14,
			message
		});
		this[_a14] = true;
		this.toolName = toolName;
		this.availableTools = availableTools;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker14);
	}
};
_a14 = symbol14;
var name15 = "AI_ToolCallRepairError";
var marker15 = `vercel.ai.error.${name15}`;
var symbol15 = Symbol.for(marker15);
var _a15;
var ToolCallRepairError = class extends AISDKError {
	constructor({ cause, originalError, message = `Error repairing tool call: ${getErrorMessage(cause)}` }) {
		super({
			name: name15,
			message,
			cause
		});
		this[_a15] = true;
		this.originalError = originalError;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker15);
	}
};
_a15 = symbol15;
var UnsupportedModelVersionError = class extends AISDKError {
	constructor(options) {
		super({
			name: "AI_UnsupportedModelVersionError",
			message: `Unsupported model version ${options.version} for provider "${options.provider}" and model "${options.modelId}". AI SDK 5 only supports models that implement specification version "v2".`
		});
		this.version = options.version;
		this.provider = options.provider;
		this.modelId = options.modelId;
	}
};
var name16 = "AI_UIMessageStreamError";
var marker16 = `vercel.ai.error.${name16}`;
var symbol16 = Symbol.for(marker16);
var _a16;
var UIMessageStreamError = class extends AISDKError {
	constructor({ chunkType, chunkId, message }) {
		super({
			name: name16,
			message
		});
		this[_a16] = true;
		this.chunkType = chunkType;
		this.chunkId = chunkId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker16);
	}
};
_a16 = symbol16;
var name17 = "AI_InvalidDataContentError";
var marker17 = `vercel.ai.error.${name17}`;
var symbol17 = Symbol.for(marker17);
var _a17;
var InvalidDataContentError = class extends AISDKError {
	constructor({ content, cause, message = `Invalid data content. Expected a base64 string, Uint8Array, ArrayBuffer, or Buffer, but got ${typeof content}.` }) {
		super({
			name: name17,
			message,
			cause
		});
		this[_a17] = true;
		this.content = content;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker17);
	}
};
_a17 = symbol17;
var name18 = "AI_InvalidMessageRoleError";
var marker18 = `vercel.ai.error.${name18}`;
var symbol18 = Symbol.for(marker18);
var _a18;
var InvalidMessageRoleError = class extends AISDKError {
	constructor({ role, message = `Invalid message role: '${role}'. Must be one of: "system", "user", "assistant", "tool".` }) {
		super({
			name: name18,
			message
		});
		this[_a18] = true;
		this.role = role;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker18);
	}
};
_a18 = symbol18;
var name20 = "AI_RetryError";
var marker20 = `vercel.ai.error.${name20}`;
var symbol20 = Symbol.for(marker20);
var _a20;
var RetryError = class extends AISDKError {
	constructor({ message, reason, errors }) {
		super({
			name: name20,
			message
		});
		this[_a20] = true;
		this.reason = reason;
		this.errors = errors;
		this.lastError = errors[errors.length - 1];
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker20);
	}
};
_a20 = symbol20;
function formatWarning({ warning, provider, model }) {
	const prefix = `AI SDK Warning${provider != null && model != null ? ` (${provider} / ${model})` : ""}:`;
	switch (warning.type) {
		case "unsupported": {
			let message = `${prefix} The feature "${warning.feature}" is not supported.`;
			if (warning.details) message += ` ${warning.details}`;
			return message;
		}
		case "compatibility": {
			let message = `${prefix} The feature "${warning.feature}" is used in a compatibility mode.`;
			if (warning.details) message += ` ${warning.details}`;
			return message;
		}
		case "deprecated": return `${prefix} Deprecated: "${warning.setting}". ${warning.message}`;
		case "other": return `${prefix} ${warning.message}`;
		default: return `${prefix} ${JSON.stringify(warning, null, 2)}`;
	}
}
var FIRST_WARNING_INFO_MESSAGE = "AI SDK Warning System: To turn off warning logging, set the AI_SDK_LOG_WARNINGS global to false.";
var hasLoggedBefore = false;
var logWarnings = (options) => {
	if (options.warnings.length === 0) return;
	const logger = globalThis.AI_SDK_LOG_WARNINGS;
	if (logger === false) return;
	if (typeof logger === "function") {
		logger(options);
		return;
	}
	if (!hasLoggedBefore) {
		hasLoggedBefore = true;
		console.info(FIRST_WARNING_INFO_MESSAGE);
	}
	for (const warning of options.warnings) {
		const message = formatWarning({
			warning,
			provider: options.provider,
			model: options.model
		});
		if (typeof process !== "undefined" && typeof process.emitWarning === "function") process.emitWarning(message, { type: warning.type === "deprecated" ? "DeprecationWarning" : "Warning" });
		else console.warn(message);
	}
};
function logV2CompatibilityWarning({ provider, modelId }) {
	logWarnings({
		warnings: [{
			type: "compatibility",
			feature: "specificationVersion",
			details: `Using v2 specification compatibility mode. Some features may not be available.`
		}],
		provider,
		model: modelId
	});
}
function asEmbeddingModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v3";
		return target[prop];
	} });
}
function asEmbeddingModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asEmbeddingModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asImageModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v3";
		return target[prop];
	} });
}
function asImageModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asImageModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asLanguageModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		switch (prop) {
			case "specificationVersion": return "v3";
			case "doGenerate": return async (...args) => {
				const result = await target.doGenerate(...args);
				return {
					...result,
					finishReason: convertV2FinishReasonToV3(result.finishReason),
					usage: convertV2UsageToV3(result.usage)
				};
			};
			case "doStream": return async (...args) => {
				const result = await target.doStream(...args);
				return {
					...result,
					stream: convertV2StreamToV3(result.stream)
				};
			};
			default: return target[prop];
		}
	} });
}
function convertV2StreamToV3(stream) {
	return stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		switch (chunk.type) {
			case "finish":
				controller.enqueue({
					...chunk,
					finishReason: convertV2FinishReasonToV3(chunk.finishReason),
					usage: convertV2UsageToV3(chunk.usage)
				});
				break;
			default:
				controller.enqueue(chunk);
				break;
		}
	} }));
}
function convertV2FinishReasonToV3(finishReason) {
	return {
		unified: finishReason === "unknown" ? "other" : finishReason,
		raw: void 0
	};
}
function convertV2UsageToV3(usage) {
	return {
		inputTokens: {
			total: usage.inputTokens,
			noCache: void 0,
			cacheRead: usage.cachedInputTokens,
			cacheWrite: void 0
		},
		outputTokens: {
			total: usage.outputTokens,
			text: void 0,
			reasoning: usage.reasoningTokens
		}
	};
}
function asLanguageModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asLanguageModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asRerankingModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asSpeechModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v3";
		return target[prop];
	} });
}
function asSpeechModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asSpeechModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asTranscriptionModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v3";
		return target[prop];
	} });
}
function asTranscriptionModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asTranscriptionModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asProviderV3(provider) {
	if ("specificationVersion" in provider && provider.specificationVersion === "v3") return provider;
	const v2Provider = provider;
	return {
		specificationVersion: "v3",
		languageModel: (modelId) => asLanguageModelV3(v2Provider.languageModel(modelId)),
		embeddingModel: (modelId) => asEmbeddingModelV3(v2Provider.textEmbeddingModel(modelId)),
		imageModel: (modelId) => asImageModelV3(v2Provider.imageModel(modelId)),
		transcriptionModel: v2Provider.transcriptionModel ? (modelId) => asTranscriptionModelV3(v2Provider.transcriptionModel(modelId)) : void 0,
		speechModel: v2Provider.speechModel ? (modelId) => asSpeechModelV3(v2Provider.speechModel(modelId)) : void 0,
		rerankingModel: void 0
	};
}
function asProviderV4(provider) {
	if ("specificationVersion" in provider && provider.specificationVersion === "v4") return provider;
	const v3Provider = !("specificationVersion" in provider) || provider.specificationVersion !== "v3" ? asProviderV3(provider) : provider;
	return {
		specificationVersion: "v4",
		languageModel: (modelId) => asLanguageModelV4(v3Provider.languageModel(modelId)),
		embeddingModel: (modelId) => asEmbeddingModelV4(v3Provider.embeddingModel(modelId)),
		imageModel: (modelId) => asImageModelV4(v3Provider.imageModel(modelId)),
		transcriptionModel: v3Provider.transcriptionModel ? (modelId) => asTranscriptionModelV4(v3Provider.transcriptionModel(modelId)) : void 0,
		speechModel: v3Provider.speechModel ? (modelId) => asSpeechModelV4(v3Provider.speechModel(modelId)) : void 0,
		rerankingModel: v3Provider.rerankingModel ? (modelId) => asRerankingModelV4(v3Provider.rerankingModel(modelId)) : void 0
	};
}
function resolveLanguageModel(model) {
	if (typeof model === "string") return getGlobalProvider().languageModel(model);
	if (![
		"v4",
		"v3",
		"v2"
	].includes(model.specificationVersion)) {
		const unsupportedModel = model;
		throw new UnsupportedModelVersionError({
			version: unsupportedModel.specificationVersion,
			provider: unsupportedModel.provider,
			modelId: unsupportedModel.modelId
		});
	}
	return asLanguageModelV4(model);
}
function getGlobalProvider() {
	var _a22;
	return asProviderV4((_a22 = globalThis.AI_SDK_DEFAULT_PROVIDER) != null ? _a22 : gateway);
}
function cloneModelMessages(messages) {
	return messages.map((message) => cloneValue(message));
}
function cloneValue(value) {
	if (value instanceof URL) return new URL(value.href);
	if (Array.isArray(value)) return value.map((item) => cloneValue(item));
	if (value instanceof Uint8Array) return new Uint8Array(value);
	if (value instanceof ArrayBuffer) return value.slice(0);
	if (value instanceof Date) return new Date(value);
	if (value != null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, value2]) => [key, cloneValue(value2)]));
	return value;
}
var VERSION = "7.0.17";
var download = async ({ url, maxBytes, abortSignal }) => {
	var _a22;
	const urlText = url.toString();
	try {
		const response = await fetchWithValidatedRedirects({
			url: urlText,
			headers: withUserAgentSuffix({}, `ai-sdk/${VERSION}`, getRuntimeEnvironmentUserAgent()),
			abortSignal
		});
		if (!response.ok) {
			await cancelResponseBody(response);
			throw new DownloadError({
				url: urlText,
				statusCode: response.status,
				statusText: response.statusText
			});
		}
		return {
			data: await readResponseWithSizeLimit({
				response,
				url: urlText,
				maxBytes: maxBytes != null ? maxBytes : 2147483648
			}),
			mediaType: (_a22 = response.headers.get("content-type")) != null ? _a22 : void 0
		};
	} catch (error) {
		if (DownloadError.isInstance(error)) throw error;
		throw new DownloadError({
			url: urlText,
			cause: error
		});
	}
};
var createDefaultDownloadFunction = (download2 = download) => (requestedDownloads) => Promise.all(requestedDownloads.map(async (requestedDownload) => requestedDownload.isUrlSupportedByModel ? null : await download2(requestedDownload)));
function splitDataUrl(dataUrl) {
	try {
		const [header, base64Content] = dataUrl.split(",");
		return {
			mediaType: header.split(";")[0].split(":")[1],
			base64Content
		};
	} catch (e) {
		return {
			mediaType: void 0,
			base64Content: void 0
		};
	}
}
function isTaggedFileData(value) {
	if (typeof value !== "object" || value === null) return false;
	const type = value.type;
	return type === "data" || type === "url" || type === "reference" || type === "text";
}
function convertUrlToFilePartData(url) {
	if (url.protocol === "data:") {
		const { mediaType, base64Content } = splitDataUrl(url.toString());
		if (mediaType == null || base64Content == null) throw new InvalidDataContentError({
			content: url,
			message: `Invalid data URL format in content ${url.toString()}`
		});
		return {
			data: {
				type: "data",
				data: base64Content
			},
			mediaType
		};
	}
	return {
		data: {
			type: "url",
			url
		},
		mediaType: void 0
	};
}
function convertInlineDataToFilePartData(content) {
	if (content instanceof Uint8Array) return {
		data: {
			type: "data",
			data: content
		},
		mediaType: void 0
	};
	if (content instanceof ArrayBuffer) return {
		data: {
			type: "data",
			data: new Uint8Array(content)
		},
		mediaType: void 0
	};
	if (isBuffer(content)) return {
		data: {
			type: "data",
			data: new Uint8Array(content)
		},
		mediaType: void 0
	};
	return {
		data: {
			type: "data",
			data: content
		},
		mediaType: void 0
	};
}
function convertToLanguageModelV4FilePart(content) {
	if (isTaggedFileData(content)) switch (content.type) {
		case "data":
			if (typeof content.data === "string" && content.data.startsWith("data:")) throw new InvalidDataContentError({
				content: content.data,
				message: "Data URLs are not valid inline data. Pass them as { type: \"url\", url } instead."
			});
			return convertInlineDataToFilePartData(content.data);
		case "url": return convertUrlToFilePartData(content.url);
		case "reference": return {
			data: {
				type: "reference",
				reference: content.reference
			},
			mediaType: void 0
		};
		case "text": return {
			data: {
				type: "text",
				text: content.text
			},
			mediaType: void 0
		};
	}
	if (content instanceof URL) return convertUrlToFilePartData(content);
	if (typeof content === "string") try {
		return convertUrlToFilePartData(new URL(content));
	} catch (e) {
		return convertInlineDataToFilePartData(content);
	}
	if (isProviderReference(content)) return {
		data: {
			type: "reference",
			reference: content
		},
		mediaType: void 0
	};
	return convertInlineDataToFilePartData(content);
}
async function convertToLanguageModelPrompt({ prompt, supportedUrls, download: download2 = createDefaultDownloadFunction(), provider }) {
	const downloadedAssets = await downloadAssets(prompt.messages, download2, supportedUrls);
	const approvalIdToToolCallId = /* @__PURE__ */ new Map();
	for (const message of prompt.messages) if (message.role === "assistant" && Array.isArray(message.content)) {
		for (const part of message.content) if (part.type === "tool-approval-request" && "approvalId" in part && "toolCallId" in part) approvalIdToToolCallId.set(part.approvalId, part.toolCallId);
	}
	const approvedToolCallIds = /* @__PURE__ */ new Set();
	for (const message of prompt.messages) if (message.role === "tool") {
		for (const part of message.content) if (part.type === "tool-approval-response") {
			const toolCallId = approvalIdToToolCallId.get(part.approvalId);
			if (toolCallId) approvedToolCallIds.add(toolCallId);
		}
	}
	const messages = [...prompt.instructions != null ? typeof prompt.instructions === "string" ? [{
		role: "system",
		content: prompt.instructions
	}] : asArray(prompt.instructions).map((message) => ({
		role: "system",
		content: message.content,
		providerOptions: message.providerOptions
	})) : [], ...prompt.messages.map((message) => convertToLanguageModelMessage({
		message,
		downloadedAssets,
		provider
	}))];
	const combinedMessages = [];
	for (const message of messages) {
		if (message.role !== "tool") {
			combinedMessages.push(message);
			continue;
		}
		const lastCombinedMessage = combinedMessages.at(-1);
		if ((lastCombinedMessage == null ? void 0 : lastCombinedMessage.role) === "tool") lastCombinedMessage.content.push(...message.content);
		else combinedMessages.push(message);
	}
	const toolCallIds = /* @__PURE__ */ new Set();
	for (const message of combinedMessages) switch (message.role) {
		case "assistant":
			for (const content of message.content) if (content.type === "tool-call" && !content.providerExecuted) toolCallIds.add(content.toolCallId);
			break;
		case "tool":
			for (const content of message.content) if (content.type === "tool-result") toolCallIds.delete(content.toolCallId);
			break;
		case "user":
		case "system":
			for (const id of approvedToolCallIds) toolCallIds.delete(id);
			if (toolCallIds.size > 0) throw new MissingToolResultsError({ toolCallIds: Array.from(toolCallIds) });
			break;
	}
	for (const id of approvedToolCallIds) toolCallIds.delete(id);
	if (toolCallIds.size > 0) throw new MissingToolResultsError({ toolCallIds: Array.from(toolCallIds) });
	return combinedMessages.filter((message) => message.role !== "tool" || message.content.length > 0);
}
function convertToLanguageModelMessage({ message, downloadedAssets, provider }) {
	const warnings = [];
	const role = message.role;
	switch (role) {
		case "system": return {
			role: "system",
			content: message.content,
			providerOptions: message.providerOptions
		};
		case "user": {
			if (typeof message.content === "string") return {
				role: "user",
				content: [{
					type: "text",
					text: message.content
				}],
				providerOptions: message.providerOptions
			};
			const converted = {
				role: "user",
				content: message.content.map((part) => {
					if (part.type === "image") warnings.push({
						type: "deprecated",
						setting: "\"image\" content part",
						message: `The "image" content part type is deprecated. Use a "file" part with mediaType: 'image' (or a more specific image/* subtype) instead.`
					});
					return convertImagePartToFilePart(part);
				}).map((part) => convertPartToLanguageModelPart(part, downloadedAssets)).filter((part) => part.type !== "text" || part.text !== ""),
				providerOptions: message.providerOptions
			};
			if (warnings.length > 0) logWarnings({ warnings });
			return converted;
		}
		case "assistant": {
			if (typeof message.content === "string") return {
				role: "assistant",
				content: [{
					type: "text",
					text: message.content
				}],
				providerOptions: message.providerOptions
			};
			const converted = {
				role: "assistant",
				content: message.content.filter((part) => part.type !== "text" || part.text !== "" || part.providerOptions != null).filter((part) => part.type !== "tool-approval-request").map((part) => {
					const providerOptions = part.providerOptions;
					switch (part.type) {
						case "custom": return {
							type: "custom",
							kind: part.kind,
							providerOptions
						};
						case "file": {
							const { data, mediaType } = convertToLanguageModelV4FilePart(part.data);
							return {
								type: "file",
								data,
								filename: part.filename,
								mediaType: mediaType != null ? mediaType : part.mediaType,
								providerOptions
							};
						}
						case "reasoning": return {
							type: "reasoning",
							text: part.text,
							providerOptions
						};
						case "reasoning-file": {
							const { data, mediaType } = convertToLanguageModelV4FilePart(part.data);
							if (data.type !== "data" && data.type !== "url") throw new Error(`Unsupported reasoning-file data type: ${data.type}`);
							return {
								type: "reasoning-file",
								data,
								mediaType: mediaType != null ? mediaType : part.mediaType,
								providerOptions
							};
						}
						case "text": return {
							type: "text",
							text: part.text,
							providerOptions
						};
						case "tool-call": return {
							type: "tool-call",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							input: part.input,
							providerExecuted: part.providerExecuted,
							providerOptions
						};
						case "tool-result": return {
							type: "tool-result",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							output: mapToolResultOutput({
								output: part.output,
								provider,
								warnings,
								downloadedAssets
							}),
							providerOptions
						};
					}
				}),
				providerOptions: message.providerOptions
			};
			if (warnings.length > 0) logWarnings({ warnings });
			return converted;
		}
		case "tool": {
			const converted = {
				role: "tool",
				content: message.content.filter((part) => part.type !== "tool-approval-response" || part.providerExecuted).map((part) => {
					switch (part.type) {
						case "tool-result": return {
							type: "tool-result",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							output: mapToolResultOutput({
								output: part.output,
								provider,
								warnings,
								downloadedAssets
							}),
							providerOptions: part.providerOptions
						};
						case "tool-approval-response": return {
							type: "tool-approval-response",
							approvalId: part.approvalId,
							approved: part.approved,
							reason: part.reason
						};
					}
				}),
				providerOptions: message.providerOptions
			};
			if (warnings.length > 0) logWarnings({ warnings });
			return converted;
		}
		default: throw new InvalidMessageRoleError({ role });
	}
}
function convertImagePartToFilePart(part) {
	var _a22;
	if (part.type !== "image") return part;
	return {
		type: "file",
		data: part.image,
		mediaType: (_a22 = part.mediaType) != null ? _a22 : "image",
		providerOptions: part.providerOptions
	};
}
async function downloadAssets(messages, download2, supportedUrls) {
	const downloadableFiles = [];
	for (const message of messages) {
		if (message.role === "user" && Array.isArray(message.content)) for (const part of message.content) {
			const filePart = convertImagePartToFilePart(part);
			if (filePart.type === "file") downloadableFiles.push(filePart);
		}
		if (message.role === "tool") for (const part of message.content) {
			if (part.type !== "tool-result") continue;
			if (part.output.type !== "content") continue;
			for (const contentPart of part.output.value) if (contentPart.type === "file") downloadableFiles.push(contentPart);
		}
		if (message.role === "assistant" && Array.isArray(message.content)) for (const part of message.content) {
			if (part.type !== "tool-result") continue;
			if (part.output.type !== "content") continue;
			for (const contentPart of part.output.value) if (contentPart.type === "file") downloadableFiles.push(contentPart);
		}
	}
	const plannedDownloads = downloadableFiles.map((part) => {
		const mediaType = part.mediaType;
		const { data } = convertToLanguageModelV4FilePart(part.data);
		return {
			mediaType,
			data
		};
	}).filter((part) => part.data.type === "url").map((part) => ({
		url: part.data.url,
		isUrlSupportedByModel: part.mediaType != null && isUrlSupported({
			url: part.data.url.toString(),
			mediaType: part.mediaType,
			supportedUrls
		})
	}));
	const downloadedFiles = await download2(plannedDownloads);
	return Object.fromEntries(downloadedFiles.map((file, index) => file == null ? null : [plannedDownloads[index].url.toString(), {
		data: file.data,
		mediaType: file.mediaType
	}]).filter((file) => file != null));
}
function convertPartToLanguageModelPart(part, downloadedAssets) {
	if (part.type === "text") return {
		type: "text",
		text: part.text,
		providerOptions: part.providerOptions
	};
	const { data: normalizedData, mediaType: dataUrlMediaType } = convertToLanguageModelV4FilePart(part.data);
	let mediaType = dataUrlMediaType != null ? dataUrlMediaType : part.mediaType;
	let data = normalizedData;
	if (data.type === "url") {
		const downloadedFile = downloadedAssets[data.url.toString()];
		if (downloadedFile) {
			data = {
				type: "data",
				data: downloadedFile.data
			};
			if (downloadedFile.mediaType != null && (mediaType == null || !isFullMediaType(mediaType))) mediaType = downloadedFile.mediaType;
		}
	}
	if (data.type === "data" && (data.data instanceof Uint8Array || typeof data.data === "string")) {
		const imageMediaType = detectMediaType({
			data: data.data,
			topLevelType: "image"
		});
		if (imageMediaType != null) mediaType = imageMediaType;
	}
	if (mediaType == null) throw new Error(`Media type is missing for file part`);
	return {
		type: "file",
		mediaType,
		filename: part.filename,
		data,
		providerOptions: part.providerOptions
	};
}
function mapToolResultOutput({ output, provider, warnings = [], downloadedAssets }) {
	if (output.type !== "content") return output;
	return {
		type: "content",
		value: output.value.map((item) => {
			var _a22;
			switch (item.type) {
				case "file": {
					const convertedPart = convertPartToLanguageModelPart(item, downloadedAssets);
					if (convertedPart.type !== "file") throw new Error("Expected tool result file content to convert to file.");
					return convertedPart;
				}
				case "file-data":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"file-data\"",
						message: `The "file-data" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'data', data } instead.`
					});
					return {
						type: "file",
						data: {
							type: "data",
							data: item.data
						},
						filename: item.filename,
						mediaType: item.mediaType,
						providerOptions: item.providerOptions
					};
				case "file-url": {
					const mediaType = (_a22 = item.mediaType) != null ? _a22 : getMediaTypeFromUrl(item.url);
					let message = `The "file-url" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'url', url } instead.`;
					if (!item.mediaType) {
						const inferenceSuffix = mediaType === "application/octet-stream" ? `Unable to infer media type from URL. Defaulting to 'application/octet-stream'.` : `Inferred media type '${mediaType}' from URL.`;
						message = `The "file-url" tool result content part with URL "${item.url}" is missing a "mediaType". ${inferenceSuffix} ${message}`;
					}
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"file-url\"",
						message
					});
					return {
						type: "file",
						data: {
							type: "url",
							url: new URL(item.url)
						},
						mediaType,
						providerOptions: item.providerOptions
					};
				}
				case "file-id":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"file-id\"",
						message: `The "file-id" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`
					});
					return {
						type: "file",
						data: {
							type: "reference",
							reference: convertFileIdToProviderReference({
								fileId: item.fileId,
								provider
							})
						},
						mediaType: "application",
						providerOptions: item.providerOptions
					};
				case "file-reference":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"file-reference\"",
						message: `The "file-reference" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`
					});
					return {
						type: "file",
						data: {
							type: "reference",
							reference: item.providerReference
						},
						mediaType: "application",
						providerOptions: item.providerOptions
					};
				case "image-data":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"image-data\"",
						message: `The "image-data" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'data', data } instead.`
					});
					return {
						type: "file",
						data: {
							type: "data",
							data: item.data
						},
						mediaType: item.mediaType,
						providerOptions: item.providerOptions
					};
				case "image-url":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"image-url\"",
						message: `The "image-url" type for tool result content is deprecated. Use the "file" type with mediaType 'image' (or a specific image/* subtype) and { type: 'url', url } instead.`
					});
					return {
						type: "file",
						data: {
							type: "url",
							url: new URL(item.url)
						},
						mediaType: "image",
						providerOptions: item.providerOptions
					};
				case "image-file-id":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"image-file-id\"",
						message: `The "image-file-id" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`
					});
					return {
						type: "file",
						data: {
							type: "reference",
							reference: convertFileIdToProviderReference({
								fileId: item.fileId,
								provider
							})
						},
						mediaType: "image",
						providerOptions: item.providerOptions
					};
				case "image-file-reference":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"image-file-reference\"",
						message: `The "image-file-reference" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`
					});
					return {
						type: "file",
						data: {
							type: "reference",
							reference: item.providerReference
						},
						mediaType: "image",
						providerOptions: item.providerOptions
					};
				default: return item;
			}
		})
	};
}
function convertFileIdToProviderReference({ fileId, provider }) {
	if (typeof fileId === "object") return fileId;
	if (provider == null) throw new Error("Cannot convert string fileId to provider reference without a provider ID. Use a Record<string, string> fileId or switch to the file-reference type.");
	return { [provider]: fileId };
}
var URL_EXTENSION_TO_MEDIA_TYPE = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	avif: "image/avif",
	heic: "image/heic",
	bmp: "image/bmp",
	tiff: "image/tiff",
	tif: "image/tiff",
	pdf: "application/pdf",
	mp4: "video/mp4",
	webm: "video/webm",
	mp3: "audio/mpeg",
	wav: "audio/wav",
	ogg: "audio/ogg"
};
function getMediaTypeFromUrl(url, fallbackMediaType = "application/octet-stream") {
	var _a22;
	try {
		const fileExtension = (_a22 = new URL(url).pathname.split(".").pop()) == null ? void 0 : _a22.toLowerCase();
		if (fileExtension && Object.hasOwn(URL_EXTENSION_TO_MEDIA_TYPE, fileExtension)) return URL_EXTENSION_TO_MEDIA_TYPE[fileExtension];
	} catch (e) {}
	return fallbackMediaType;
}
async function createToolModelOutput({ toolCallId, input, output, tool: tool2, errorMode }) {
	if (errorMode === "text") return {
		type: "error-text",
		value: getErrorMessage(output)
	};
	else if (errorMode === "json") return {
		type: "error-json",
		value: toJSONValue(output)
	};
	if (tool2 == null ? void 0 : tool2.toModelOutput) return await tool2.toModelOutput({
		toolCallId,
		input,
		output
	});
	return typeof output === "string" ? {
		type: "text",
		value: output
	} : {
		type: "json",
		value: toJSONValue(output)
	};
}
function toJSONValue(value) {
	return value === void 0 ? null : value;
}
function prepareLanguageModelCallOptions({ maxOutputTokens, temperature, topP, topK, presencePenalty, frequencyPenalty, seed, stopSequences, reasoning }) {
	if (maxOutputTokens != null) {
		if (!Number.isInteger(maxOutputTokens)) throw new InvalidArgumentError({
			parameter: "maxOutputTokens",
			value: maxOutputTokens,
			message: "maxOutputTokens must be an integer"
		});
		if (maxOutputTokens < 1) throw new InvalidArgumentError({
			parameter: "maxOutputTokens",
			value: maxOutputTokens,
			message: "maxOutputTokens must be >= 1"
		});
	}
	if (temperature != null) {
		if (typeof temperature !== "number") throw new InvalidArgumentError({
			parameter: "temperature",
			value: temperature,
			message: "temperature must be a number"
		});
	}
	if (topP != null) {
		if (typeof topP !== "number") throw new InvalidArgumentError({
			parameter: "topP",
			value: topP,
			message: "topP must be a number"
		});
	}
	if (topK != null) {
		if (typeof topK !== "number") throw new InvalidArgumentError({
			parameter: "topK",
			value: topK,
			message: "topK must be a number"
		});
	}
	if (presencePenalty != null) {
		if (typeof presencePenalty !== "number") throw new InvalidArgumentError({
			parameter: "presencePenalty",
			value: presencePenalty,
			message: "presencePenalty must be a number"
		});
	}
	if (frequencyPenalty != null) {
		if (typeof frequencyPenalty !== "number") throw new InvalidArgumentError({
			parameter: "frequencyPenalty",
			value: frequencyPenalty,
			message: "frequencyPenalty must be a number"
		});
	}
	if (seed != null) {
		if (!Number.isInteger(seed)) throw new InvalidArgumentError({
			parameter: "seed",
			value: seed,
			message: "seed must be an integer"
		});
	}
	return {
		maxOutputTokens,
		temperature,
		topP,
		topK,
		presencePenalty,
		frequencyPenalty,
		stopSequences,
		seed,
		reasoning
	};
}
function prepareToolChoice({ toolChoice }) {
	return toolChoice == null ? { type: "auto" } : typeof toolChoice === "string" ? { type: toolChoice } : {
		type: "tool",
		toolName: toolChoice.toolName
	};
}
function isNonEmptyObject(object2) {
	return object2 != null && Object.keys(object2).length > 0;
}
async function prepareTools({ tools, toolOrder, toolsContext = {}, experimental_sandbox: sandbox }) {
	if (!isNonEmptyObject(tools)) return;
	const languageModelTools = [];
	for (const [name22, tool2] of orderToolEntries({
		tools,
		toolOrder
	})) {
		const toolType = tool2.type;
		switch (toolType) {
			case void 0:
			case "dynamic":
			case "function": {
				const description = resolveToolDescription({
					tool: tool2,
					toolName: name22,
					toolsContext,
					experimental_sandbox: sandbox
				});
				const providerOptions = tool2.providerOptions;
				const inputExamples = tool2.inputExamples;
				const strict = tool2.strict;
				languageModelTools.push({
					type: "function",
					name: name22,
					inputSchema: await asSchema(tool2.inputSchema).jsonSchema,
					...description != null ? { description } : {},
					...inputExamples != null ? { inputExamples } : {},
					...providerOptions != null ? { providerOptions } : {},
					...strict != null ? { strict } : {}
				});
				break;
			}
			case "provider":
				languageModelTools.push({
					type: "provider",
					name: name22,
					id: tool2.id,
					args: tool2.args
				});
				break;
			default: throw new Error(`Unsupported tool type: ${toolType}`);
		}
	}
	return languageModelTools;
}
function orderToolEntries({ tools, toolOrder }) {
	if (toolOrder == null) return Object.entries(tools);
	const toolEntries = Object.entries(tools);
	const orderedTools = toolEntries.filter(([name22]) => toolOrder.includes(name22)).sort(([nameA], [nameB]) => toolOrder.indexOf(nameA) - toolOrder.indexOf(nameB));
	const unorderedTools = toolEntries.filter(([name22]) => !toolOrder.includes(name22)).sort(([nameA], [nameB]) => nameA < nameB ? -1 : nameA > nameB ? 1 : 0);
	return [...orderedTools, ...unorderedTools];
}
function resolveToolDescription({ tool: tool2, toolName, toolsContext, experimental_sandbox: sandbox }) {
	return tool2.description === void 0 ? void 0 : typeof tool2.description === "string" ? tool2.description : tool2.description({
		context: toolsContext[toolName],
		experimental_sandbox: sandbox
	});
}
function getTotalTimeoutMs(timeout) {
	if (timeout == null) return;
	if (typeof timeout === "number") return timeout;
	return timeout.totalMs;
}
function getStepTimeoutMs(timeout) {
	if (timeout == null || typeof timeout === "number") return;
	return timeout.stepMs;
}
function getChunkTimeoutMs(timeout) {
	if (timeout == null || typeof timeout === "number") return;
	return timeout.chunkMs;
}
function getToolTimeoutMs(timeout, toolName) {
	var _a22, _b;
	if (timeout == null || typeof timeout === "number") return;
	return (_b = (_a22 = timeout.tools) == null ? void 0 : _a22[`${toolName}Ms`]) != null ? _b : timeout.toolMs;
}
var jsonValueSchema = lazy(() => union([
	_null(),
	string(),
	number(),
	boolean(),
	record(string(), jsonValueSchema.optional()),
	array$1(jsonValueSchema)
]));
var providerMetadataSchema = record(string(), record(string(), jsonValueSchema.optional()));
var fileInlineDataSchema = union([
	string(),
	_instanceof(Uint8Array),
	_instanceof(ArrayBuffer),
	custom(isBuffer, { message: "Must be a Buffer" })
]);
var providerReferenceSchema = record(string(), string());
var textPartSchema = object$1({
	type: literal("text"),
	text: string(),
	providerOptions: providerMetadataSchema.optional()
});
var imagePartSchema = object$1({
	type: literal("image"),
	image: union([
		fileInlineDataSchema,
		_instanceof(URL),
		providerReferenceSchema
	]),
	mediaType: string().optional(),
	providerOptions: providerMetadataSchema.optional()
});
var taggedFileDataSchema = discriminatedUnion("type", [
	object$1({
		type: literal("data"),
		data: fileInlineDataSchema
	}),
	object$1({
		type: literal("url"),
		url: _instanceof(URL)
	}),
	object$1({
		type: literal("reference"),
		reference: providerReferenceSchema
	}),
	object$1({
		type: literal("text"),
		text: string()
	})
]);
var taggedReasoningFileDataSchema = discriminatedUnion("type", [object$1({
	type: literal("data"),
	data: fileInlineDataSchema
}), object$1({
	type: literal("url"),
	url: _instanceof(URL)
})]);
var filePartSchema = object$1({
	type: literal("file"),
	data: union([
		taggedFileDataSchema,
		fileInlineDataSchema,
		_instanceof(URL),
		providerReferenceSchema
	]),
	filename: string().optional(),
	mediaType: string(),
	providerOptions: providerMetadataSchema.optional()
});
var reasoningPartSchema = object$1({
	type: literal("reasoning"),
	text: string(),
	providerOptions: providerMetadataSchema.optional()
});
var customPartSchema = object$1({
	type: literal("custom"),
	kind: string().transform((value) => value),
	providerOptions: providerMetadataSchema.optional()
});
var reasoningFilePartSchema = object$1({
	type: literal("reasoning-file"),
	data: union([
		taggedReasoningFileDataSchema,
		fileInlineDataSchema,
		_instanceof(URL)
	]),
	mediaType: string(),
	providerOptions: providerMetadataSchema.optional()
});
var toolCallPartSchema = object$1({
	type: literal("tool-call"),
	toolCallId: string(),
	toolName: string(),
	input: unknown(),
	providerOptions: providerMetadataSchema.optional(),
	providerExecuted: boolean().optional()
});
var outputSchema = discriminatedUnion("type", [
	object$1({
		type: literal("text"),
		value: string(),
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("json"),
		value: jsonValueSchema,
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("execution-denied"),
		reason: string().optional(),
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("error-text"),
		value: string(),
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("error-json"),
		value: jsonValueSchema,
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("content"),
		value: array$1(union([
			object$1({
				type: literal("text"),
				text: string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("file"),
				data: taggedFileDataSchema,
				mediaType: string(),
				filename: string().optional(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("file-data"),
				data: string(),
				mediaType: string(),
				filename: string().optional(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("file-url"),
				url: string(),
				mediaType: string().optional(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("file-id"),
				fileId: union([string(), record(string(), string())]),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("file-reference"),
				providerReference: record(string(), string()),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("image-data"),
				data: string(),
				mediaType: string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("image-url"),
				url: string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("image-file-id"),
				fileId: union([string(), record(string(), string())]),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("image-file-reference"),
				providerReference: record(string(), string()),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("custom"),
				providerOptions: providerMetadataSchema.optional()
			})
		]))
	})
]);
var toolResultPartSchema = object$1({
	type: literal("tool-result"),
	toolCallId: string(),
	toolName: string(),
	output: outputSchema,
	providerOptions: providerMetadataSchema.optional()
});
var toolApprovalRequestSchema = object$1({
	type: literal("tool-approval-request"),
	approvalId: string(),
	toolCallId: string()
});
var toolApprovalResponseSchema = object$1({
	type: literal("tool-approval-response"),
	approvalId: string(),
	approved: boolean(),
	reason: string().optional()
});
var systemModelMessageSchema = object$1({
	role: literal("system"),
	content: string(),
	providerOptions: providerMetadataSchema.optional()
});
var userModelMessageSchema = object$1({
	role: literal("user"),
	content: union([string(), array$1(union([
		textPartSchema,
		imagePartSchema,
		filePartSchema
	]))]),
	providerOptions: providerMetadataSchema.optional()
});
var assistantModelMessageSchema = object$1({
	role: literal("assistant"),
	content: union([string(), array$1(union([
		textPartSchema,
		customPartSchema,
		filePartSchema,
		reasoningPartSchema,
		reasoningFilePartSchema,
		toolCallPartSchema,
		toolResultPartSchema,
		toolApprovalRequestSchema
	]))]),
	providerOptions: providerMetadataSchema.optional()
});
var toolModelMessageSchema = object$1({
	role: literal("tool"),
	content: array$1(union([toolResultPartSchema, toolApprovalResponseSchema])),
	providerOptions: providerMetadataSchema.optional()
});
var modelMessageSchema = union([
	systemModelMessageSchema,
	userModelMessageSchema,
	assistantModelMessageSchema,
	toolModelMessageSchema
]);
async function standardizePrompt({ allowSystemInMessages = false, system, instructions = system, prompt, messages }) {
	if (prompt == null && messages == null) throw new InvalidPromptError({
		prompt,
		message: "prompt or messages must be defined"
	});
	if (prompt != null && messages != null) throw new InvalidPromptError({
		prompt,
		message: "prompt and messages cannot be defined at the same time"
	});
	if (typeof instructions !== "string" && !asArray(instructions).every((message) => message.role === "system")) throw new InvalidPromptError({
		prompt,
		message: "instructions must be a string, SystemModelMessage, or array of SystemModelMessage"
	});
	if (prompt != null && typeof prompt === "string") messages = [{
		role: "user",
		content: prompt
	}];
	else if (prompt != null && Array.isArray(prompt)) messages = prompt;
	else if (messages == null) throw new InvalidPromptError({
		prompt,
		message: "prompt or messages must be defined"
	});
	if (messages.length === 0) throw new InvalidPromptError({
		prompt,
		message: "messages must not be empty"
	});
	if (!allowSystemInMessages && messages.some((message) => message.role === "system")) throw new InvalidPromptError({
		prompt,
		message: "System messages are not allowed in the prompt or messages fields. Use the instructions option instead."
	});
	const validationResult = await safeValidateTypes({
		value: messages,
		schema: array$1(modelMessageSchema)
	});
	if (!validationResult.success) throw new InvalidPromptError({
		prompt,
		message: "The messages do not match the ModelMessage[] schema.",
		cause: validationResult.error
	});
	return {
		messages,
		instructions
	};
}
function wrapGatewayError(error) {
	if (!GatewayAuthenticationError.isInstance(error)) return error;
	const isProductionEnv = (process == null ? void 0 : process.env.NODE_ENV) === "production";
	const moreInfoURL = "https://ai-sdk.dev/unauthenticated-ai-gateway";
	if (isProductionEnv) return new AISDKError({
		name: "GatewayError",
		message: `Unauthenticated. Configure AI_GATEWAY_API_KEY or use a provider module. Learn more: ${moreInfoURL}`
	});
	return Object.assign(/* @__PURE__ */ new Error(`\x1B[1m\x1B[31mUnauthenticated request to AI Gateway.\x1B[0m

To authenticate, set the \x1B[33mAI_GATEWAY_API_KEY\x1B[0m environment variable with your API key.

Alternatively, you can use a provider module instead of the AI Gateway.

Learn more: \x1B[34m${moreInfoURL}\x1B[0m

`), { name: "GatewayAuthenticationError" });
}
function asLanguageModelUsage(usage) {
	return {
		inputTokens: usage.inputTokens.total,
		inputTokenDetails: {
			noCacheTokens: usage.inputTokens.noCache,
			cacheReadTokens: usage.inputTokens.cacheRead,
			cacheWriteTokens: usage.inputTokens.cacheWrite
		},
		outputTokens: usage.outputTokens.total,
		outputTokenDetails: {
			textTokens: usage.outputTokens.text,
			reasoningTokens: usage.outputTokens.reasoning
		},
		totalTokens: addTokenCounts(usage.inputTokens.total, usage.outputTokens.total),
		raw: usage.raw
	};
}
function createNullLanguageModelUsage() {
	return {
		inputTokens: void 0,
		inputTokenDetails: {
			noCacheTokens: void 0,
			cacheReadTokens: void 0,
			cacheWriteTokens: void 0
		},
		outputTokens: void 0,
		outputTokenDetails: {
			textTokens: void 0,
			reasoningTokens: void 0
		},
		totalTokens: void 0,
		raw: void 0
	};
}
function addLanguageModelUsage(usage1, usage2) {
	var _a22, _b, _c, _d, _e, _f, _g, _h, _i, _j;
	return {
		inputTokens: addTokenCounts(usage1.inputTokens, usage2.inputTokens),
		inputTokenDetails: {
			noCacheTokens: addTokenCounts((_a22 = usage1.inputTokenDetails) == null ? void 0 : _a22.noCacheTokens, (_b = usage2.inputTokenDetails) == null ? void 0 : _b.noCacheTokens),
			cacheReadTokens: addTokenCounts((_c = usage1.inputTokenDetails) == null ? void 0 : _c.cacheReadTokens, (_d = usage2.inputTokenDetails) == null ? void 0 : _d.cacheReadTokens),
			cacheWriteTokens: addTokenCounts((_e = usage1.inputTokenDetails) == null ? void 0 : _e.cacheWriteTokens, (_f = usage2.inputTokenDetails) == null ? void 0 : _f.cacheWriteTokens)
		},
		outputTokens: addTokenCounts(usage1.outputTokens, usage2.outputTokens),
		outputTokenDetails: {
			textTokens: addTokenCounts((_g = usage1.outputTokenDetails) == null ? void 0 : _g.textTokens, (_h = usage2.outputTokenDetails) == null ? void 0 : _h.textTokens),
			reasoningTokens: addTokenCounts((_i = usage1.outputTokenDetails) == null ? void 0 : _i.reasoningTokens, (_j = usage2.outputTokenDetails) == null ? void 0 : _j.reasoningTokens)
		},
		totalTokens: addTokenCounts(usage1.totalTokens, usage2.totalTokens)
	};
}
function addTokenCounts(tokenCount1, tokenCount2) {
	return tokenCount1 == null && tokenCount2 == null ? void 0 : (tokenCount1 != null ? tokenCount1 : 0) + (tokenCount2 != null ? tokenCount2 : 0);
}
function mergeAbortSignals(...signals) {
	const validSignals = filterNullable(...signals).map((signal) => signal instanceof AbortSignal ? signal : AbortSignal.timeout(signal));
	return validSignals.length === 0 ? void 0 : validSignals.length === 1 ? validSignals[0] : AbortSignal.any(validSignals);
}
function mergeObjects(base, overrides) {
	if (base === void 0 && overrides === void 0) return;
	if (base === void 0) return overrides;
	if (overrides === void 0) return base;
	const result = { ...base };
	for (const key in overrides) {
		if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
		if (Object.prototype.hasOwnProperty.call(overrides, key)) {
			const overridesValue = overrides[key];
			if (overridesValue === void 0) continue;
			const baseValue = key in base ? base[key] : void 0;
			const isSourceObject = overridesValue !== null && typeof overridesValue === "object" && !Array.isArray(overridesValue) && !(overridesValue instanceof Date) && !(overridesValue instanceof RegExp);
			const isTargetObject = baseValue !== null && baseValue !== void 0 && typeof baseValue === "object" && !Array.isArray(baseValue) && !(baseValue instanceof Date) && !(baseValue instanceof RegExp);
			if (isSourceObject && isTargetObject) result[key] = mergeObjects(baseValue, overridesValue);
			else result[key] = overridesValue;
		}
	}
	return result;
}
function now() {
	var _a22, _b;
	return (_b = (_a22 = globalThis == null ? void 0 : globalThis.performance) == null ? void 0 : _a22.now()) != null ? _b : Date.now();
}
async function notify(options) {
	await Promise.all(asArray(options.callbacks).map(async (callback) => {
		try {
			await (callback == null ? void 0 : callback(options.event));
		} catch (e) {}
	}));
}
function getRetryDelayInMs({ error, exponentialBackoffDelay }) {
	const headers = APICallError.isInstance(error) ? error.responseHeaders : APICallError.isInstance(error.cause) ? error.cause.responseHeaders : void 0;
	if (!headers) return exponentialBackoffDelay;
	let ms;
	const retryAfterMs = headers["retry-after-ms"];
	if (retryAfterMs) {
		const timeoutMs = parseFloat(retryAfterMs);
		if (!Number.isNaN(timeoutMs)) ms = timeoutMs;
	}
	const retryAfter = headers["retry-after"];
	if (retryAfter && ms === void 0) {
		const timeoutSeconds = parseFloat(retryAfter);
		if (!Number.isNaN(timeoutSeconds)) ms = timeoutSeconds * 1e3;
		else ms = Date.parse(retryAfter) - Date.now();
	}
	if (ms != null && !Number.isNaN(ms) && 0 <= ms && (ms < 60 * 1e3 || ms < exponentialBackoffDelay)) return ms;
	return exponentialBackoffDelay;
}
var retryWithExponentialBackoffRespectingRetryHeaders = ({ maxRetries = 2, initialDelayInMs = 2e3, backoffFactor = 2, abortSignal } = {}) => retryWithExponentialBackoff({
	maxRetries,
	initialDelayInMs,
	backoffFactor,
	abortSignal,
	shouldRetry: (error) => error instanceof Error && (APICallError.isInstance(error) && error.isRetryable === true || GatewayError.isInstance(error) && error.isRetryable === true),
	getDelayInMs: ({ error, exponentialBackoffDelay }) => getRetryDelayInMs({
		error,
		exponentialBackoffDelay
	}),
	createRetryError: ({ message, reason, errors }) => new RetryError({
		message,
		reason,
		errors
	})
});
function prepareRetries({ maxRetries, abortSignal }) {
	if (maxRetries != null) {
		if (!Number.isInteger(maxRetries)) throw new InvalidArgumentError({
			parameter: "maxRetries",
			value: maxRetries,
			message: "maxRetries must be an integer"
		});
		if (maxRetries < 0) throw new InvalidArgumentError({
			parameter: "maxRetries",
			value: maxRetries,
			message: "maxRetries must be >= 0"
		});
	}
	const maxRetriesResult = maxRetries != null ? maxRetries : 2;
	return {
		maxRetries: maxRetriesResult,
		retry: retryWithExponentialBackoffRespectingRetryHeaders({
			maxRetries: maxRetriesResult,
			abortSignal
		})
	};
}
function setAbortTimeout({ abortController, label, timeoutMs }) {
	if (abortController == null || timeoutMs == null) return;
	return setTimeout(() => abortController.abort(new DOMException(`${label} timeout of ${timeoutMs}ms exceeded`, "TimeoutError")), timeoutMs);
}
function calculateTokensPerSecond({ tokens, durationMs }) {
	const tokenRate = 1e3 * (tokens != null ? tokens : 0) / (durationMs != null ? durationMs : 0);
	return Number.isFinite(tokenRate) ? tokenRate : 0;
}
function collectToolApprovals({ messages }) {
	const lastMessage = messages.at(-1);
	if ((lastMessage == null ? void 0 : lastMessage.role) != "tool") return {
		approvedToolApprovals: [],
		deniedToolApprovals: []
	};
	const toolCallsByToolCallId = {};
	for (const message of messages) if (message.role === "assistant" && typeof message.content !== "string") {
		const content = message.content;
		for (const part of content) if (part.type === "tool-call") toolCallsByToolCallId[part.toolCallId] = part;
	}
	const toolApprovalRequestsByApprovalId = {};
	for (const message of messages) if (message.role === "assistant" && typeof message.content !== "string") {
		const content = message.content;
		for (const part of content) if (part.type === "tool-approval-request") toolApprovalRequestsByApprovalId[part.approvalId] = part;
	}
	const toolResults = {};
	for (const part of lastMessage.content) if (part.type === "tool-result") toolResults[part.toolCallId] = part;
	const approvedToolApprovals = [];
	const deniedToolApprovals = [];
	const approvalResponses = lastMessage.content.filter((part) => part.type === "tool-approval-response");
	for (const approvalResponse of approvalResponses) {
		const approvalRequest = toolApprovalRequestsByApprovalId[approvalResponse.approvalId];
		if (approvalRequest == null) throw new InvalidToolApprovalError({ approvalId: approvalResponse.approvalId });
		if (toolResults[approvalRequest.toolCallId] != null) continue;
		const toolCall = toolCallsByToolCallId[approvalRequest.toolCallId];
		if (toolCall == null) throw new ToolCallNotFoundForApprovalError({
			toolCallId: approvalRequest.toolCallId,
			approvalId: approvalRequest.approvalId
		});
		const approval = {
			approvalRequest,
			approvalResponse,
			toolCall
		};
		if (approvalResponse.approved) approvedToolApprovals.push(approval);
		else deniedToolApprovals.push(approval);
	}
	return {
		approvedToolApprovals,
		deniedToolApprovals
	};
}
async function validateToolContext({ toolName, context, contextSchema }) {
	if (contextSchema == null) return context;
	return await validateTypes({
		value: context,
		schema: contextSchema,
		context: {
			field: "tool context",
			entityName: toolName
		}
	});
}
async function executeToolCall({ toolCall, tools, toolsContext, callId, messages, abortSignal, timeout, experimental_sandbox: sandbox, onPreliminaryToolResult, onToolExecutionStart, onToolExecutionEnd, executeToolInTelemetryContext = async ({ execute }) => await execute(), runInTracingChannelSpan = async ({ execute }) => await execute() }) {
	const { toolName, toolCallId, input } = toolCall;
	const tool2 = tools == null ? void 0 : tools[toolName];
	if (!isExecutableTool(tool2)) return;
	const context = await validateToolContext({
		toolName,
		context: toolsContext == null ? void 0 : toolsContext[toolName],
		contextSchema: tool2.contextSchema
	});
	const toolExecutionContext = {
		toolCall,
		messages,
		toolContext: context
	};
	const baseCallbackEvent = {
		callId,
		...toolExecutionContext
	};
	return await runInTracingChannelSpan({
		type: "executeTool",
		event: baseCallbackEvent,
		execute: async () => {
			let output;
			await notify({
				event: baseCallbackEvent,
				callbacks: onToolExecutionStart
			});
			const toolAbortSignal = mergeAbortSignals(abortSignal, getToolTimeoutMs(timeout, toolName));
			let toolExecutionMs = 0;
			try {
				await executeToolInTelemetryContext({
					callId,
					toolCallId,
					...toolExecutionContext,
					execute: async () => {
						const startTime = now();
						try {
							const stream = executeTool({
								tool: tool2,
								input,
								options: {
									toolCallId,
									messages,
									abortSignal: toolAbortSignal,
									context,
									experimental_sandbox: sandbox
								}
							});
							for await (const part of stream) if (part.type === "preliminary") onPreliminaryToolResult?.({
								...toolCall,
								type: "tool-result",
								output: part.output,
								preliminary: true
							});
							else output = part.output;
						} finally {
							toolExecutionMs = now() - startTime;
						}
					}
				});
			} catch (error) {
				const toolError = {
					type: "tool-error",
					toolCallId,
					toolName,
					input,
					error,
					dynamic: tool2.type === "dynamic",
					...toolCall.providerMetadata != null ? { providerMetadata: toolCall.providerMetadata } : {},
					...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
				};
				await notify({
					event: {
						...baseCallbackEvent,
						toolOutput: toolError,
						toolExecutionMs
					},
					callbacks: onToolExecutionEnd
				});
				return {
					output: toolError,
					toolExecutionMs
				};
			}
			const toolResult = {
				type: "tool-result",
				toolCallId,
				toolName,
				input,
				output,
				dynamic: tool2.type === "dynamic",
				...toolCall.providerMetadata != null ? { providerMetadata: toolCall.providerMetadata } : {},
				...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
			};
			await notify({
				event: {
					...baseCallbackEvent,
					toolOutput: toolResult,
					toolExecutionMs
				},
				callbacks: onToolExecutionEnd
			});
			return {
				output: toolResult,
				toolExecutionMs
			};
		}
	});
}
function filterActiveTools({ tools, activeTools }) {
	if (tools == null || activeTools == null) return tools;
	return Object.fromEntries(Object.entries(tools).filter(([name22]) => activeTools.includes(name22)));
}
var DefaultGeneratedFile = class {
	constructor({ data, mediaType }) {
		const isUint8Array = data instanceof Uint8Array;
		this.base64Data = isUint8Array ? void 0 : data;
		this.uint8ArrayData = isUint8Array ? data : void 0;
		this.mediaType = mediaType;
	}
	get base64() {
		if (this.base64Data == null) this.base64Data = convertUint8ArrayToBase64(this.uint8ArrayData);
		return this.base64Data;
	}
	get uint8Array() {
		if (this.uint8ArrayData == null) this.uint8ArrayData = convertBase64ToUint8Array(this.base64Data);
		return this.uint8ArrayData;
	}
};
var DefaultGeneratedFileWithType = class extends DefaultGeneratedFile {
	constructor(options) {
		super(options);
		this.type = "file";
	}
};
var output_exports = {};
__export(output_exports, {
	array: () => array,
	choice: () => choice,
	json: () => json,
	object: () => object,
	text: () => text
});
function fixJson(input) {
	const stack = ["ROOT"];
	let lastValidIndex = -1;
	let literalStart = null;
	let unicodeEscapeDigits = 0;
	function isHexDigit(char) {
		return char >= "0" && char <= "9" || char >= "A" && char <= "F" || char >= "a" && char <= "f";
	}
	function processValueStart(char, i, swapState) {
		switch (char) {
			case "\"":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_STRING");
				break;
			case "f":
			case "t":
			case "n":
				lastValidIndex = i;
				literalStart = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_LITERAL");
				break;
			case "-":
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_NUMBER");
				break;
			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_NUMBER");
				break;
			case "{":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_OBJECT_START");
				break;
			case "[":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_ARRAY_START");
				break;
		}
	}
	function processAfterObjectValue(char, i) {
		switch (char) {
			case ",":
				stack.pop();
				stack.push("INSIDE_OBJECT_AFTER_COMMA");
				break;
			case "}":
				lastValidIndex = i;
				stack.pop();
				break;
		}
	}
	function processAfterArrayValue(char, i) {
		switch (char) {
			case ",":
				stack.pop();
				stack.push("INSIDE_ARRAY_AFTER_COMMA");
				break;
			case "]":
				lastValidIndex = i;
				stack.pop();
				break;
		}
	}
	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		switch (stack[stack.length - 1]) {
			case "ROOT":
				processValueStart(char, i, "FINISH");
				break;
			case "INSIDE_OBJECT_START":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_KEY");
						break;
					case "}":
						lastValidIndex = i;
						stack.pop();
						break;
				}
				break;
			case "INSIDE_OBJECT_AFTER_COMMA":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_KEY");
						break;
				}
				break;
			case "INSIDE_OBJECT_KEY":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_AFTER_KEY");
						break;
				}
				break;
			case "INSIDE_OBJECT_AFTER_KEY":
				switch (char) {
					case ":":
						stack.pop();
						stack.push("INSIDE_OBJECT_BEFORE_VALUE");
						break;
				}
				break;
			case "INSIDE_OBJECT_BEFORE_VALUE":
				processValueStart(char, i, "INSIDE_OBJECT_AFTER_VALUE");
				break;
			case "INSIDE_OBJECT_AFTER_VALUE":
				processAfterObjectValue(char, i);
				break;
			case "INSIDE_STRING":
				switch (char) {
					case "\"":
						stack.pop();
						lastValidIndex = i;
						break;
					case "\\":
						stack.push("INSIDE_STRING_ESCAPE");
						break;
					default: lastValidIndex = i;
				}
				break;
			case "INSIDE_ARRAY_START":
				switch (char) {
					case "]":
						lastValidIndex = i;
						stack.pop();
						break;
					default:
						lastValidIndex = i;
						processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
						break;
				}
				break;
			case "INSIDE_ARRAY_AFTER_VALUE":
				switch (char) {
					case ",":
						stack.pop();
						stack.push("INSIDE_ARRAY_AFTER_COMMA");
						break;
					case "]":
						lastValidIndex = i;
						stack.pop();
						break;
					default:
						lastValidIndex = i;
						break;
				}
				break;
			case "INSIDE_ARRAY_AFTER_COMMA":
				processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
				break;
			case "INSIDE_STRING_ESCAPE":
				stack.pop();
				if (char === "u") {
					unicodeEscapeDigits = 0;
					stack.push("INSIDE_STRING_UNICODE_ESCAPE");
				} else lastValidIndex = i;
				break;
			case "INSIDE_STRING_UNICODE_ESCAPE":
				if (isHexDigit(char)) {
					unicodeEscapeDigits++;
					if (unicodeEscapeDigits === 4) {
						stack.pop();
						lastValidIndex = i;
					}
				}
				break;
			case "INSIDE_NUMBER":
				switch (char) {
					case "0":
					case "1":
					case "2":
					case "3":
					case "4":
					case "5":
					case "6":
					case "7":
					case "8":
					case "9":
						lastValidIndex = i;
						break;
					case "e":
					case "E":
					case "-":
					case ".": break;
					case ",":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
						if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
						break;
					case "}":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
						break;
					case "]":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
						break;
					default:
						stack.pop();
						break;
				}
				break;
			case "INSIDE_LITERAL": {
				const partialLiteral = input.substring(literalStart, i + 1);
				if (!"false".startsWith(partialLiteral) && !"true".startsWith(partialLiteral) && !"null".startsWith(partialLiteral)) {
					stack.pop();
					if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
					else if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
				} else lastValidIndex = i;
				break;
			}
		}
	}
	let result = input.slice(0, lastValidIndex + 1);
	for (let i = stack.length - 1; i >= 0; i--) switch (stack[i]) {
		case "INSIDE_STRING":
			result += "\"";
			break;
		case "INSIDE_OBJECT_KEY":
		case "INSIDE_OBJECT_AFTER_KEY":
		case "INSIDE_OBJECT_AFTER_COMMA":
		case "INSIDE_OBJECT_START":
		case "INSIDE_OBJECT_BEFORE_VALUE":
		case "INSIDE_OBJECT_AFTER_VALUE":
			result += "}";
			break;
		case "INSIDE_ARRAY_START":
		case "INSIDE_ARRAY_AFTER_COMMA":
		case "INSIDE_ARRAY_AFTER_VALUE":
			result += "]";
			break;
		case "INSIDE_LITERAL": {
			const partialLiteral = input.substring(literalStart, input.length);
			if ("true".startsWith(partialLiteral)) result += "true".slice(partialLiteral.length);
			else if ("false".startsWith(partialLiteral)) result += "false".slice(partialLiteral.length);
			else if ("null".startsWith(partialLiteral)) result += "null".slice(partialLiteral.length);
		}
	}
	return result;
}
async function parsePartialJson(jsonText) {
	if (jsonText === void 0) return {
		value: void 0,
		state: "undefined-input"
	};
	let result = await safeParseJSON({ text: jsonText });
	if (result.success) return {
		value: result.value,
		state: "successful-parse"
	};
	result = await safeParseJSON({ text: fixJson(jsonText) });
	if (result.success) return {
		value: result.value,
		state: "repaired-parse"
	};
	return {
		value: void 0,
		state: "failed-parse"
	};
}
var text = () => ({
	name: "text",
	responseFormat: Promise.resolve({ type: "text" }),
	async parseCompleteOutput({ text: text2 }) {
		return text2;
	},
	async parsePartialOutput({ text: text2 }) {
		return { partial: text2 };
	},
	createElementStreamTransform() {}
});
var object = ({ schema: inputSchema, name: name22, description }) => {
	const schema = asSchema(inputSchema);
	return {
		name: "object",
		responseFormat: resolve(schema.jsonSchema).then((jsonSchema2) => ({
			type: "json",
			schema: jsonSchema2,
			...name22 != null && { name: name22 },
			...description != null && { description }
		})),
		async parseCompleteOutput({ text: text2 }, context) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const validationResult = await safeValidateTypes({
				value: parseResult.value,
				schema
			});
			if (!validationResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: validationResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			return validationResult.value;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": return { partial: result.value };
			}
		},
		createElementStreamTransform() {}
	};
};
var array = ({ element: inputElementSchema, name: name22, description }) => {
	const elementSchema = asSchema(inputElementSchema);
	return {
		name: "array",
		responseFormat: resolve(elementSchema.jsonSchema).then((jsonSchema2) => {
			const { $schema: _$schema, ...itemSchema } = jsonSchema2;
			return {
				type: "json",
				schema: {
					$schema: "http://json-schema.org/draft-07/schema#",
					type: "object",
					properties: { elements: {
						type: "array",
						items: itemSchema
					} },
					required: ["elements"],
					additionalProperties: false
				},
				...name22 != null && { name: name22 },
				...description != null && { description }
			};
		}),
		async parseCompleteOutput({ text: text2 }, context) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const outerValue = parseResult.value;
			if (outerValue == null || typeof outerValue !== "object" || !("elements" in outerValue) || !Array.isArray(outerValue.elements)) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: new TypeValidationError({
					value: outerValue,
					cause: "response must be an object with an elements array"
				}),
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const validatedElements = [];
			for (const element of outerValue.elements) {
				const validationResult = await safeValidateTypes({
					value: element,
					schema: elementSchema
				});
				if (!validationResult.success) throw new NoObjectGeneratedError({
					message: "No object generated: response did not match schema.",
					cause: validationResult.error,
					text: text2,
					response: context.response,
					usage: context.usage,
					finishReason: context.finishReason
				});
				validatedElements.push(validationResult.value);
			}
			return validatedElements;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": {
					const outerValue = result.value;
					if (outerValue == null || typeof outerValue !== "object" || !("elements" in outerValue) || !Array.isArray(outerValue.elements)) return;
					const rawElements = result.state === "repaired-parse" && outerValue.elements.length > 0 ? outerValue.elements.slice(0, -1) : outerValue.elements;
					const parsedElements = [];
					for (const rawElement of rawElements) {
						const validationResult = await safeValidateTypes({
							value: rawElement,
							schema: elementSchema
						});
						if (validationResult.success) parsedElements.push(validationResult.value);
					}
					return { partial: parsedElements };
				}
			}
		},
		createElementStreamTransform() {
			let publishedElements = 0;
			return new TransformStream({ transform({ partialOutput }, controller) {
				if (partialOutput != null) for (; publishedElements < partialOutput.length; publishedElements++) controller.enqueue(partialOutput[publishedElements]);
			} });
		}
	};
};
var choice = ({ options: choiceOptions, name: name22, description }) => {
	return {
		name: "choice",
		responseFormat: Promise.resolve({
			type: "json",
			schema: {
				$schema: "http://json-schema.org/draft-07/schema#",
				type: "object",
				properties: { result: {
					type: "string",
					enum: choiceOptions
				} },
				required: ["result"],
				additionalProperties: false
			},
			...name22 != null && { name: name22 },
			...description != null && { description }
		}),
		async parseCompleteOutput({ text: text2 }, context) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const outerValue = parseResult.value;
			if (outerValue == null || typeof outerValue !== "object" || !("result" in outerValue) || typeof outerValue.result !== "string" || !choiceOptions.includes(outerValue.result)) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: new TypeValidationError({
					value: outerValue,
					cause: "response must be an object that contains a choice value."
				}),
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			return outerValue.result;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": {
					const outerValue = result.value;
					if (outerValue == null || typeof outerValue !== "object" || !("result" in outerValue) || typeof outerValue.result !== "string") return;
					const potentialMatches = choiceOptions.filter((choiceOption) => choiceOption.startsWith(outerValue.result));
					if (result.state === "successful-parse") return potentialMatches.includes(outerValue.result) ? { partial: outerValue.result } : void 0;
					else return potentialMatches.length === 1 ? { partial: potentialMatches[0] } : void 0;
				}
			}
		},
		createElementStreamTransform() {}
	};
};
var json = ({ name: name22, description } = {}) => {
	return {
		name: "json",
		responseFormat: Promise.resolve({
			type: "json",
			...name22 != null && { name: name22 },
			...description != null && { description }
		}),
		async parseCompleteOutput({ text: text2 }, context) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			return parseResult.value;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": return result.value === void 0 ? void 0 : { partial: result.value };
			}
		},
		createElementStreamTransform() {}
	};
};
async function parseToolCall({ toolCall, tools, repairToolCall, refineToolInput, messages, instructions }) {
	try {
		if (tools == null) {
			if (toolCall.providerExecuted && toolCall.dynamic) return await refineParsedToolCallInput({
				toolCall: await parseProviderExecutedDynamicToolCall(toolCall),
				refineToolInput
			});
			throw new NoSuchToolError({ toolName: toolCall.toolName });
		}
		try {
			return await refineParsedToolCallInput({
				toolCall: await doParseToolCall({
					toolCall,
					tools
				}),
				refineToolInput
			});
		} catch (error) {
			if (repairToolCall == null || !(NoSuchToolError.isInstance(error) || InvalidToolInputError.isInstance(error))) throw error;
			let repairedToolCall = null;
			try {
				repairedToolCall = await repairToolCall({
					toolCall,
					tools,
					inputSchema: async ({ toolName }) => {
						const { inputSchema } = tools[toolName];
						return await asSchema(inputSchema).jsonSchema;
					},
					instructions,
					system: instructions,
					messages,
					error
				});
			} catch (repairError) {
				throw new ToolCallRepairError({
					cause: repairError,
					originalError: error
				});
			}
			if (repairedToolCall == null) throw error;
			return await refineParsedToolCallInput({
				toolCall: await doParseToolCall({
					toolCall: repairedToolCall,
					tools
				}),
				refineToolInput
			});
		}
	} catch (error) {
		const parsedInput = await safeParseJSON({ text: toolCall.input });
		const input = parsedInput.success ? parsedInput.value : toolCall.input;
		const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
		return {
			type: "tool-call",
			toolCallId: toolCall.toolCallId,
			toolName: toolCall.toolName,
			input,
			dynamic: true,
			invalid: true,
			error,
			title: tool2 == null ? void 0 : tool2.title,
			providerExecuted: toolCall.providerExecuted,
			providerMetadata: toolCall.providerMetadata,
			...(tool2 == null ? void 0 : tool2.metadata) != null ? { toolMetadata: tool2.metadata } : {}
		};
	}
}
async function refineParsedToolCallInput({ toolCall, refineToolInput }) {
	const refine = refineToolInput == null ? void 0 : refineToolInput[toolCall.toolName];
	if (refine == null) return toolCall;
	return {
		...toolCall,
		input: await refine(toolCall.input)
	};
}
async function parseProviderExecutedDynamicToolCall(toolCall) {
	const parseResult = toolCall.input.trim() === "" ? {
		success: true,
		value: {}
	} : await safeParseJSON({ text: toolCall.input });
	if (parseResult.success === false) throw new InvalidToolInputError({
		toolName: toolCall.toolName,
		toolInput: toolCall.input,
		cause: parseResult.error
	});
	return {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName: toolCall.toolName,
		input: parseResult.value,
		providerExecuted: true,
		dynamic: true,
		providerMetadata: toolCall.providerMetadata
	};
}
async function doParseToolCall({ toolCall, tools }) {
	const toolName = toolCall.toolName;
	const tool2 = tools[toolName];
	if (tool2 == null) {
		if (toolCall.providerExecuted && toolCall.dynamic) return await parseProviderExecutedDynamicToolCall(toolCall);
		throw new NoSuchToolError({
			toolName: toolCall.toolName,
			availableTools: Object.keys(tools)
		});
	}
	const schema = asSchema(tool2.inputSchema);
	const parseResult = toolCall.input.trim() === "" ? await safeValidateTypes({
		value: {},
		schema
	}) : await safeParseJSON({
		text: toolCall.input,
		schema
	});
	if (parseResult.success === false) throw new InvalidToolInputError({
		toolName,
		toolInput: toolCall.input,
		cause: parseResult.error
	});
	return tool2.type === "dynamic" ? {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName: toolCall.toolName,
		input: parseResult.value,
		providerExecuted: toolCall.providerExecuted,
		providerMetadata: toolCall.providerMetadata,
		...tool2.metadata != null ? { toolMetadata: tool2.metadata } : {},
		dynamic: true,
		title: tool2.title
	} : {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName,
		input: parseResult.value,
		providerExecuted: toolCall.providerExecuted,
		providerMetadata: toolCall.providerMetadata,
		...tool2.metadata != null ? { toolMetadata: tool2.metadata } : {},
		title: tool2.title
	};
}
function unwrapReasoningFileData(data) {
	if (typeof data === "object" && data !== null && "type" in data) return data.type === "data" ? data.data : data.url;
	return data;
}
function convertFromReasoningOutputs(parts) {
	return parts.map((part) => {
		if (part.type === "reasoning") return {
			type: "reasoning",
			text: part.text,
			...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
		};
		return {
			type: "reasoning-file",
			data: part.file.base64,
			mediaType: part.file.mediaType,
			...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
		};
	});
}
function convertToReasoningOutputs(parts) {
	return parts.map((part) => {
		if (part.type === "reasoning") return {
			type: "reasoning",
			text: part.text,
			...part.providerOptions != null ? { providerMetadata: part.providerOptions } : {}
		};
		const rawData = unwrapReasoningFileData(part.data);
		return {
			type: "reasoning-file",
			file: new DefaultGeneratedFile({
				data: rawData instanceof ArrayBuffer ? new Uint8Array(rawData) : rawData instanceof URL ? rawData.toString() : rawData,
				mediaType: part.mediaType
			}),
			...part.providerOptions != null ? { providerMetadata: part.providerOptions } : {}
		};
	});
}
async function resolveToolApproval({ tools, toolCall, toolApproval, messages, toolsContext, runtimeContext }) {
	if (toolApproval != null && typeof toolApproval === "function") return normalizeToolApprovalStatus(await toolApproval({
		toolCall,
		tools,
		toolsContext,
		messages,
		runtimeContext
	}));
	const toolName = toolCall.toolName;
	const tool2 = tools == null ? void 0 : tools[toolName];
	const input = toolCall.input;
	const userDefinedToolApprovalStatus = toolApproval == null ? void 0 : toolApproval[toolName];
	if (userDefinedToolApprovalStatus != null) return normalizeToolApprovalStatus(typeof userDefinedToolApprovalStatus === "function" ? await userDefinedToolApprovalStatus(input, {
		toolCallId: toolCall.toolCallId,
		messages,
		toolContext: await validateToolContext({
			toolName,
			context: toolsContext == null ? void 0 : toolsContext[toolName],
			contextSchema: tool2 == null ? void 0 : tool2.contextSchema
		}),
		runtimeContext
	}) : userDefinedToolApprovalStatus);
	if ((tool2 == null ? void 0 : tool2.needsApproval) == null) return { type: "not-applicable" };
	return (typeof tool2.needsApproval === "function" ? await tool2.needsApproval(input, {
		toolCallId: toolCall.toolCallId,
		messages,
		context: await validateToolContext({
			toolName,
			context: toolsContext == null ? void 0 : toolsContext[toolName],
			contextSchema: tool2 == null ? void 0 : tool2.contextSchema
		})
	}) : tool2.needsApproval) ? { type: "user-approval" } : { type: "not-applicable" };
}
function normalizeToolApprovalStatus(status) {
	return status === void 0 ? { type: "not-applicable" } : typeof status === "string" ? { type: status } : status;
}
function mergeCallbacks(...callbacks) {
	return async (event) => {
		await Promise.allSettled(callbacks.map(async (callback) => {
			await (callback == null ? void 0 : callback(event));
		}));
	};
}
function isNodeRuntime() {
	var _a22;
	return typeof process !== "undefined" && ((_a22 = process.release) == null ? void 0 : _a22.name) === "node";
}
var diagnosticsChannelPromise;
async function loadDiagnosticsChannel() {
	if (!isNodeRuntime()) return;
	if (diagnosticsChannelPromise == null) diagnosticsChannelPromise = Promise.resolve(loadBuiltinModule("node:diagnostics_channel"));
	return diagnosticsChannelPromise;
}
function loadBuiltinModule(id) {
	var _a22;
	const processWithBuiltins = globalThis.process;
	try {
		return (_a22 = processWithBuiltins == null ? void 0 : processWithBuiltins.getBuiltinModule) == null ? void 0 : _a22.call(processWithBuiltins, id);
	} catch (e) {
		return;
	}
}
async function runWithTracingChannelSpan(message, execute) {
	var _a22;
	const diagnosticsChannel = await loadDiagnosticsChannel();
	const tracingChannel = (_a22 = diagnosticsChannel == null ? void 0 : diagnosticsChannel.tracingChannel) == null ? void 0 : _a22.call(diagnosticsChannel, "ai:telemetry");
	if (tracingChannel == null || tracingChannel.hasSubscribers === false) return await execute();
	let executePromise;
	let executionResult;
	let executionError;
	let hasExecutionResult = false;
	let hasExecutionError = false;
	const tracedExecute = () => {
		try {
			executePromise = Promise.resolve(execute());
		} catch (error) {
			executePromise = Promise.reject(error);
		}
		executePromise = executePromise.then((result) => {
			executionResult = result;
			hasExecutionResult = true;
			return result;
		}, (error) => {
			executionError = error;
			hasExecutionError = true;
			throw error;
		});
		return executePromise;
	};
	try {
		return await tracingChannel.tracePromise(tracedExecute, message);
	} catch (e) {
		if (hasExecutionError) throw executionError;
		if (hasExecutionResult) return executionResult;
		if (executePromise != null) return await executePromise;
		return await execute();
	}
}
function openTelemetryChannelSpanContext({ message, completion }) {
	var _a22;
	if (!isNodeRuntime()) return;
	const diagnosticsChannel = loadBuiltinModule("node:diagnostics_channel");
	const asyncHooks = loadBuiltinModule("node:async_hooks");
	const tracingChannel = (_a22 = diagnosticsChannel == null ? void 0 : diagnosticsChannel.tracingChannel) == null ? void 0 : _a22.call(diagnosticsChannel, "ai:telemetry");
	if (tracingChannel == null || tracingChannel.hasSubscribers === false || asyncHooks == null) {
		Promise.resolve(completion).catch(() => {});
		return;
	}
	const context = message;
	let asyncResource;
	let asyncEndPublished = false;
	const safePublish = (publish) => {
		try {
			publish();
		} catch (e) {}
	};
	const publishAsyncEnd = ({ result, error }) => {
		if (asyncEndPublished) return;
		asyncEndPublished = true;
		if (error !== void 0) {
			context.error = error;
			safePublish(() => tracingChannel.error.publish(context));
		}
		if (result !== void 0) context.result = result;
		safePublish(() => tracingChannel.asyncEnd.publish(context));
	};
	safePublish(() => {
		tracingChannel.start.runStores(context, () => {
			asyncResource = new asyncHooks.AsyncResource("ai.telemetry");
		});
	});
	safePublish(() => tracingChannel.end.publish(context));
	Promise.resolve(completion).then((result) => publishAsyncEnd({ result }), (error) => publishAsyncEnd({ error }));
	return { run: (execute) => asyncResource == null ? execute() : asyncResource.runInAsyncScope(execute) };
}
function registerTelemetry(...integrations) {
	if (!globalThis.AI_SDK_TELEMETRY_INTEGRATIONS) globalThis.AI_SDK_TELEMETRY_INTEGRATIONS = [];
	globalThis.AI_SDK_TELEMETRY_INTEGRATIONS.push(...integrations);
}
function getGlobalTelemetryIntegrations() {
	var _a22;
	return (_a22 = globalThis.AI_SDK_TELEMETRY_INTEGRATIONS) != null ? _a22 : [];
}
function augmentEvent(event, telemetry) {
	return Object.assign(Object.create(Object.getPrototypeOf(event)), event, telemetry);
}
function createTelemetryDispatcher({ telemetry }) {
	if ((telemetry == null ? void 0 : telemetry.isEnabled) === false) return {};
	const localIntegrations = telemetry == null ? void 0 : telemetry.integrations;
	const integrations = localIntegrations != null ? asArray(localIntegrations) : getGlobalTelemetryIntegrations();
	const telemetryMetadata = {
		recordInputs: telemetry == null ? void 0 : telemetry.recordInputs,
		recordOutputs: telemetry == null ? void 0 : telemetry.recordOutputs,
		functionId: telemetry == null ? void 0 : telemetry.functionId
	};
	const mergeTelemetryCallback = (key) => {
		const mergedIntegrationCallback = mergeCallbacks(...integrations.map((integration) => {
			var _a22;
			return (_a22 = integration[key]) == null ? void 0 : _a22.bind(integration);
		}).filter(Boolean).map((callback) => (event) => callback(augmentEvent(event, telemetryMetadata))));
		return async (event) => {
			await mergedIntegrationCallback(event);
		};
	};
	const executeLanguageModelCallWrappers = integrations.map((integration) => {
		var _a22;
		return (_a22 = integration.executeLanguageModelCall) == null ? void 0 : _a22.bind(integration);
	}).filter(Boolean);
	const executeToolWrappers = integrations.map((integration) => {
		var _a22;
		return (_a22 = integration.executeTool) == null ? void 0 : _a22.bind(integration);
	}).filter(Boolean);
	return {
		runInTracingChannelSpan: async ({ type, event, execute }) => await runWithTracingChannelSpan({
			type,
			event: augmentEvent(event, telemetryMetadata)
		}, execute),
		startTracingChannelContext: ({ type, event, completion }) => openTelemetryChannelSpanContext({
			message: {
				type,
				event: augmentEvent(event, telemetryMetadata)
			},
			completion
		}),
		onStart: mergeTelemetryCallback("onStart"),
		onStepStart: mergeTelemetryCallback("onStepStart"),
		onLanguageModelCallStart: mergeTelemetryCallback("onLanguageModelCallStart"),
		onLanguageModelCallEnd: mergeTelemetryCallback("onLanguageModelCallEnd"),
		onToolExecutionStart: mergeTelemetryCallback("onToolExecutionStart"),
		onToolExecutionEnd: mergeTelemetryCallback("onToolExecutionEnd"),
		onStepEnd: mergeCallbacks(mergeTelemetryCallback("onStepEnd"), mergeTelemetryCallback("onStepFinish")),
		onObjectStepStart: mergeTelemetryCallback("onObjectStepStart"),
		onObjectStepEnd: mergeTelemetryCallback("onObjectStepEnd"),
		onEmbedStart: mergeTelemetryCallback("onEmbedStart"),
		onEmbedEnd: mergeTelemetryCallback("onEmbedEnd"),
		onRerankStart: mergeTelemetryCallback("onRerankStart"),
		onRerankEnd: mergeTelemetryCallback("onRerankEnd"),
		onEnd: mergeTelemetryCallback("onEnd"),
		onAbort: mergeTelemetryCallback("onAbort"),
		onError: mergeTelemetryCallback("onError"),
		/**
		* Runs provider calls inside integration-specific context so
		* auto-instrumented provider requests can be associated with model work.
		*/
		executeLanguageModelCall: async ({ execute, ...event }) => {
			const augmentedEvent = augmentEvent(event, telemetryMetadata);
			let wrappedExecute = execute;
			for (const executeWrapper of executeLanguageModelCallWrappers) {
				const innerExecute = wrappedExecute;
				wrappedExecute = () => executeWrapper({
					...augmentedEvent,
					execute: innerExecute
				});
			}
			return await runWithTracingChannelSpan({
				type: "languageModelCall",
				event: augmentedEvent
			}, wrappedExecute);
		},
		/**
		* Composes all `executeTool` wrappers around the original tool execution.
		* Each wrapper receives an `execute` function that calls the next wrapper in
		* the chain, so integrations can establish nested telemetry context before
		* delegating to the underlying tool.
		*/
		executeTool: async ({ execute, ...event }) => {
			const augmentedEvent = augmentEvent(event, telemetryMetadata);
			let wrappedExecute = execute;
			for (const executeWrapper of executeToolWrappers) {
				const innerExecute = wrappedExecute;
				wrappedExecute = () => executeWrapper({
					...augmentedEvent,
					execute: innerExecute
				});
			}
			return await wrappedExecute();
		}
	};
}
function asReasoningText(reasoningParts) {
	const reasoningText = reasoningParts.map((part) => "text" in part ? part.text : "").join("");
	return reasoningText.length > 0 ? reasoningText : void 0;
}
var DefaultStepResult = class {
	constructor({ callId, stepNumber, provider, modelId, runtimeContext, toolsContext, content, finishReason, rawFinishReason, usage, performance, warnings, request, response, providerMetadata }) {
		this.callId = callId;
		this.stepNumber = stepNumber;
		this.model = {
			provider,
			modelId
		};
		this.runtimeContext = runtimeContext;
		this.toolsContext = toolsContext;
		this.content = content;
		this.finishReason = finishReason;
		this.rawFinishReason = rawFinishReason;
		this.usage = usage;
		this.performance = performance;
		this.warnings = warnings;
		this.request = request;
		this.response = response;
		this.providerMetadata = providerMetadata;
	}
	get text() {
		return this.content.filter((part) => part.type === "text").map((part) => part.text).join("");
	}
	get reasoning() {
		return convertFromReasoningOutputs(this.content.filter((part) => part.type === "reasoning" || part.type === "reasoning-file"));
	}
	get reasoningText() {
		return asReasoningText(this.reasoning);
	}
	get files() {
		return this.content.filter((part) => part.type === "file").map((part) => part.file);
	}
	get sources() {
		return this.content.filter((part) => part.type === "source");
	}
	get toolCalls() {
		return this.content.filter((part) => part.type === "tool-call");
	}
	get staticToolCalls() {
		return this.toolCalls.filter((toolCall) => toolCall.dynamic !== true);
	}
	get dynamicToolCalls() {
		return this.toolCalls.filter((toolCall) => toolCall.dynamic === true);
	}
	get toolResults() {
		return this.content.filter((part) => part.type === "tool-result");
	}
	get staticToolResults() {
		return this.toolResults.filter((toolResult) => toolResult.dynamic !== true);
	}
	get dynamicToolResults() {
		return this.toolResults.filter((toolResult) => toolResult.dynamic === true);
	}
};
function filterIncludedContext({ context, includeContext }) {
	if (context == null) return {};
	return Object.fromEntries(Object.entries(context).filter(([key]) => (includeContext == null ? void 0 : includeContext[key]) === true));
}
function restrictStepResult({ step, includeRuntimeContext, includeToolsContext }) {
	return new DefaultStepResult({
		callId: step.callId,
		stepNumber: step.stepNumber,
		provider: step.model.provider,
		modelId: step.model.modelId,
		runtimeContext: filterIncludedContext({
			context: step.runtimeContext,
			includeContext: includeRuntimeContext
		}),
		toolsContext: filterToolsContext({
			toolsContext: step.toolsContext,
			includeToolsContext
		}),
		content: step.content,
		finishReason: step.finishReason,
		rawFinishReason: step.rawFinishReason,
		usage: step.usage,
		performance: step.performance,
		warnings: step.warnings,
		request: step.request,
		response: step.response,
		providerMetadata: step.providerMetadata
	});
}
function filterToolsContext({ toolsContext, includeToolsContext }) {
	if (includeToolsContext == null) return {};
	return Object.fromEntries(Object.entries(toolsContext).map(([toolName, toolContext]) => [toolName, filterToolContext({
		toolName,
		toolContext,
		includeToolsContext
	})]));
}
function filterToolContext({ toolName, toolContext, includeToolsContext }) {
	return filterIncludedContext({
		context: toolContext,
		includeContext: includeToolsContext == null ? void 0 : includeToolsContext[toolName]
	});
}
function createRestrictedTelemetryDispatcher({ telemetry, includeRuntimeContext, includeToolsContext }) {
	const telemetryDispatcher = createTelemetryDispatcher({ telemetry });
	return {
		...telemetryDispatcher,
		onStart: (event) => {
			var _a22;
			return (_a22 = telemetryDispatcher.onStart) == null ? void 0 : _a22.call(telemetryDispatcher, {
				...event,
				runtimeContext: filterIncludedContext({
					context: event.runtimeContext,
					includeContext: includeRuntimeContext
				}),
				toolsContext: filterToolsContext({
					toolsContext: event.toolsContext,
					includeToolsContext
				})
			});
		},
		onStepStart: (event) => {
			var _a22;
			return (_a22 = telemetryDispatcher.onStepStart) == null ? void 0 : _a22.call(telemetryDispatcher, {
				...event,
				runtimeContext: filterIncludedContext({
					context: event.runtimeContext,
					includeContext: includeRuntimeContext
				}),
				steps: event.steps.map((step) => restrictStepResult({
					step,
					includeRuntimeContext,
					includeToolsContext
				})),
				toolsContext: filterToolsContext({
					toolsContext: event.toolsContext,
					includeToolsContext
				})
			});
		},
		onStepEnd: (event) => {
			var _a22;
			return (_a22 = telemetryDispatcher.onStepEnd) == null ? void 0 : _a22.call(telemetryDispatcher, restrictStepResult({
				step: event,
				includeRuntimeContext,
				includeToolsContext
			}));
		},
		onStepFinish: (event) => {
			var _a22;
			return (_a22 = telemetryDispatcher.onStepEnd) == null ? void 0 : _a22.call(telemetryDispatcher, restrictStepResult({
				step: event,
				includeRuntimeContext,
				includeToolsContext
			}));
		},
		onEnd: (event) => {
			var _a22;
			return (_a22 = telemetryDispatcher.onEnd) == null ? void 0 : _a22.call(telemetryDispatcher, ((restrictedSteps) => {
				return {
					...event,
					runtimeContext: filterIncludedContext({
						context: event.runtimeContext,
						includeContext: includeRuntimeContext
					}),
					steps: restrictedSteps,
					finalStep: restrictedSteps.at(-1),
					toolsContext: filterToolsContext({
						toolsContext: event.toolsContext,
						includeToolsContext
					})
				};
			})(event.steps.map((step) => restrictStepResult({
				step,
				includeRuntimeContext,
				includeToolsContext
			}))));
		},
		onAbort: (event) => {
			var _a22;
			return (_a22 = telemetryDispatcher.onAbort) == null ? void 0 : _a22.call(telemetryDispatcher, {
				...event,
				steps: event.steps.map((step) => restrictStepResult({
					step,
					includeRuntimeContext,
					includeToolsContext
				}))
			});
		},
		onToolExecutionStart: (event) => {
			var _a22;
			return (_a22 = telemetryDispatcher.onToolExecutionStart) == null ? void 0 : _a22.call(telemetryDispatcher, {
				...event,
				toolContext: filterToolContext({
					toolName: event.toolCall.toolName,
					toolContext: event.toolContext,
					includeToolsContext
				})
			});
		},
		onToolExecutionEnd: (event) => {
			var _a22;
			return (_a22 = telemetryDispatcher.onToolExecutionEnd) == null ? void 0 : _a22.call(telemetryDispatcher, {
				...event,
				toolContext: filterToolContext({
					toolName: event.toolCall.toolName,
					toolContext: event.toolContext,
					includeToolsContext
				})
			});
		}
	};
}
function isStepCount(stepCount) {
	return ({ steps }) => steps.length === stepCount;
}
async function isStopConditionMet({ stopConditions, steps }) {
	return (await Promise.all(stopConditions.map((condition) => condition({ steps })))).some((result) => result);
}
function sumTokenCounts(tokenCount1, tokenCount2) {
	return tokenCount1 == null && tokenCount2 == null ? void 0 : (tokenCount1 != null ? tokenCount1 : 0) + (tokenCount2 != null ? tokenCount2 : 0);
}
async function toResponseMessages({ content: inputContent, tools }) {
	const responseMessages = [];
	const toolCallOrder = /* @__PURE__ */ new Map();
	const content = [];
	for (const part of inputContent) {
		if (part.type === "source") continue;
		if ((part.type === "tool-result" || part.type === "tool-error") && !part.providerExecuted) continue;
		if (part.type === "text" && part.text.length === 0) continue;
		switch (part.type) {
			case "text":
				content.push({
					type: "text",
					text: part.text,
					providerOptions: part.providerMetadata
				});
				break;
			case "custom":
				content.push({
					type: "custom",
					kind: part.kind,
					providerOptions: part.providerMetadata
				});
				break;
			case "reasoning":
				content.push({
					type: "reasoning",
					text: part.text,
					providerOptions: part.providerMetadata
				});
				break;
			case "file":
				content.push({
					type: "file",
					data: part.file.base64,
					mediaType: part.file.mediaType,
					providerOptions: part.providerMetadata
				});
				break;
			case "reasoning-file":
				content.push({
					type: "reasoning-file",
					data: part.file.base64,
					mediaType: part.file.mediaType,
					providerOptions: part.providerMetadata
				});
				break;
			case "tool-call":
				if (!toolCallOrder.has(part.toolCallId)) toolCallOrder.set(part.toolCallId, toolCallOrder.size);
				content.push({
					type: "tool-call",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: part.invalid && typeof part.input !== "object" ? {} : part.input,
					providerExecuted: part.providerExecuted,
					providerOptions: part.providerMetadata
				});
				break;
			case "tool-result": {
				const output = await createToolModelOutput({
					toolCallId: part.toolCallId,
					input: part.input,
					tool: tools == null ? void 0 : tools[part.toolName],
					output: part.output,
					errorMode: "none"
				});
				content.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					output,
					providerOptions: part.providerMetadata
				});
				break;
			}
			case "tool-error": {
				const output = await createToolModelOutput({
					toolCallId: part.toolCallId,
					input: part.input,
					tool: tools == null ? void 0 : tools[part.toolName],
					output: part.error,
					errorMode: "json"
				});
				content.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					output,
					providerOptions: part.providerMetadata
				});
				break;
			}
			case "tool-approval-request":
				content.push({
					type: "tool-approval-request",
					approvalId: part.approvalId,
					toolCallId: part.toolCall.toolCallId,
					isAutomatic: part.isAutomatic,
					...part.signature != null ? { signature: part.signature } : {}
				});
				break;
		}
	}
	if (content.length > 0) responseMessages.push({
		role: "assistant",
		content
	});
	const toolResultContent = [];
	for (const part of inputContent) {
		if (part.type !== "tool-approval-response" && part.type !== "tool-result" && part.type !== "tool-error") continue;
		if (part.type === "tool-approval-response") {
			toolResultContent.push({
				type: "tool-approval-response",
				approvalId: part.approvalId,
				approved: part.approved,
				reason: part.reason,
				providerExecuted: part.providerExecuted
			});
			if (part.approved === false) toolResultContent.push({
				type: "tool-result",
				toolCallId: part.toolCall.toolCallId,
				toolName: part.toolCall.toolName,
				output: {
					type: "execution-denied",
					reason: part.reason
				}
			});
			continue;
		}
		if (part.providerExecuted) continue;
		const output = await createToolModelOutput({
			toolCallId: part.toolCallId,
			input: part.input,
			tool: tools == null ? void 0 : tools[part.toolName],
			output: part.type === "tool-result" ? part.output : part.error,
			errorMode: part.type === "tool-error" ? "text" : "none"
		});
		toolResultContent.push({
			type: "tool-result",
			toolCallId: part.toolCallId,
			toolName: part.toolName,
			output,
			...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
		});
	}
	if (toolResultContent.length > 0) responseMessages.push({
		role: "tool",
		content: sortToolResultContentByToolCallOrder({
			toolResultContent,
			toolCallOrder
		})
	});
	return responseMessages;
}
function sortToolResultContentByToolCallOrder({ toolResultContent, toolCallOrder }) {
	const sortedToolResults = toolResultContent.filter((part) => part.type === "tool-result").map((part, index) => ({
		part,
		index
	})).sort((a, b) => {
		const aOrder = toolCallOrder.get(a.part.toolCallId);
		const bOrder = toolCallOrder.get(b.part.toolCallId);
		if (aOrder == null && bOrder == null) return a.index - b.index;
		if (aOrder == null) return 1;
		if (bOrder == null) return -1;
		return aOrder - bOrder || a.index - b.index;
	}).map(({ part }) => part);
	let toolResultIndex = 0;
	return toolResultContent.map((part) => part.type === "tool-result" ? sortedToolResults[toolResultIndex++] : part);
}
var encoder = new TextEncoder();
function canonicalJSON(value) {
	if (value === null || value === void 0) return JSON.stringify(value);
	if (typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
	return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJSON(value[k])}`).join(",")}}`;
}
function toBase64url(bytes) {
	return convertUint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64url(str) {
	return convertBase64ToUint8Array(str);
}
async function importKey(secret) {
	const keyData = typeof secret === "string" ? encoder.encode(secret) : secret;
	return crypto.subtle.importKey("raw", keyData, {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign", "verify"]);
}
async function hashInput(input) {
	const canonical = canonicalJSON(input);
	const digest = await crypto.subtle.digest("SHA-256", encoder.encode(canonical));
	return toBase64url(new Uint8Array(digest));
}
function buildPayload(approvalId, toolCallId, toolName, inputDigest) {
	return encoder.encode(`${approvalId}
${toolCallId}
${toolName}
${inputDigest}`);
}
async function signToolApproval({ secret, approvalId, toolCallId, toolName, input }) {
	const key = await importKey(secret);
	const payload = buildPayload(approvalId, toolCallId, toolName, await hashInput(input));
	const sig = await crypto.subtle.sign("HMAC", key, payload);
	return toBase64url(new Uint8Array(sig));
}
async function verifyToolApprovalSignature({ secret, signature, approvalId, toolCallId, toolName, input }) {
	const key = await importKey(secret);
	const payload = buildPayload(approvalId, toolCallId, toolName, await hashInput(input));
	const sigBytes = fromBase64url(signature);
	return crypto.subtle.verify("HMAC", key, sigBytes, payload);
}
async function maybeSignApproval({ secret, approvalId, toolCallId, toolName, input }) {
	if (secret == null) return void 0;
	return signToolApproval({
		secret,
		approvalId,
		toolCallId,
		toolName,
		input
	});
}
async function validateApprovedToolApprovals({ approvedToolApprovals, tools, toolApproval, messages, toolsContext, runtimeContext, toolApprovalSecret }) {
	var _a22;
	const approved = [];
	const denied = [];
	for (const approval of approvedToolApprovals) {
		const { toolCall, approvalRequest } = approval;
		const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
		if (toolApprovalSecret != null) {
			if (approvalRequest.signature == null) throw new InvalidToolApprovalSignatureError({
				approvalId: approvalRequest.approvalId,
				toolCallId: toolCall.toolCallId,
				reason: "missing signature"
			});
			if (!await verifyToolApprovalSignature({
				secret: toolApprovalSecret,
				signature: approvalRequest.signature,
				approvalId: approvalRequest.approvalId,
				toolCallId: toolCall.toolCallId,
				toolName: toolCall.toolName,
				input: toolCall.input
			})) throw new InvalidToolApprovalSignatureError({
				approvalId: approvalRequest.approvalId,
				toolCallId: toolCall.toolCallId,
				reason: "invalid signature"
			});
		}
		if (isExecutableTool(tool2) && tool2.inputSchema != null) {
			const validation = await safeValidateTypes({
				value: toolCall.input,
				schema: asSchema(tool2.inputSchema)
			});
			if (!validation.success) throw new InvalidToolInputError({
				toolName: toolCall.toolName,
				toolInput: JSON.stringify(toolCall.input),
				cause: validation.error
			});
		}
		const approvalStatus = await resolveToolApproval({
			tools,
			toolApproval,
			toolCall,
			messages,
			toolsContext,
			runtimeContext
		});
		if (approvalStatus.type === "denied") denied.push({
			...approval,
			approvalResponse: {
				...approval.approvalResponse,
				approved: false,
				reason: (_a22 = approvalStatus.reason) != null ? _a22 : approval.approvalResponse.reason
			}
		});
		else approved.push(approval);
	}
	return {
		approvedToolApprovals: approved,
		deniedToolApprovals: denied
	};
}
var originalGenerateId = createIdGenerator({
	prefix: "aitxt",
	size: 24
});
var originalGenerateCallId = createIdGenerator({
	prefix: "call",
	size: 24
});
async function generateText({ model: modelArg, tools, toolChoice, instructions, system, prompt, messages, allowSystemInMessages, maxRetries: maxRetriesArg, abortSignal, timeout, headers, stopWhen = isStepCount(1), experimental_sandbox: sandbox, output, toolApproval, experimental_toolApprovalSecret, experimental_telemetry, telemetry = experimental_telemetry, providerOptions, activeTools, toolOrder, prepareStep, experimental_repairToolCall: repairToolCall, experimental_refineToolInput: refineToolInput, experimental_download: download2, runtimeContext = {}, toolsContext = {}, experimental_include, include = experimental_include, _internal: { generateId: generateId2 = originalGenerateId, generateCallId = originalGenerateCallId, now: now2 = now } = {}, onStart, experimental_onStart, onStepStart, experimental_onStepStart, onLanguageModelCallStart, experimental_onLanguageModelCallStart, onLanguageModelCallEnd, experimental_onLanguageModelCallEnd, onToolExecutionStart, onToolExecutionEnd, experimental_onToolCallStart, experimental_onToolCallFinish, onStepEnd, onStepFinish, onFinish, onEnd = onFinish, ...settings }) {
	var _a22, _b, _c, _d;
	include = {
		requestBody: (_a22 = include == null ? void 0 : include.requestBody) != null ? _a22 : false,
		requestMessages: (_b = include == null ? void 0 : include.requestMessages) != null ? _b : false,
		responseBody: (_c = include == null ? void 0 : include.responseBody) != null ? _c : false
	};
	const model = resolveLanguageModel(modelArg);
	const stopConditions = asArray(stopWhen);
	const resolvedOnStart = onStart != null ? onStart : experimental_onStart;
	const resolvedOnStepStart = onStepStart != null ? onStepStart : experimental_onStepStart;
	const resolvedOnLanguageModelCallStart = onLanguageModelCallStart != null ? onLanguageModelCallStart : experimental_onLanguageModelCallStart;
	const resolvedOnLanguageModelCallEnd = onLanguageModelCallEnd != null ? onLanguageModelCallEnd : experimental_onLanguageModelCallEnd;
	const resolvedOnToolExecutionStart = onToolExecutionStart != null ? onToolExecutionStart : experimental_onToolCallStart;
	const resolvedOnToolExecutionEnd = onToolExecutionEnd != null ? onToolExecutionEnd : experimental_onToolCallFinish;
	const resolvedOnStepEnd = onStepEnd != null ? onStepEnd : onStepFinish;
	const totalTimeoutMs = getTotalTimeoutMs(timeout);
	const stepTimeoutMs = getStepTimeoutMs(timeout);
	const stepAbortController = stepTimeoutMs != null ? new AbortController() : void 0;
	const mergedAbortSignal = mergeAbortSignals(abortSignal, totalTimeoutMs, stepAbortController == null ? void 0 : stepAbortController.signal);
	const { maxRetries, retry } = prepareRetries({
		maxRetries: maxRetriesArg,
		abortSignal: mergedAbortSignal
	});
	const callSettings = prepareLanguageModelCallOptions(settings);
	const headersWithUserAgent = withUserAgentSuffix(headers != null ? headers : {}, `ai/${VERSION}`);
	const initialPrompt = await standardizePrompt({
		instructions,
		system,
		prompt,
		messages,
		allowSystemInMessages
	});
	const callId = generateCallId();
	const telemetryDispatcher = createRestrictedTelemetryDispatcher({
		telemetry,
		includeRuntimeContext: telemetry == null ? void 0 : telemetry.includeRuntimeContext,
		includeToolsContext: telemetry == null ? void 0 : telemetry.includeToolsContext
	});
	const runInTracingChannelSpan = (_d = telemetryDispatcher.runInTracingChannelSpan) != null ? _d : async ({ execute }) => await execute();
	const generateTextStartEvent = {
		callId,
		operationId: "ai.generateText",
		provider: model.provider,
		modelId: model.modelId,
		instructions: initialPrompt.instructions,
		messages: initialPrompt.messages,
		tools,
		toolChoice,
		activeTools,
		toolOrder,
		maxOutputTokens: callSettings.maxOutputTokens,
		temperature: callSettings.temperature,
		topP: callSettings.topP,
		topK: callSettings.topK,
		presencePenalty: callSettings.presencePenalty,
		frequencyPenalty: callSettings.frequencyPenalty,
		stopSequences: callSettings.stopSequences,
		seed: callSettings.seed,
		reasoning: callSettings.reasoning,
		maxRetries,
		timeout,
		headers: headersWithUserAgent,
		providerOptions,
		output,
		runtimeContext,
		toolsContext
	};
	const executeGenerateText = async () => {
		var _a23;
		await notify({
			event: generateTextStartEvent,
			callbacks: [resolvedOnStart, telemetryDispatcher.onStart]
		});
		try {
			const initialMessages = initialPrompt.messages;
			const initialResponseMessages = [];
			const { approvedToolApprovals, deniedToolApprovals: collectedDeniedToolApprovals } = collectToolApprovals({ messages: initialMessages });
			const { approvedToolApprovals: localApprovedToolApprovals, deniedToolApprovals: revalidationDeniedToolApprovals } = await validateApprovedToolApprovals({
				approvedToolApprovals: approvedToolApprovals.filter((toolApproval2) => !toolApproval2.toolCall.providerExecuted),
				tools,
				toolApproval,
				messages: initialMessages,
				toolsContext,
				runtimeContext,
				toolApprovalSecret: experimental_toolApprovalSecret
			});
			const deniedToolApprovals = [...collectedDeniedToolApprovals, ...revalidationDeniedToolApprovals];
			if (deniedToolApprovals.length > 0 || localApprovedToolApprovals.length > 0) {
				const toolResults2 = await executeTools({
					toolCalls: localApprovedToolApprovals.map((toolApproval2) => toolApproval2.toolCall),
					tools,
					callId,
					messages: initialMessages,
					abortSignal: mergedAbortSignal,
					timeout,
					experimental_sandbox: sandbox,
					toolsContext,
					onToolExecutionStart: (event) => notify({
						event,
						callbacks: [resolvedOnToolExecutionStart, telemetryDispatcher.onToolExecutionStart]
					}),
					onToolExecutionEnd: (event) => notify({
						event,
						callbacks: [resolvedOnToolExecutionEnd, telemetryDispatcher.onToolExecutionEnd]
					}),
					executeToolInTelemetryContext: telemetryDispatcher.executeTool,
					runInTracingChannelSpan
				});
				const toolContent = [];
				for (const result of toolResults2) {
					const output2 = result.output;
					const modelOutput = await createToolModelOutput({
						toolCallId: output2.toolCallId,
						input: output2.input,
						tool: tools == null ? void 0 : tools[output2.toolName],
						output: output2.type === "tool-result" ? output2.output : output2.error,
						errorMode: output2.type === "tool-error" ? "text" : "none"
					});
					toolContent.push({
						type: "tool-result",
						toolCallId: output2.toolCallId,
						toolName: output2.toolName,
						output: modelOutput
					});
				}
				for (const toolApproval2 of deniedToolApprovals) toolContent.push({
					type: "tool-result",
					toolCallId: toolApproval2.toolCall.toolCallId,
					toolName: toolApproval2.toolCall.toolName,
					output: {
						type: "execution-denied",
						reason: toolApproval2.approvalResponse.reason,
						...toolApproval2.toolCall.providerExecuted && { providerOptions: { openai: { approvalId: toolApproval2.approvalResponse.approvalId } } }
					}
				});
				initialResponseMessages.push({
					role: "tool",
					content: toolContent
				});
			}
			const callSettings2 = prepareLanguageModelCallOptions(settings);
			let currentModelResponse;
			let clientToolCalls = [];
			let clientToolOutputs = [];
			let toolApprovalResponses = [];
			let deniedToolApprovalResponses = [];
			const steps = [];
			let instructionsForNextStep = initialPrompt.instructions;
			let messagesForNextStep = [...initialMessages, ...initialResponseMessages];
			const pendingDeferredToolCalls = /* @__PURE__ */ new Map();
			do {
				const stepTimeoutId = setAbortTimeout({
					abortController: stepAbortController,
					label: "Step",
					timeoutMs: stepTimeoutMs
				});
				const stepNumber = steps.length;
				try {
					await runInTracingChannelSpan({
						type: "step",
						event: {
							callId,
							stepNumber
						},
						execute: async () => {
							var _a24, _b2, _c2, _d2, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
							const accumulatedResponseMessages = [...initialResponseMessages, ...steps.flatMap((step) => step.response.messages)];
							const stepInputMessages = messagesForNextStep;
							const prepareStepResult = await (prepareStep == null ? void 0 : prepareStep({
								model,
								steps,
								stepNumber: steps.length,
								instructions: instructionsForNextStep,
								initialInstructions: initialPrompt.instructions,
								messages: stepInputMessages,
								initialMessages,
								responseMessages: accumulatedResponseMessages,
								runtimeContext,
								toolsContext,
								experimental_sandbox: sandbox
							}));
							const stepSandbox = (_a24 = prepareStepResult == null ? void 0 : prepareStepResult.experimental_sandbox) != null ? _a24 : sandbox;
							const stepModel = resolveLanguageModel((_b2 = prepareStepResult == null ? void 0 : prepareStepResult.model) != null ? _b2 : model);
							const stepInstructions = (_d2 = (_c2 = prepareStepResult == null ? void 0 : prepareStepResult.instructions) != null ? _c2 : prepareStepResult == null ? void 0 : prepareStepResult.system) != null ? _d2 : instructionsForNextStep;
							const promptMessages = await convertToLanguageModelPrompt({
								prompt: {
									instructions: stepInstructions,
									messages: (_e = prepareStepResult == null ? void 0 : prepareStepResult.messages) != null ? _e : stepInputMessages
								},
								supportedUrls: await stepModel.supportedUrls,
								download: download2,
								provider: stepModel.provider.split(".")[0]
							});
							runtimeContext = (_f = prepareStepResult == null ? void 0 : prepareStepResult.runtimeContext) != null ? _f : runtimeContext;
							toolsContext = (_g = prepareStepResult == null ? void 0 : prepareStepResult.toolsContext) != null ? _g : toolsContext;
							const stepActiveTools = filterActiveTools({
								tools,
								activeTools: (_h = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _h : activeTools
							});
							const stepToolOrder = (_i = prepareStepResult == null ? void 0 : prepareStepResult.toolOrder) != null ? _i : toolOrder;
							const stepTools = await prepareTools({
								tools: stepActiveTools,
								toolOrder: stepToolOrder,
								toolsContext,
								experimental_sandbox: stepSandbox
							});
							const stepToolChoice = prepareToolChoice({ toolChoice: (_j = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _j : toolChoice });
							const stepMessages = (_k = prepareStepResult == null ? void 0 : prepareStepResult.messages) != null ? _k : stepInputMessages;
							const stepProviderOptions = mergeObjects(providerOptions, prepareStepResult == null ? void 0 : prepareStepResult.providerOptions);
							await notify({
								event: {
									callId,
									provider: stepModel.provider,
									modelId: stepModel.modelId,
									stepNumber,
									instructions: stepInstructions,
									messages: stepMessages,
									tools,
									toolChoice: (_l = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _l : toolChoice,
									activeTools: (_m = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _m : activeTools,
									toolOrder: stepToolOrder,
									steps: [...steps],
									providerOptions: stepProviderOptions,
									output,
									runtimeContext,
									promptMessages,
									stepTools,
									stepToolChoice,
									toolsContext
								},
								callbacks: [resolvedOnStepStart, telemetryDispatcher.onStepStart]
							});
							const languageModelCallContext = {
								provider: stepModel.provider,
								modelId: stepModel.modelId,
								instructions: stepInstructions,
								messages: stepMessages,
								tools: stepTools,
								...callSettings2
							};
							const languageModelCallStartEvent = {
								callId,
								...languageModelCallContext
							};
							const stepStartTimestampMs = now2();
							await notify({
								event: languageModelCallStartEvent,
								callbacks: [resolvedOnLanguageModelCallStart, telemetryDispatcher.onLanguageModelCallStart]
							});
							const executeLanguageModelCallInTelemetryContext = (_n = telemetryDispatcher.executeLanguageModelCall) != null ? _n : async ({ execute }) => await execute();
							currentModelResponse = await retry(async () => {
								var _a25, _b3, _c3, _d3, _e2, _f2, _g2, _h2;
								const result = await executeLanguageModelCallInTelemetryContext({
									...languageModelCallStartEvent,
									execute: async () => await stepModel.doGenerate({
										...callSettings2,
										tools: stepTools,
										toolChoice: stepToolChoice,
										responseFormat: await (output == null ? void 0 : output.responseFormat),
										prompt: promptMessages,
										providerOptions: stepProviderOptions,
										abortSignal: mergedAbortSignal,
										headers: headersWithUserAgent
									})
								});
								const responseData = {
									id: (_b3 = (_a25 = result.response) == null ? void 0 : _a25.id) != null ? _b3 : generateId2(),
									timestamp: (_d3 = (_c3 = result.response) == null ? void 0 : _c3.timestamp) != null ? _d3 : /* @__PURE__ */ new Date(),
									modelId: (_f2 = (_e2 = result.response) == null ? void 0 : _e2.modelId) != null ? _f2 : stepModel.modelId,
									headers: (_g2 = result.response) == null ? void 0 : _g2.headers,
									body: (_h2 = result.response) == null ? void 0 : _h2.body
								};
								return {
									...result,
									response: responseData
								};
							});
							const responseTimeMs = now2() - stepStartTimestampMs;
							const stepUsage = asLanguageModelUsage(currentModelResponse.usage);
							const stepToolCalls = await Promise.all(currentModelResponse.content.filter((part) => part.type === "tool-call").map((toolCall) => parseToolCall({
								toolCall,
								tools,
								repairToolCall,
								refineToolInput,
								instructions: stepInstructions,
								messages: stepMessages
							})));
							const toolApprovalRequests = {};
							const stepToolApprovalResponses = {};
							const blockedToolCallIds = /* @__PURE__ */ new Set();
							const modelCallContent = asContent({
								content: currentModelResponse.content,
								toolCalls: stepToolCalls,
								toolOutputs: [],
								toolApprovalRequests: [],
								toolApprovalResponses: [],
								tools
							});
							await notify({
								event: {
									callId,
									provider: stepModel.provider,
									modelId: stepModel.modelId,
									finishReason: currentModelResponse.finishReason.unified,
									usage: stepUsage,
									content: modelCallContent,
									responseId: currentModelResponse.response.id,
									performance: {
										responseTimeMs,
										effectiveOutputTokensPerSecond: calculateTokensPerSecond({
											tokens: stepUsage.outputTokens,
											durationMs: responseTimeMs
										}),
										outputTokensPerSecond: void 0,
										inputTokensPerSecond: void 0,
										effectiveTotalTokensPerSecond: calculateTokensPerSecond({
											tokens: sumTokenCounts(stepUsage.inputTokens, stepUsage.outputTokens),
											durationMs: responseTimeMs
										}),
										timeToFirstOutputMs: void 0
									}
								},
								callbacks: [resolvedOnLanguageModelCallEnd, telemetryDispatcher.onLanguageModelCallEnd]
							});
							for (const toolCall of stepToolCalls) {
								if (toolCall.invalid) continue;
								const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
								if (tool2 == null) continue;
								if ((tool2 == null ? void 0 : tool2.onInputAvailable) != null) await tool2.onInputAvailable({
									input: toolCall.input,
									toolCallId: toolCall.toolCallId,
									messages: stepMessages,
									abortSignal: mergedAbortSignal,
									context: runtimeContext
								});
								const toolApprovalStatus = await resolveToolApproval({
									tools,
									toolApproval,
									toolCall,
									messages: stepMessages,
									toolsContext,
									runtimeContext
								});
								if (toolApprovalStatus.type === "not-applicable") continue;
								const approvalId = generateId2();
								const signature = await maybeSignApproval({
									secret: experimental_toolApprovalSecret,
									approvalId,
									toolCallId: toolCall.toolCallId,
									toolName: toolCall.toolName,
									input: toolCall.input
								});
								switch (toolApprovalStatus.type) {
									case "user-approval":
										toolApprovalRequests[toolCall.toolCallId] = {
											type: "tool-approval-request",
											approvalId,
											toolCall,
											...signature != null ? { signature } : {}
										};
										blockedToolCallIds.add(toolCall.toolCallId);
										break;
									case "approved":
										toolApprovalRequests[toolCall.toolCallId] = {
											type: "tool-approval-request",
											approvalId,
											toolCall,
											isAutomatic: true,
											...signature != null ? { signature } : {}
										};
										stepToolApprovalResponses[toolCall.toolCallId] = {
											type: "tool-approval-response",
											approvalId,
											toolCall,
											approved: true,
											reason: toolApprovalStatus.reason,
											providerExecuted: toolCall.providerExecuted
										};
										break;
									case "denied":
										toolApprovalRequests[toolCall.toolCallId] = {
											type: "tool-approval-request",
											approvalId,
											toolCall,
											isAutomatic: true,
											...signature != null ? { signature } : {}
										};
										stepToolApprovalResponses[toolCall.toolCallId] = {
											type: "tool-approval-response",
											approvalId,
											toolCall,
											approved: false,
											reason: toolApprovalStatus.reason,
											providerExecuted: toolCall.providerExecuted
										};
										blockedToolCallIds.add(toolCall.toolCallId);
										break;
								}
							}
							const invalidToolCalls = stepToolCalls.filter((toolCall) => toolCall.invalid && toolCall.dynamic);
							clientToolOutputs = [];
							for (const toolCall of invalidToolCalls) clientToolOutputs.push({
								type: "tool-error",
								toolCallId: toolCall.toolCallId,
								toolName: toolCall.toolName,
								input: toolCall.input,
								error: getErrorMessage(toolCall.error),
								dynamic: true
							});
							clientToolCalls = stepToolCalls.filter((toolCall) => !toolCall.providerExecuted);
							toolApprovalResponses = Object.values(stepToolApprovalResponses);
							deniedToolApprovalResponses = toolApprovalResponses.filter((toolApprovalResponse) => toolApprovalResponse.approved === false);
							const toolExecutionMs = {};
							if (tools != null) {
								const toolExecutionResults = await executeTools({
									toolCalls: clientToolCalls.filter((toolCall) => !toolCall.invalid && !blockedToolCallIds.has(toolCall.toolCallId)),
									tools,
									callId,
									messages: stepMessages,
									abortSignal: mergedAbortSignal,
									timeout,
									experimental_sandbox: stepSandbox,
									toolsContext,
									onToolExecutionStart: (event) => notify({
										event,
										callbacks: [resolvedOnToolExecutionStart, telemetryDispatcher.onToolExecutionStart]
									}),
									onToolExecutionEnd: (event) => notify({
										event,
										callbacks: [resolvedOnToolExecutionEnd, telemetryDispatcher.onToolExecutionEnd]
									}),
									executeToolInTelemetryContext: telemetryDispatcher.executeTool,
									runInTracingChannelSpan
								});
								for (const result of toolExecutionResults) {
									toolExecutionMs[result.output.toolCallId] = result.toolExecutionMs;
									clientToolOutputs.push(result.output);
								}
							}
							const stepTimeMs = now2() - stepStartTimestampMs;
							const stepPerformance = {
								effectiveOutputTokensPerSecond: calculateTokensPerSecond({
									tokens: stepUsage.outputTokens,
									durationMs: responseTimeMs
								}),
								outputTokensPerSecond: void 0,
								inputTokensPerSecond: void 0,
								effectiveTotalTokensPerSecond: calculateTokensPerSecond({
									tokens: sumTokenCounts(stepUsage.inputTokens, stepUsage.outputTokens),
									durationMs: responseTimeMs
								}),
								stepTimeMs,
								responseTimeMs,
								toolExecutionMs,
								timeToFirstOutputMs: void 0
							};
							for (const toolCall of stepToolCalls) {
								if (!toolCall.providerExecuted) continue;
								const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
								if ((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults) {
									if (!currentModelResponse.content.some((part) => part.type === "tool-result" && part.toolCallId === toolCall.toolCallId)) pendingDeferredToolCalls.set(toolCall.toolCallId, { toolName: toolCall.toolName });
								}
							}
							for (const part of currentModelResponse.content) if (part.type === "tool-result") pendingDeferredToolCalls.delete(part.toolCallId);
							const stepContent = asContent({
								content: currentModelResponse.content,
								toolCalls: stepToolCalls,
								toolOutputs: clientToolOutputs,
								toolApprovalRequests: Object.values(toolApprovalRequests),
								toolApprovalResponses,
								tools
							});
							const stepResponseMessages = await toResponseMessages({
								content: stepContent,
								tools
							});
							const stepRequest = {
								...currentModelResponse.request,
								body: include.requestBody ? (_o = currentModelResponse.request) == null ? void 0 : _o.body : void 0,
								messages: include.requestMessages ? cloneModelMessages(stepMessages) : void 0
							};
							const stepResponse = {
								...currentModelResponse.response,
								messages: cloneModelMessages(stepResponseMessages),
								body: include.responseBody ? (_p = currentModelResponse.response) == null ? void 0 : _p.body : void 0
							};
							const currentStepResult = new DefaultStepResult({
								callId,
								stepNumber,
								provider: stepModel.provider,
								modelId: stepModel.modelId,
								runtimeContext,
								content: stepContent,
								finishReason: currentModelResponse.finishReason.unified,
								rawFinishReason: currentModelResponse.finishReason.raw,
								usage: stepUsage,
								performance: stepPerformance,
								warnings: currentModelResponse.warnings,
								providerMetadata: currentModelResponse.providerMetadata,
								request: stepRequest,
								response: stepResponse,
								toolsContext
							});
							logWarnings({
								warnings: (_q = currentModelResponse.warnings) != null ? _q : [],
								provider: stepModel.provider,
								model: stepModel.modelId
							});
							steps.push(currentStepResult);
							instructionsForNextStep = stepInstructions;
							messagesForNextStep = [...stepMessages, ...stepResponseMessages];
							await notify({
								event: currentStepResult,
								callbacks: [resolvedOnStepEnd, telemetryDispatcher.onStepEnd]
							});
							return currentStepResult;
						}
					});
				} finally {
					if (stepTimeoutId != null) clearTimeout(stepTimeoutId);
				}
			} while ((clientToolCalls.length > 0 && clientToolOutputs.length + deniedToolApprovalResponses.length === clientToolCalls.length || pendingDeferredToolCalls.size > 0) && !await isStopConditionMet({
				stopConditions,
				steps
			}));
			const lastStep = steps[steps.length - 1];
			const totalUsage = steps.reduce((totalUsage2, step) => {
				return addLanguageModelUsage(totalUsage2, step.usage);
			}, {
				inputTokens: void 0,
				inputTokenDetails: {
					noCacheTokens: void 0,
					cacheReadTokens: void 0,
					cacheWriteTokens: void 0
				},
				outputTokens: void 0,
				outputTokenDetails: {
					textTokens: void 0,
					reasoningTokens: void 0
				},
				totalTokens: void 0
			});
			const files = steps.flatMap((step) => step.files);
			const sources = steps.flatMap((step) => step.sources);
			const toolCalls = steps.flatMap((step) => step.toolCalls);
			const staticToolCalls = steps.flatMap((step) => step.staticToolCalls);
			const dynamicToolCalls = steps.flatMap((step) => step.dynamicToolCalls);
			const toolResults = steps.flatMap((step) => step.toolResults);
			const staticToolResults = steps.flatMap((step) => step.staticToolResults);
			const dynamicToolResults = steps.flatMap((step) => step.dynamicToolResults);
			const warnings = steps.flatMap((step) => {
				var _a24;
				return (_a24 = step.warnings) != null ? _a24 : [];
			});
			await notify({
				event: {
					callId,
					stepNumber: lastStep.stepNumber,
					model: lastStep.model,
					runtimeContext: lastStep.runtimeContext,
					finishReason: lastStep.finishReason,
					rawFinishReason: lastStep.rawFinishReason,
					usage: totalUsage,
					totalUsage,
					content: steps.flatMap((step) => step.content),
					text: lastStep.text,
					reasoning: lastStep.reasoning,
					reasoningText: lastStep.reasoningText,
					files,
					sources,
					toolCalls,
					staticToolCalls,
					dynamicToolCalls,
					toolResults,
					staticToolResults,
					dynamicToolResults,
					responseMessages: [...initialResponseMessages, ...steps.flatMap((step) => step.response.messages)],
					warnings,
					request: lastStep.request,
					response: lastStep.response,
					providerMetadata: lastStep.providerMetadata,
					steps,
					finalStep: lastStep,
					toolsContext
				},
				callbacks: [onEnd, telemetryDispatcher.onEnd]
			});
			let resolvedOutput;
			if (lastStep.finishReason === "stop") resolvedOutput = await (output != null ? output : text()).parseCompleteOutput({ text: lastStep.text }, {
				response: lastStep.response,
				usage: lastStep.usage,
				finishReason: lastStep.finishReason
			});
			return new DefaultGenerateTextResult({
				initialResponseMessages,
				steps,
				totalUsage,
				output: resolvedOutput
			});
		} catch (error) {
			await ((_a23 = telemetryDispatcher.onError) == null ? void 0 : _a23.call(telemetryDispatcher, {
				callId,
				error
			}));
			throw wrapGatewayError(error);
		}
	};
	return await runInTracingChannelSpan({
		type: "generateText",
		event: generateTextStartEvent,
		execute: executeGenerateText
	});
}
async function executeTools({ toolCalls, tools, callId, messages, abortSignal, timeout, experimental_sandbox: sandbox, toolsContext, onToolExecutionStart, onToolExecutionEnd, executeToolInTelemetryContext, runInTracingChannelSpan }) {
	return (await Promise.all(toolCalls.map(async (toolCall) => await executeToolCall({
		toolCall,
		tools,
		callId,
		messages,
		abortSignal,
		timeout,
		experimental_sandbox: sandbox,
		toolsContext,
		onToolExecutionStart,
		onToolExecutionEnd,
		executeToolInTelemetryContext,
		runInTracingChannelSpan
	})))).filter((result) => result != null);
}
var DefaultGenerateTextResult = class {
	constructor(options) {
		this.initialResponseMessages = options.initialResponseMessages;
		this.steps = options.steps;
		this._output = options.output;
		this.totalUsage = options.totalUsage;
	}
	get finalStep() {
		return this.steps.at(-1);
	}
	get content() {
		return this.steps.flatMap((step) => step.content);
	}
	get text() {
		return this.finalStep.text;
	}
	get files() {
		return this.steps.flatMap((step) => step.files);
	}
	get reasoningText() {
		return this.finalStep.reasoningText;
	}
	get reasoning() {
		return convertToReasoningOutputs(this.finalStep.reasoning);
	}
	get toolCalls() {
		return this.steps.flatMap((step) => step.toolCalls);
	}
	get staticToolCalls() {
		return this.steps.flatMap((step) => step.staticToolCalls);
	}
	get dynamicToolCalls() {
		return this.steps.flatMap((step) => step.dynamicToolCalls);
	}
	get toolResults() {
		return this.steps.flatMap((step) => step.toolResults);
	}
	get staticToolResults() {
		return this.steps.flatMap((step) => step.staticToolResults);
	}
	get dynamicToolResults() {
		return this.steps.flatMap((step) => step.dynamicToolResults);
	}
	get sources() {
		return this.steps.flatMap((step) => step.sources);
	}
	get finishReason() {
		return this.finalStep.finishReason;
	}
	get rawFinishReason() {
		return this.finalStep.rawFinishReason;
	}
	get warnings() {
		return this.steps.flatMap((step) => {
			var _a22;
			return (_a22 = step.warnings) != null ? _a22 : [];
		});
	}
	get providerMetadata() {
		return this.finalStep.providerMetadata;
	}
	get response() {
		return this.finalStep.response;
	}
	get responseMessages() {
		return [...this.initialResponseMessages, ...this.steps.flatMap((step) => step.response.messages)];
	}
	get request() {
		return this.finalStep.request;
	}
	get usage() {
		return this.totalUsage;
	}
	get output() {
		if (this._output == null) throw new NoOutputGeneratedError();
		return this._output;
	}
};
function asContent({ content, toolCalls, toolOutputs, toolApprovalRequests, toolApprovalResponses, tools }) {
	const contentParts = [];
	const toolOutputsWithApprovalResponses = [];
	const toolOutputsWithoutApprovalResponses = [];
	const toolCallIdsWithApprovalResponses = new Set(toolApprovalResponses.map((toolApprovalResponse) => toolApprovalResponse.toolCall.toolCallId));
	for (const part of content) switch (part.type) {
		case "text":
		case "reasoning":
		case "custom":
		case "source":
			contentParts.push(part);
			break;
		case "file":
		case "reasoning-file":
			contentParts.push({
				type: part.type,
				file: new DefaultGeneratedFile({
					data: part.data.type === "data" ? part.data.data : part.data.url.toString(),
					mediaType: part.mediaType
				}),
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			});
			break;
		case "tool-call":
			contentParts.push(toolCalls.find((toolCall) => toolCall.toolCallId === part.toolCallId));
			break;
		case "tool-result": {
			const toolCall = toolCalls.find((toolCall2) => toolCall2.toolCallId === part.toolCallId);
			if (toolCall == null) {
				const tool2 = tools == null ? void 0 : tools[part.toolName];
				if (!((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults)) throw new Error(`Tool call ${part.toolCallId} not found.`);
				if (part.isError) contentParts.push({
					type: "tool-error",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: void 0,
					error: part.result,
					providerExecuted: true,
					dynamic: part.dynamic,
					...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
					...(tool2 == null ? void 0 : tool2.metadata) != null ? { toolMetadata: tool2.metadata } : {}
				});
				else contentParts.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: void 0,
					output: part.result,
					providerExecuted: true,
					dynamic: part.dynamic,
					...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
					...(tool2 == null ? void 0 : tool2.metadata) != null ? { toolMetadata: tool2.metadata } : {}
				});
				break;
			}
			if (part.isError) contentParts.push({
				type: "tool-error",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: toolCall.input,
				error: part.result,
				providerExecuted: true,
				dynamic: toolCall.dynamic,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
			});
			else contentParts.push({
				type: "tool-result",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: toolCall.input,
				output: part.result,
				providerExecuted: true,
				dynamic: toolCall.dynamic,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
			});
			break;
		}
		case "tool-approval-request": {
			const toolCall = toolCalls.find((toolCall2) => toolCall2.toolCallId === part.toolCallId);
			if (toolCall == null) throw new ToolCallNotFoundForApprovalError({
				toolCallId: part.toolCallId,
				approvalId: part.approvalId
			});
			contentParts.push({
				type: "tool-approval-request",
				approvalId: part.approvalId,
				toolCall
			});
			break;
		}
	}
	for (const toolOutput of toolOutputs) if (toolCallIdsWithApprovalResponses.has(toolOutput.toolCallId)) toolOutputsWithApprovalResponses.push(toolOutput);
	else toolOutputsWithoutApprovalResponses.push(toolOutput);
	return [
		...contentParts,
		...toolOutputsWithoutApprovalResponses,
		...toolApprovalRequests,
		...toolApprovalResponses,
		...toolOutputsWithApprovalResponses
	];
}
function prepareHeaders(headers, defaultHeaders) {
	const responseHeaders = new Headers(headers != null ? headers : {});
	for (const [key, value] of Object.entries(defaultHeaders)) if (!responseHeaders.has(key)) responseHeaders.set(key, value);
	return responseHeaders;
}
function createTextStreamResponse({ status, statusText, headers, stream }) {
	return new Response(stream.pipeThrough(new TextEncoderStream()), {
		status: status != null ? status : 200,
		statusText,
		headers: prepareHeaders(headers, { "content-type": "text/plain; charset=utf-8" })
	});
}
function writeToServerResponse({ response, status, statusText, headers, stream }) {
	const statusCode = status != null ? status : 200;
	if (statusText !== void 0) response.writeHead(statusCode, statusText, headers);
	else response.writeHead(statusCode, headers);
	const reader = stream.getReader();
	const read = async () => {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (!response.write(value)) await new Promise((resolve3) => {
					response.once("drain", resolve3);
				});
			}
		} catch (error) {
			throw error;
		} finally {
			response.end();
		}
	};
	read();
}
function pipeTextStreamToResponse({ response, status, statusText, headers, stream }) {
	writeToServerResponse({
		response,
		status,
		statusText,
		headers: Object.fromEntries(prepareHeaders(headers, { "content-type": "text/plain; charset=utf-8" }).entries()),
		stream: stream.pipeThrough(new TextEncoderStream())
	});
}
function toTextStream({ stream }) {
	return stream.pipeThrough(new TransformStream({ transform(part, controller) {
		if (part.type === "text-delta") controller.enqueue(part.text);
	} }));
}
var JsonToSseTransformStream = class extends TransformStream {
	constructor() {
		super({
			transform(part, controller) {
				controller.enqueue(`data: ${JSON.stringify(part)}

`);
			},
			flush(controller) {
				controller.enqueue("data: [DONE]\n\n");
			}
		});
	}
};
var UI_MESSAGE_STREAM_HEADERS = {
	"content-type": "text/event-stream",
	"cache-control": "no-cache",
	connection: "keep-alive",
	"x-vercel-ai-ui-message-stream": "v1",
	"x-accel-buffering": "no"
};
function createUIMessageStreamResponse({ status, statusText, headers, stream, consumeSseStream }) {
	let sseStream = stream.pipeThrough(new JsonToSseTransformStream());
	if (consumeSseStream) {
		const [stream1, stream2] = sseStream.tee();
		sseStream = stream1;
		consumeSseStream({ stream: stream2 });
	}
	return new Response(sseStream.pipeThrough(new TextEncoderStream()), {
		status,
		statusText,
		headers: prepareHeaders(headers, UI_MESSAGE_STREAM_HEADERS)
	});
}
function pipeUIMessageStreamToResponse({ response, status, statusText, headers, stream, consumeSseStream }) {
	let sseStream = stream.pipeThrough(new JsonToSseTransformStream());
	if (consumeSseStream) {
		const [stream1, stream2] = sseStream.tee();
		sseStream = stream1;
		consumeSseStream({ stream: stream2 });
	}
	writeToServerResponse({
		response,
		status,
		statusText,
		headers: Object.fromEntries(prepareHeaders(headers, UI_MESSAGE_STREAM_HEADERS).entries()),
		stream: sseStream.pipeThrough(new TextEncoderStream())
	});
}
function getResponseUIMessageId({ originalMessages, responseMessageId }) {
	if (originalMessages == null) return;
	const lastMessage = originalMessages[originalMessages.length - 1];
	return (lastMessage == null ? void 0 : lastMessage.role) === "assistant" ? lastMessage.id : typeof responseMessageId === "function" ? responseMessageId() : responseMessageId;
}
var toolMetadataSchema = record(string(), jsonValueSchema.optional());
lazySchema(() => zodSchema(union([
	strictObject({
		type: literal("text-start"),
		id: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("text-delta"),
		id: string(),
		delta: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("text-end"),
		id: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("error"),
		errorText: string()
	}),
	strictObject({
		type: literal("tool-input-start"),
		toolCallId: string(),
		toolName: string(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: boolean().optional(),
		title: string().optional()
	}),
	strictObject({
		type: literal("tool-input-delta"),
		toolCallId: string(),
		inputTextDelta: string()
	}),
	strictObject({
		type: literal("tool-input-available"),
		toolCallId: string(),
		toolName: string(),
		input: unknown(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: boolean().optional(),
		title: string().optional()
	}),
	strictObject({
		type: literal("tool-input-error"),
		toolCallId: string(),
		toolName: string(),
		input: unknown(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: boolean().optional(),
		errorText: string(),
		title: string().optional()
	}),
	strictObject({
		type: literal("tool-approval-request"),
		approvalId: string(),
		toolCallId: string(),
		isAutomatic: boolean().optional(),
		signature: string().optional()
	}),
	strictObject({
		type: literal("tool-approval-response"),
		approvalId: string(),
		approved: boolean(),
		reason: string().optional(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("tool-output-available"),
		toolCallId: string(),
		output: unknown(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: boolean().optional(),
		preliminary: boolean().optional()
	}),
	strictObject({
		type: literal("tool-output-error"),
		toolCallId: string(),
		errorText: string(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: boolean().optional()
	}),
	strictObject({
		type: literal("tool-output-denied"),
		toolCallId: string()
	}),
	strictObject({
		type: literal("reasoning-start"),
		id: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("reasoning-delta"),
		id: string(),
		delta: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("reasoning-end"),
		id: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("custom"),
		kind: string().transform((value) => value),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("source-url"),
		sourceId: string(),
		url: string(),
		title: string().optional(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("source-document"),
		sourceId: string(),
		mediaType: string(),
		title: string(),
		filename: string().optional(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("file"),
		url: string(),
		mediaType: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("reasoning-file"),
		url: string(),
		mediaType: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: custom((value) => typeof value === "string" && value.startsWith("data-"), { message: "Type must start with \"data-\"" }),
		id: string().optional(),
		data: unknown(),
		transient: boolean().optional()
	}),
	strictObject({ type: literal("start-step") }),
	strictObject({ type: literal("finish-step") }),
	strictObject({
		type: literal("start"),
		messageId: string().optional(),
		messageMetadata: unknown().optional()
	}),
	strictObject({
		type: literal("finish"),
		finishReason: _enum([
			"stop",
			"length",
			"content-filter",
			"tool-calls",
			"error",
			"other"
		]).optional(),
		messageMetadata: unknown().optional()
	}),
	strictObject({
		type: literal("abort"),
		reason: string().optional()
	}),
	strictObject({
		type: literal("message-metadata"),
		messageMetadata: unknown()
	})
])));
function isDataUIMessageChunk(chunk) {
	return chunk.type.startsWith("data-");
}
function createIdMap() {
	return /* @__PURE__ */ Object.create(null);
}
function isStaticToolUIPart(part) {
	return part.type.startsWith("tool-");
}
function isDynamicToolUIPart(part) {
	return part.type === "dynamic-tool";
}
function isToolUIPart(part) {
	return isStaticToolUIPart(part) || isDynamicToolUIPart(part);
}
function getStaticToolName(part) {
	return part.type.split("-").slice(1).join("-");
}
function createStreamingUIMessageState({ lastMessage, messageId }) {
	return {
		message: (lastMessage == null ? void 0 : lastMessage.role) === "assistant" ? lastMessage : {
			id: messageId,
			metadata: void 0,
			role: "assistant",
			parts: []
		},
		activeTextParts: createIdMap(),
		activeReasoningParts: createIdMap(),
		partialToolCalls: createIdMap()
	};
}
function processUIMessageStream({ stream, messageMetadataSchema, dataPartSchemas, runUpdateMessageJob, onError, onToolCall, onData }) {
	return stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
		await runUpdateMessageJob(async ({ state, write }) => {
			var _a22, _b, _c, _d;
			function getToolInvocation(toolCallId) {
				const toolInvocation = state.message.parts.filter(isToolUIPart).find((invocation) => invocation.toolCallId === toolCallId);
				if (toolInvocation == null) throw new UIMessageStreamError({
					chunkType: "tool-invocation",
					chunkId: toolCallId,
					message: `No tool invocation found for tool call ID "${toolCallId}".`
				});
				return toolInvocation;
			}
			function getToolInvocationByApprovalId(approvalId) {
				const toolInvocation = state.message.parts.filter(isToolUIPart).find((invocation) => {
					var _a23;
					return ((_a23 = invocation.approval) == null ? void 0 : _a23.id) === approvalId;
				});
				if (toolInvocation == null) throw new UIMessageStreamError({
					chunkType: "tool-approval-response",
					chunkId: approvalId,
					message: `No tool invocation found for approval ID "${approvalId}".`
				});
				return toolInvocation;
			}
			function updateToolPart(options) {
				var _a23;
				const part = state.message.parts.find((part2) => isStaticToolUIPart(part2) && part2.toolCallId === options.toolCallId);
				const anyOptions = options;
				const anyPart = part;
				if (part != null) {
					part.state = options.state;
					anyPart.input = anyOptions.input;
					anyPart.output = anyOptions.output;
					anyPart.errorText = anyOptions.errorText;
					anyPart.rawInput = anyOptions.rawInput;
					anyPart.preliminary = anyOptions.preliminary;
					if (options.title !== void 0) anyPart.title = options.title;
					if (options.toolMetadata !== void 0) anyPart.toolMetadata = options.toolMetadata;
					anyPart.providerExecuted = (_a23 = anyOptions.providerExecuted) != null ? _a23 : part.providerExecuted;
					const providerMetadata = anyOptions.providerMetadata;
					if (providerMetadata != null) if (options.state === "output-available" || options.state === "output-error") {
						const resultPart = part;
						resultPart.resultProviderMetadata = providerMetadata;
					} else part.callProviderMetadata = providerMetadata;
				} else state.message.parts.push({
					type: `tool-${options.toolName}`,
					toolCallId: options.toolCallId,
					state: options.state,
					title: options.title,
					...options.toolMetadata !== void 0 ? { toolMetadata: options.toolMetadata } : {},
					input: anyOptions.input,
					output: anyOptions.output,
					rawInput: anyOptions.rawInput,
					errorText: anyOptions.errorText,
					providerExecuted: anyOptions.providerExecuted,
					preliminary: anyOptions.preliminary,
					...anyOptions.providerMetadata != null && (options.state === "output-available" || options.state === "output-error") ? { resultProviderMetadata: anyOptions.providerMetadata } : {},
					...anyOptions.providerMetadata != null && !(options.state === "output-available" || options.state === "output-error") ? { callProviderMetadata: anyOptions.providerMetadata } : {}
				});
			}
			function updateDynamicToolPart(options) {
				var _a23, _b2;
				const part = state.message.parts.find((part2) => part2.type === "dynamic-tool" && part2.toolCallId === options.toolCallId);
				const anyOptions = options;
				const anyPart = part;
				if (part != null) {
					part.state = options.state;
					anyPart.toolName = options.toolName;
					anyPart.input = anyOptions.input;
					anyPart.output = anyOptions.output;
					anyPart.errorText = anyOptions.errorText;
					anyPart.rawInput = (_a23 = anyOptions.rawInput) != null ? _a23 : anyPart.rawInput;
					anyPart.preliminary = anyOptions.preliminary;
					if (options.title !== void 0) anyPart.title = options.title;
					if (options.toolMetadata !== void 0) anyPart.toolMetadata = options.toolMetadata;
					anyPart.providerExecuted = (_b2 = anyOptions.providerExecuted) != null ? _b2 : part.providerExecuted;
					const providerMetadata = anyOptions.providerMetadata;
					if (providerMetadata != null) if (options.state === "output-available" || options.state === "output-error") {
						const resultPart = part;
						resultPart.resultProviderMetadata = providerMetadata;
					} else part.callProviderMetadata = providerMetadata;
				} else state.message.parts.push({
					type: "dynamic-tool",
					toolName: options.toolName,
					toolCallId: options.toolCallId,
					state: options.state,
					input: anyOptions.input,
					output: anyOptions.output,
					errorText: anyOptions.errorText,
					preliminary: anyOptions.preliminary,
					providerExecuted: anyOptions.providerExecuted,
					title: options.title,
					...options.toolMetadata !== void 0 ? { toolMetadata: options.toolMetadata } : {},
					...anyOptions.providerMetadata != null && (options.state === "output-available" || options.state === "output-error") ? { resultProviderMetadata: anyOptions.providerMetadata } : {},
					...anyOptions.providerMetadata != null && !(options.state === "output-available" || options.state === "output-error") ? { callProviderMetadata: anyOptions.providerMetadata } : {}
				});
			}
			async function updateMessageMetadata(metadata) {
				if (metadata != null) {
					const mergedMetadata = state.message.metadata != null ? mergeObjects(state.message.metadata, metadata) : metadata;
					if (messageMetadataSchema != null) await validateTypes({
						value: mergedMetadata,
						schema: messageMetadataSchema,
						context: {
							field: "message.metadata",
							entityId: state.message.id
						}
					});
					state.message.metadata = mergedMetadata;
				}
			}
			switch (chunk.type) {
				case "text-start": {
					const textPart = {
						type: "text",
						text: "",
						providerMetadata: chunk.providerMetadata,
						state: "streaming"
					};
					state.activeTextParts[chunk.id] = textPart;
					state.message.parts.push(textPart);
					write();
					break;
				}
				case "text-delta": {
					const textPart = state.activeTextParts[chunk.id];
					if (textPart == null) throw new UIMessageStreamError({
						chunkType: "text-delta",
						chunkId: chunk.id,
						message: `Received text-delta for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-delta" chunks.`
					});
					textPart.text += chunk.delta;
					textPart.providerMetadata = (_a22 = chunk.providerMetadata) != null ? _a22 : textPart.providerMetadata;
					write();
					break;
				}
				case "text-end": {
					const textPart = state.activeTextParts[chunk.id];
					if (textPart == null) throw new UIMessageStreamError({
						chunkType: "text-end",
						chunkId: chunk.id,
						message: `Received text-end for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-end" chunks.`
					});
					textPart.state = "done";
					textPart.providerMetadata = (_b = chunk.providerMetadata) != null ? _b : textPart.providerMetadata;
					delete state.activeTextParts[chunk.id];
					write();
					break;
				}
				case "custom": {
					const customPart = {
						type: "custom",
						kind: chunk.kind,
						providerMetadata: chunk.providerMetadata
					};
					state.message.parts.push(customPart);
					write();
					break;
				}
				case "reasoning-start": {
					const reasoningPart = {
						type: "reasoning",
						text: "",
						providerMetadata: chunk.providerMetadata,
						state: "streaming"
					};
					state.activeReasoningParts[chunk.id] = reasoningPart;
					state.message.parts.push(reasoningPart);
					write();
					break;
				}
				case "reasoning-delta": {
					const reasoningPart = state.activeReasoningParts[chunk.id];
					if (reasoningPart == null) throw new UIMessageStreamError({
						chunkType: "reasoning-delta",
						chunkId: chunk.id,
						message: `Received reasoning-delta for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-delta" chunks.`
					});
					reasoningPart.text += chunk.delta;
					reasoningPart.providerMetadata = (_c = chunk.providerMetadata) != null ? _c : reasoningPart.providerMetadata;
					write();
					break;
				}
				case "reasoning-end": {
					const reasoningPart = state.activeReasoningParts[chunk.id];
					if (reasoningPart == null) throw new UIMessageStreamError({
						chunkType: "reasoning-end",
						chunkId: chunk.id,
						message: `Received reasoning-end for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-end" chunks.`
					});
					reasoningPart.providerMetadata = (_d = chunk.providerMetadata) != null ? _d : reasoningPart.providerMetadata;
					reasoningPart.state = "done";
					delete state.activeReasoningParts[chunk.id];
					write();
					break;
				}
				case "file":
				case "reasoning-file":
					state.message.parts.push({
						type: chunk.type,
						mediaType: chunk.mediaType,
						url: chunk.url,
						...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {}
					});
					write();
					break;
				case "source-url":
					state.message.parts.push({
						type: "source-url",
						sourceId: chunk.sourceId,
						url: chunk.url,
						title: chunk.title,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				case "source-document":
					state.message.parts.push({
						type: "source-document",
						sourceId: chunk.sourceId,
						mediaType: chunk.mediaType,
						title: chunk.title,
						filename: chunk.filename,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				case "tool-input-start": {
					const toolInvocations = state.message.parts.filter(isStaticToolUIPart);
					state.partialToolCalls[chunk.toolCallId] = {
						text: "",
						toolName: chunk.toolName,
						index: toolInvocations.length,
						dynamic: chunk.dynamic,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata
					};
					if (chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-streaming",
						input: void 0,
						providerExecuted: chunk.providerExecuted,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata,
						providerMetadata: chunk.providerMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-streaming",
						input: void 0,
						providerExecuted: chunk.providerExecuted,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				}
				case "tool-input-delta": {
					const partialToolCall = state.partialToolCalls[chunk.toolCallId];
					if (partialToolCall == null) throw new UIMessageStreamError({
						chunkType: "tool-input-delta",
						chunkId: chunk.toolCallId,
						message: `Received tool-input-delta for missing tool call with ID "${chunk.toolCallId}". Ensure a "tool-input-start" chunk is sent before any "tool-input-delta" chunks.`
					});
					partialToolCall.text += chunk.inputTextDelta;
					const { value: partialArgs } = await parsePartialJson(partialToolCall.text);
					if (partialToolCall.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: partialToolCall.toolName,
						state: "input-streaming",
						input: partialArgs,
						title: partialToolCall.title,
						toolMetadata: partialToolCall.toolMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: partialToolCall.toolName,
						state: "input-streaming",
						input: partialArgs,
						title: partialToolCall.title,
						toolMetadata: partialToolCall.toolMetadata
					});
					write();
					break;
				}
				case "tool-input-available":
					if (chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-available",
						input: chunk.input,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-available",
						input: chunk.input,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata
					});
					write();
					if (onToolCall && !chunk.providerExecuted) await onToolCall({ toolCall: chunk });
					break;
				case "tool-input-error": {
					const existingPart = state.message.parts.filter(isToolUIPart).find((p) => p.toolCallId === chunk.toolCallId);
					if (existingPart != null ? existingPart.type === "dynamic-tool" : !!chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "output-error",
						input: chunk.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						toolMetadata: chunk.toolMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "output-error",
						input: void 0,
						rawInput: chunk.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						toolMetadata: chunk.toolMetadata
					});
					write();
					break;
				}
				case "tool-approval-request": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					toolInvocation.state = "approval-requested";
					toolInvocation.approval = {
						id: chunk.approvalId,
						...chunk.isAutomatic === true ? { isAutomatic: true } : {},
						...chunk.signature != null ? { signature: chunk.signature } : {}
					};
					write();
					break;
				}
				case "tool-approval-response": {
					const toolInvocation = getToolInvocationByApprovalId(chunk.approvalId);
					const approval = toolInvocation.approval == null ? { id: chunk.approvalId } : toolInvocation.approval;
					toolInvocation.state = "approval-responded";
					toolInvocation.approval = {
						id: chunk.approvalId,
						approved: chunk.approved,
						...chunk.reason != null ? { reason: chunk.reason } : {},
						...approval.isAutomatic === true ? { isAutomatic: true } : {}
					};
					if (chunk.providerExecuted != null) toolInvocation.providerExecuted = chunk.providerExecuted;
					if (chunk.providerMetadata != null) toolInvocation.callProviderMetadata = chunk.providerMetadata;
					write();
					break;
				}
				case "tool-output-denied": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					toolInvocation.state = "output-denied";
					write();
					break;
				}
				case "tool-output-available": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					if (toolInvocation.type === "dynamic-tool") updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: toolInvocation.toolName,
						state: "output-available",
						input: toolInvocation.input,
						output: chunk.output,
						preliminary: chunk.preliminary,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: toolInvocation.title,
						toolMetadata: toolInvocation.toolMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: getStaticToolName(toolInvocation),
						state: "output-available",
						input: toolInvocation.input,
						output: chunk.output,
						providerExecuted: chunk.providerExecuted,
						preliminary: chunk.preliminary,
						providerMetadata: chunk.providerMetadata,
						title: toolInvocation.title,
						toolMetadata: toolInvocation.toolMetadata
					});
					write();
					break;
				}
				case "tool-output-error": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					if (toolInvocation.type === "dynamic-tool") updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: toolInvocation.toolName,
						state: "output-error",
						input: toolInvocation.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: toolInvocation.title,
						toolMetadata: toolInvocation.toolMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: getStaticToolName(toolInvocation),
						state: "output-error",
						input: toolInvocation.input,
						rawInput: toolInvocation.rawInput,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: toolInvocation.title,
						toolMetadata: toolInvocation.toolMetadata
					});
					write();
					break;
				}
				case "start-step":
					state.message.parts.push({ type: "step-start" });
					break;
				case "finish-step":
					state.activeTextParts = createIdMap();
					state.activeReasoningParts = createIdMap();
					break;
				case "start":
					if (chunk.messageId != null) state.message.id = chunk.messageId;
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageId != null || chunk.messageMetadata != null) write();
					break;
				case "finish":
					if (chunk.finishReason != null) state.finishReason = chunk.finishReason;
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageMetadata != null) write();
					break;
				case "message-metadata":
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageMetadata != null) write();
					break;
				case "error":
					onError?.(new Error(chunk.errorText));
					break;
				default: if (isDataUIMessageChunk(chunk)) {
					if ((dataPartSchemas == null ? void 0 : dataPartSchemas[chunk.type]) != null) {
						const partIdx = state.message.parts.findIndex((p) => "id" in p && "data" in p && p.id === chunk.id && p.type === chunk.type);
						const actualPartIdx = partIdx >= 0 ? partIdx : state.message.parts.length;
						await validateTypes({
							value: chunk.data,
							schema: dataPartSchemas[chunk.type],
							context: {
								field: `message.parts[${actualPartIdx}].data`,
								entityName: chunk.type,
								entityId: chunk.id
							}
						});
					}
					const dataChunk = chunk;
					if (dataChunk.transient) {
						onData?.(dataChunk);
						break;
					}
					const existingUIPart = dataChunk.id != null ? state.message.parts.find((chunkArg) => dataChunk.type === chunkArg.type && dataChunk.id === chunkArg.id) : void 0;
					if (existingUIPart != null) existingUIPart.data = dataChunk.data;
					else state.message.parts.push(dataChunk);
					onData?.(dataChunk);
					write();
				}
			}
			controller.enqueue(chunk);
		});
	} }));
}
function handleUIMessageStreamFinish({ messageId, originalMessages = [], onStepEnd, onStepFinish, onEnd, onFinish, onError, stream }) {
	let lastMessage = originalMessages == null ? void 0 : originalMessages[originalMessages.length - 1];
	if ((lastMessage == null ? void 0 : lastMessage.role) !== "assistant") lastMessage = void 0;
	else messageId = lastMessage.id;
	let isAborted = false;
	const idInjectedStream = stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		if (chunk.type === "start") {
			const startChunk = chunk;
			if (startChunk.messageId == null && messageId != null) startChunk.messageId = messageId;
		}
		if (chunk.type === "abort") isAborted = true;
		controller.enqueue(chunk);
	} }));
	const resolvedOnStepEnd = onStepEnd != null ? onStepEnd : onStepFinish;
	const resolvedOnEnd = onEnd != null ? onEnd : onFinish;
	if (resolvedOnEnd == null && resolvedOnStepEnd == null) return idInjectedStream;
	const state = createStreamingUIMessageState({
		lastMessage: lastMessage ? structuredClone(lastMessage) : void 0,
		messageId: messageId != null ? messageId : ""
	});
	const runUpdateMessageJob = async (job) => {
		await job({
			state,
			write: () => {}
		});
	};
	let finishCalled = false;
	const callOnEnd = async () => {
		if (finishCalled || !resolvedOnEnd) return;
		finishCalled = true;
		const isContinuation = state.message.id === (lastMessage == null ? void 0 : lastMessage.id);
		await resolvedOnEnd({
			isAborted,
			isContinuation,
			responseMessage: state.message,
			messages: [...isContinuation ? originalMessages.slice(0, -1) : originalMessages, state.message],
			finishReason: state.finishReason
		});
	};
	const callOnStepFinish = async () => {
		if (!resolvedOnStepEnd) return;
		const isContinuation = state.message.id === (lastMessage == null ? void 0 : lastMessage.id);
		try {
			await resolvedOnStepEnd({
				isContinuation,
				responseMessage: structuredClone(state.message),
				messages: [...isContinuation ? originalMessages.slice(0, -1) : originalMessages, structuredClone(state.message)]
			});
		} catch (error) {
			onError(error);
		}
	};
	return processUIMessageStream({
		stream: idInjectedStream,
		runUpdateMessageJob,
		onError
	}).pipeThrough(new TransformStream({
		async transform(chunk, controller) {
			if (chunk.type === "finish-step") await callOnStepFinish();
			controller.enqueue(chunk);
		},
		async cancel() {
			await callOnEnd();
		},
		async flush() {
			await callOnEnd();
		}
	}));
}
function toUIMessageChunk(part, { tools, sendReasoning = true, sendSources = false, sendStart = true, sendFinish = true, onError = () => "An error occurred.", messageMetadata, responseMessageId } = {}) {
	const isDynamic = (toolPart) => {
		const tool2 = tools == null ? void 0 : tools[toolPart.toolName];
		if (tool2 == null) return toolPart.dynamic;
		return (tool2 == null ? void 0 : tool2.type) === "dynamic" ? true : void 0;
	};
	const partType = part.type;
	switch (partType) {
		case "text-start": return {
			type: "text-start",
			id: part.id,
			...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
		};
		case "text-delta": return {
			type: "text-delta",
			id: part.id,
			delta: part.text,
			...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
		};
		case "text-end": return {
			type: "text-end",
			id: part.id,
			...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
		};
		case "reasoning-start":
		case "reasoning-end":
			if (!sendReasoning) return;
			return {
				type: partType,
				id: part.id,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
		case "reasoning-delta":
			if (!sendReasoning) return;
			return {
				type: "reasoning-delta",
				id: part.id,
				delta: part.text,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
		case "file":
		case "reasoning-file":
			if (partType === "reasoning-file" && !sendReasoning) return;
			return {
				type: part.type,
				mediaType: part.file.mediaType,
				url: `data:${part.file.mediaType};base64,${part.file.base64}`,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
		case "source":
			if (!sendSources) return;
			if (part.sourceType === "url") return {
				type: "source-url",
				sourceId: part.id,
				url: part.url,
				title: part.title,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
			if (part.sourceType === "document") return {
				type: "source-document",
				sourceId: part.id,
				mediaType: part.mediaType,
				title: part.title,
				filename: part.filename,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
			return;
		case "custom": return {
			type: "custom",
			kind: part.kind,
			...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
		};
		case "tool-input-start": {
			const dynamic = isDynamic(part);
			return {
				type: "tool-input-start",
				toolCallId: part.id,
				toolName: part.toolName,
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...dynamic != null ? { dynamic } : {},
				...part.title != null ? { title: part.title } : {}
			};
		}
		case "tool-input-delta": return {
			type: "tool-input-delta",
			toolCallId: part.id,
			inputTextDelta: part.delta
		};
		case "tool-call": {
			const dynamic = isDynamic(part);
			if (part.invalid) return {
				type: "tool-input-error",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: part.input,
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...dynamic != null ? { dynamic } : {},
				errorText: onError(part.error),
				...part.title != null ? { title: part.title } : {}
			};
			return {
				type: "tool-input-available",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: part.input,
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...dynamic != null ? { dynamic } : {},
				...part.title != null ? { title: part.title } : {}
			};
		}
		case "tool-approval-request": return {
			type: "tool-approval-request",
			approvalId: part.approvalId,
			toolCallId: part.toolCall.toolCallId,
			...part.isAutomatic != null ? { isAutomatic: part.isAutomatic } : {},
			...part.signature != null ? { signature: part.signature } : {}
		};
		case "tool-approval-response": return {
			type: "tool-approval-response",
			approvalId: part.approvalId,
			approved: part.approved,
			...part.reason != null ? { reason: part.reason } : {},
			...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {}
		};
		case "tool-result": {
			const dynamic = isDynamic(part);
			return {
				type: "tool-output-available",
				toolCallId: part.toolCallId,
				output: part.output === void 0 ? null : part.output,
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...part.preliminary != null ? { preliminary: part.preliminary } : {},
				...dynamic != null ? { dynamic } : {}
			};
		}
		case "tool-error": {
			const dynamic = isDynamic(part);
			return {
				type: "tool-output-error",
				toolCallId: part.toolCallId,
				errorText: part.providerExecuted ? typeof part.error === "string" ? part.error : JSON.stringify(part.error) : onError(part.error),
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...dynamic != null ? { dynamic } : {}
			};
		}
		case "tool-output-denied": return {
			type: "tool-output-denied",
			toolCallId: part.toolCallId
		};
		case "error": return {
			type: "error",
			errorText: onError(part.error)
		};
		case "start-step": return { type: "start-step" };
		case "finish-step": return { type: "finish-step" };
		case "start":
			if (!sendStart) return;
			return {
				type: "start",
				...messageMetadata != null ? { messageMetadata } : {},
				...responseMessageId != null ? { messageId: responseMessageId } : {}
			};
		case "finish":
			if (!sendFinish) return;
			return {
				type: "finish",
				finishReason: part.finishReason,
				...messageMetadata != null ? { messageMetadata } : {}
			};
		case "abort": return part;
		case "tool-input-end":
		case "raw": return;
		default: throw new Error(`Unknown chunk type: ${partType}`);
	}
}
function toUIMessageStream({ stream, tools, sendReasoning = true, sendSources = false, sendStart = true, sendFinish = true, onError = () => "An error occurred.", messageMetadata, originalMessages, generateMessageId, onEnd, onFinish }) {
	const responseMessageId = generateMessageId != null ? getResponseUIMessageId({
		originalMessages,
		responseMessageId: generateMessageId
	}) : void 0;
	return handleUIMessageStreamFinish({
		stream: stream.pipeThrough(new TransformStream({ transform: async (part, controller) => {
			const messageMetadataValue = messageMetadata == null ? void 0 : messageMetadata({ part });
			const uiMessageChunk = toUIMessageChunk(part, {
				tools,
				sendReasoning,
				sendSources,
				sendStart,
				sendFinish,
				onError,
				messageMetadata: messageMetadataValue,
				responseMessageId
			});
			if (uiMessageChunk != null) controller.enqueue(uiMessageChunk);
			if (messageMetadataValue != null && part.type !== "start" && part.type !== "finish") controller.enqueue({
				type: "message-metadata",
				messageMetadata: messageMetadataValue
			});
		} })),
		messageId: responseMessageId != null ? responseMessageId : generateMessageId == null ? void 0 : generateMessageId(),
		originalMessages,
		onEnd: onEnd != null ? onEnd : onFinish,
		onError
	});
}
function createAsyncIterableStream(source) {
	return asAsyncIterableStream(source.pipeThrough(new TransformStream()));
}
function asAsyncIterableStream(stream) {
	stream[Symbol.asyncIterator] = function() {
		const reader = this.getReader();
		let finished = false;
		async function cleanup(cancelStream) {
			var _a22;
			if (finished) return;
			finished = true;
			try {
				if (cancelStream) await ((_a22 = reader.cancel) == null ? void 0 : _a22.call(reader));
			} finally {
				try {
					reader.releaseLock();
				} catch (e) {}
			}
		}
		return {
			/**
			* Reads the next chunk from the stream.
			* @returns A promise resolving to the next IteratorResult.
			*/
			async next() {
				if (finished) return {
					done: true,
					value: void 0
				};
				const { done, value } = await reader.read();
				if (done) {
					await cleanup(true);
					return {
						done: true,
						value: void 0
					};
				}
				return {
					done: false,
					value
				};
			},
			/**
			* May be called on early exit (e.g., break from for-await) or after completion.
			* Ensures the stream is cancelled and resources are released.
			* @returns A promise resolving to a completed IteratorResult.
			*/
			async return() {
				await cleanup(true);
				return {
					done: true,
					value: void 0
				};
			},
			/**
			* Called on early exit with error.
			* Ensures the stream is cancelled and resources are released, then rethrows the error.
			* @param err The error to throw.
			* @returns A promise that rejects with the provided error.
			*/
			async throw(err) {
				await cleanup(true);
				throw err;
			}
		};
	};
	return stream;
}
async function consumeStream({ stream, onError }) {
	const reader = stream.getReader();
	try {
		while (true) {
			const { done } = await reader.read();
			if (done) break;
		}
	} catch (error) {
		onError?.(error);
	} finally {
		reader.releaseLock();
	}
}
function createResolvablePromise() {
	let resolve3;
	let reject;
	return {
		promise: new Promise((res, rej) => {
			resolve3 = res;
			reject = rej;
		}),
		resolve: resolve3,
		reject
	};
}
function createStitchableStream() {
	let innerStreamReaders = [];
	let controller = null;
	let isClosed = false;
	let waitForNewStream = createResolvablePromise();
	const terminate = () => {
		isClosed = true;
		waitForNewStream.resolve();
		innerStreamReaders.forEach((reader) => reader.cancel());
		innerStreamReaders = [];
		controller?.close();
	};
	const processPull = async () => {
		if (isClosed && innerStreamReaders.length === 0) {
			controller?.close();
			return;
		}
		if (innerStreamReaders.length === 0) {
			waitForNewStream = createResolvablePromise();
			await waitForNewStream.promise;
			return await processPull();
		}
		try {
			const { value, done } = await innerStreamReaders[0].read();
			if (done) {
				innerStreamReaders.shift();
				if (innerStreamReaders.length === 0 && isClosed) controller?.close();
				else await processPull();
			} else controller?.enqueue(value);
		} catch (error) {
			controller?.error(error);
			innerStreamReaders.shift();
			terminate();
		}
	};
	return {
		stream: new ReadableStream({
			start(controllerParam) {
				controller = controllerParam;
			},
			pull: processPull,
			async cancel() {
				for (const reader of innerStreamReaders) await reader.cancel();
				innerStreamReaders = [];
				isClosed = true;
			}
		}),
		addStream: (innerStream) => {
			if (isClosed) throw new Error("Cannot add inner stream: outer stream is closed");
			innerStreamReaders.push(innerStream.getReader());
			waitForNewStream.resolve();
		},
		/**
		* Gracefully close the outer stream. This will let the inner streams
		* finish processing and then close the outer stream.
		*/
		close: () => {
			isClosed = true;
			waitForNewStream.resolve();
			if (innerStreamReaders.length === 0) controller?.close();
		},
		/**
		* Immediately close the outer stream. This will cancel all inner streams
		* and close the outer stream.
		*/
		terminate
	};
}
function executeToolsFromStream({ stream, tools, callId, messages, abortSignal, timeout, experimental_sandbox: sandbox, toolsContext, toolApproval, runtimeContext, toolApprovalSecret, generateId: generateId2, onToolExecutionStart, onToolExecutionEnd, executeToolInTelemetryContext, runInTracingChannelSpan }) {
	const toolCallsToExecute = [];
	return stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
		controller.enqueue(chunk);
		switch (chunk.type) {
			case "tool-call": {
				if (chunk.invalid) return;
				const tool2 = tools == null ? void 0 : tools[chunk.toolName];
				if (tool2 == null) return;
				const toolApprovalStatus = await resolveToolApproval({
					tools,
					toolCall: chunk,
					toolApproval,
					messages,
					toolsContext,
					runtimeContext
				});
				if (toolApprovalStatus.type === "not-applicable") {
					if (tool2.execute != null && chunk.providerExecuted !== true) toolCallsToExecute.push(chunk);
					return;
				}
				const approvalId = generateId2();
				const signature = await maybeSignApproval({
					secret: toolApprovalSecret,
					approvalId,
					toolCallId: chunk.toolCallId,
					toolName: chunk.toolName,
					input: chunk.input
				});
				switch (toolApprovalStatus.type) {
					case "user-approval":
						controller.enqueue({
							type: "tool-approval-request",
							approvalId,
							toolCall: chunk,
							...signature != null ? { signature } : {}
						});
						return;
					case "denied":
						controller.enqueue({
							type: "tool-approval-request",
							approvalId,
							toolCall: chunk,
							isAutomatic: true,
							...signature != null ? { signature } : {}
						});
						controller.enqueue({
							type: "tool-approval-response",
							approvalId,
							approved: false,
							toolCall: chunk,
							reason: toolApprovalStatus.reason,
							providerExecuted: chunk.providerExecuted
						});
						return;
					case "approved":
						controller.enqueue({
							type: "tool-approval-request",
							approvalId,
							toolCall: chunk,
							isAutomatic: true,
							...signature != null ? { signature } : {}
						});
						controller.enqueue({
							type: "tool-approval-response",
							approvalId,
							approved: true,
							toolCall: chunk,
							reason: toolApprovalStatus.reason,
							providerExecuted: chunk.providerExecuted
						});
						break;
				}
				if (tool2.execute != null && chunk.providerExecuted !== true) toolCallsToExecute.push(chunk);
				return;
			}
			case "model-call-end":
				await Promise.all(toolCallsToExecute.map(async (toolCall) => {
					try {
						const result = await executeToolCall({
							toolCall,
							tools,
							callId,
							messages,
							abortSignal,
							timeout,
							experimental_sandbox: sandbox,
							toolsContext,
							onToolExecutionStart,
							onToolExecutionEnd,
							executeToolInTelemetryContext,
							runInTracingChannelSpan,
							onPreliminaryToolResult: (result2) => {
								controller.enqueue(result2);
							}
						});
						if (result != null) {
							controller.enqueue({
								type: "tool-execution-end",
								toolCallId: result.output.toolCallId,
								toolExecutionMs: result.toolExecutionMs
							});
							controller.enqueue(result.output);
						}
					} catch (error) {
						controller.enqueue({
							type: "error",
							error
						});
					}
				}));
				return;
		}
	} }));
}
function invokeToolCallbacksFromStream({ stream, tools, stepInputMessages, abortSignal, runtimeContext }) {
	if (tools == null) return stream;
	const ongoingToolCallToolNames = {};
	return stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
		controller.enqueue(chunk);
		switch (chunk.type) {
			case "tool-input-start": {
				ongoingToolCallToolNames[chunk.id] = chunk.toolName;
				const tool2 = tools == null ? void 0 : tools[chunk.toolName];
				if ((tool2 == null ? void 0 : tool2.onInputStart) != null) await tool2.onInputStart({
					toolCallId: chunk.id,
					messages: stepInputMessages,
					abortSignal,
					context: runtimeContext
				});
				break;
			}
			case "tool-input-delta": {
				const toolName = ongoingToolCallToolNames[chunk.id];
				const tool2 = tools == null ? void 0 : tools[toolName];
				if ((tool2 == null ? void 0 : tool2.onInputDelta) != null) await tool2.onInputDelta({
					inputTextDelta: chunk.delta,
					toolCallId: chunk.id,
					messages: stepInputMessages,
					abortSignal,
					context: runtimeContext
				});
				break;
			}
			case "tool-call": {
				const toolName = ongoingToolCallToolNames[chunk.toolCallId];
				const tool2 = tools == null ? void 0 : tools[toolName];
				delete ongoingToolCallToolNames[chunk.toolCallId];
				if ((tool2 == null ? void 0 : tool2.onInputAvailable) != null) await tool2.onInputAvailable({
					input: chunk.input,
					toolCallId: chunk.toolCallId,
					messages: stepInputMessages,
					abortSignal,
					context: runtimeContext
				});
			}
		}
	} }));
}
var originalGenerateId2 = createIdGenerator({
	prefix: "aitxt",
	size: 24
});
var originalGenerateCallId2 = createIdGenerator({
	prefix: "call",
	size: 24
});
async function streamLanguageModelCall({ model, tools, toolOrder, output, toolChoice, prompt, system, instructions, messages, allowSystemInMessages, download: download2, abortSignal, headers, includeRawChunks, providerOptions, repairToolCall, refineToolInput, executeLanguageModelCallInTelemetryContext = async ({ execute }) => await execute(), callId, toolsContext, experimental_sandbox: sandbox, _internal: { generateId: generateId2 = originalGenerateId2, generateCallId = originalGenerateCallId2, now: now2 = now } = {}, onStart, onLanguageModelCallStart, onLanguageModelCallEnd, ...callSettings }) {
	const resolvedModel = resolveLanguageModel(model);
	const effectiveCallId = callId != null ? callId : generateCallId();
	const standardizedPrompt = await standardizePrompt({
		instructions,
		system,
		prompt,
		messages,
		allowSystemInMessages
	});
	const promptMessages = await convertToLanguageModelPrompt({
		prompt: {
			instructions: standardizedPrompt.instructions,
			messages: standardizedPrompt.messages
		},
		supportedUrls: await resolvedModel.supportedUrls,
		download: download2,
		provider: resolvedModel.provider.split(".")[0]
	});
	const stepTools = await prepareTools({
		tools,
		toolOrder,
		toolsContext,
		experimental_sandbox: sandbox
	});
	const stepToolChoice = prepareToolChoice({ toolChoice });
	await notify({
		event: { promptMessages },
		callbacks: onStart
	});
	const languageModelCallStartEvent = {
		callId: effectiveCallId,
		provider: resolvedModel.provider,
		modelId: resolvedModel.modelId,
		instructions: standardizedPrompt.instructions,
		messages: standardizedPrompt.messages,
		tools: stepTools,
		...callSettings
	};
	await notify({
		event: languageModelCallStartEvent,
		callbacks: onLanguageModelCallStart
	});
	const callStartTimestampMs = now2();
	const { stream: languageModelStream, response, request } = await executeLanguageModelCallInTelemetryContext({
		...languageModelCallStartEvent,
		execute: async () => await resolvedModel.doStream({
			...callSettings,
			tools: stepTools,
			toolChoice: stepToolChoice,
			responseFormat: await (output == null ? void 0 : output.responseFormat),
			prompt: promptMessages,
			providerOptions,
			abortSignal,
			headers,
			includeRawChunks
		})
	});
	return {
		stream: createAsyncIterableStream(languageModelStream.pipeThrough(createLanguageModelV4StreamPartToLanguageModelStreamPartTransform({
			tools,
			instructions: standardizedPrompt.instructions,
			messages: standardizedPrompt.messages,
			repairToolCall,
			refineToolInput,
			callId: effectiveCallId,
			provider: resolvedModel.provider,
			modelId: resolvedModel.modelId,
			generateId: generateId2,
			now: now2,
			callStartTimestampMs,
			onLanguageModelCallEnd
		}))),
		response,
		request
	};
}
function createLanguageModelV4StreamPartToLanguageModelStreamPartTransform({ tools, instructions, messages, repairToolCall, refineToolInput, callId, provider, modelId, generateId: generateId2, now: now2, callStartTimestampMs, onLanguageModelCallEnd }) {
	const toolCallsByToolCallId = /* @__PURE__ */ new Map();
	const modelCallContent = [];
	const textPartIndexes = /* @__PURE__ */ new Map();
	const reasoningPartIndexes = /* @__PURE__ */ new Map();
	let responseId = generateId2();
	let timeToFirstOutputMs;
	let previousOutputChunkTimestampMs;
	const timeBetweenOutputChunksMs = [];
	return new TransformStream({ async transform(chunk, controller) {
		var _a22, _b;
		if (isOutputChunk(chunk)) {
			const outputChunkTimestampMs = now2();
			if (timeToFirstOutputMs == null) timeToFirstOutputMs = outputChunkTimestampMs - callStartTimestampMs;
			else if (previousOutputChunkTimestampMs != null) timeBetweenOutputChunksMs.push(outputChunkTimestampMs - previousOutputChunkTimestampMs);
			previousOutputChunkTimestampMs = outputChunkTimestampMs;
		}
		switch (chunk.type) {
			case "text-start":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: textPartIndexes,
					id: chunk.id,
					type: "text",
					providerMetadata: chunk.providerMetadata
				});
				controller.enqueue(chunk);
				break;
			case "text-delta":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: textPartIndexes,
					id: chunk.id,
					type: "text",
					textDelta: chunk.delta,
					providerMetadata: chunk.providerMetadata
				});
				controller.enqueue({
					type: "text-delta",
					id: chunk.id,
					text: chunk.delta,
					providerMetadata: chunk.providerMetadata
				});
				break;
			case "text-end":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: textPartIndexes,
					id: chunk.id,
					type: "text",
					providerMetadata: chunk.providerMetadata
				});
				textPartIndexes.delete(chunk.id);
				controller.enqueue(chunk);
				break;
			case "reasoning-start":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: reasoningPartIndexes,
					id: chunk.id,
					type: "reasoning",
					providerMetadata: chunk.providerMetadata
				});
				controller.enqueue(chunk);
				break;
			case "reasoning-delta":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: reasoningPartIndexes,
					id: chunk.id,
					type: "reasoning",
					textDelta: chunk.delta,
					providerMetadata: chunk.providerMetadata
				});
				controller.enqueue({
					type: "reasoning-delta",
					id: chunk.id,
					text: chunk.delta,
					providerMetadata: chunk.providerMetadata
				});
				break;
			case "reasoning-end":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: reasoningPartIndexes,
					id: chunk.id,
					type: "reasoning",
					providerMetadata: chunk.providerMetadata
				});
				reasoningPartIndexes.delete(chunk.id);
				controller.enqueue(chunk);
				break;
			case "file":
			case "reasoning-file": {
				const file = new DefaultGeneratedFileWithType({
					data: chunk.data.type === "data" ? chunk.data.data : chunk.data.url.toString(),
					mediaType: chunk.mediaType
				});
				modelCallContent.push({
					type: chunk.type,
					file,
					...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {}
				});
				controller.enqueue({
					type: chunk.type,
					file,
					providerMetadata: chunk.providerMetadata
				});
				break;
			}
			case "finish": {
				const usage = asLanguageModelUsage(chunk.usage);
				const responseTimeMs = now2() - callStartTimestampMs;
				const performance = {
					responseTimeMs,
					effectiveOutputTokensPerSecond: calculateTokensPerSecond({
						tokens: usage.outputTokens,
						durationMs: responseTimeMs
					}),
					outputTokensPerSecond: timeToFirstOutputMs == null ? void 0 : calculateTokensPerSecond({
						tokens: usage.outputTokens,
						durationMs: responseTimeMs - timeToFirstOutputMs
					}),
					inputTokensPerSecond: timeToFirstOutputMs == null ? void 0 : calculateTokensPerSecond({
						tokens: usage.inputTokens,
						durationMs: timeToFirstOutputMs
					}),
					effectiveTotalTokensPerSecond: calculateTokensPerSecond({
						tokens: sumTokenCounts(usage.inputTokens, usage.outputTokens),
						durationMs: responseTimeMs
					}),
					timeToFirstOutputMs,
					timeBetweenOutputChunksMs: timeBetweenOutputChunksMs.length > 0 ? calculateOutputChunkTimingStats(timeBetweenOutputChunksMs) : void 0
				};
				await notify({
					event: {
						callId,
						provider,
						modelId,
						finishReason: chunk.finishReason.unified,
						usage,
						content: modelCallContent,
						responseId,
						performance
					},
					callbacks: onLanguageModelCallEnd
				});
				controller.enqueue({
					type: "model-call-end",
					finishReason: chunk.finishReason.unified,
					rawFinishReason: chunk.finishReason.raw,
					usage,
					providerMetadata: chunk.providerMetadata,
					performance
				});
				break;
			}
			case "tool-call":
				try {
					const toolCall = await parseToolCall({
						toolCall: chunk,
						tools,
						repairToolCall,
						refineToolInput,
						instructions,
						messages
					});
					toolCallsByToolCallId.set(toolCall.toolCallId, toolCall);
					controller.enqueue(toolCall);
					modelCallContent.push(toolCall);
					if (toolCall.invalid) {
						controller.enqueue({
							type: "tool-error",
							toolCallId: toolCall.toolCallId,
							toolName: toolCall.toolName,
							input: toolCall.input,
							error: getErrorMessage(toolCall.error),
							dynamic: true,
							title: toolCall.title,
							...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
						});
						break;
					}
				} catch (error) {
					controller.enqueue({
						type: "error",
						error
					});
				}
				break;
			case "tool-approval-request": {
				const toolCall = toolCallsByToolCallId.get(chunk.toolCallId);
				if (toolCall == null) {
					controller.enqueue({
						type: "error",
						error: new ToolCallNotFoundForApprovalError({
							toolCallId: chunk.toolCallId,
							approvalId: chunk.approvalId
						})
					});
					break;
				}
				const toolApprovalRequest = {
					type: "tool-approval-request",
					approvalId: chunk.approvalId,
					toolCall
				};
				controller.enqueue(toolApprovalRequest);
				modelCallContent.push(toolApprovalRequest);
				break;
			}
			case "tool-result": {
				const toolName = chunk.toolName;
				const toolCall = toolCallsByToolCallId.get(chunk.toolCallId);
				const toolResultPart = chunk.isError ? {
					type: "tool-error",
					toolCallId: chunk.toolCallId,
					toolName,
					input: toolCall == null ? void 0 : toolCall.input,
					providerExecuted: true,
					error: chunk.result,
					dynamic: chunk.dynamic,
					...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {},
					...(toolCall == null ? void 0 : toolCall.toolMetadata) != null ? { toolMetadata: toolCall.toolMetadata } : {}
				} : {
					type: "tool-result",
					toolCallId: chunk.toolCallId,
					toolName,
					input: toolCall == null ? void 0 : toolCall.input,
					output: chunk.result,
					providerExecuted: true,
					dynamic: chunk.dynamic,
					...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {},
					...(toolCall == null ? void 0 : toolCall.toolMetadata) != null ? { toolMetadata: toolCall.toolMetadata } : {}
				};
				controller.enqueue(toolResultPart);
				modelCallContent.push(toolResultPart);
				break;
			}
			case "tool-input-start": {
				const tool2 = tools == null ? void 0 : tools[chunk.toolName];
				controller.enqueue({
					...chunk,
					dynamic: (_a22 = chunk.dynamic) != null ? _a22 : (tool2 == null ? void 0 : tool2.type) === "dynamic",
					title: tool2 == null ? void 0 : tool2.title,
					...(tool2 == null ? void 0 : tool2.metadata) != null ? { toolMetadata: tool2.metadata } : {}
				});
				break;
			}
			case "stream-start":
				controller.enqueue({
					type: "model-call-start",
					warnings: chunk.warnings
				});
				break;
			case "response-metadata":
				responseId = (_b = chunk.id) != null ? _b : responseId;
				controller.enqueue({
					type: "model-call-response-metadata",
					id: chunk.id,
					timestamp: chunk.timestamp,
					modelId: chunk.modelId
				});
				break;
			default:
				if (chunk.type === "custom" || chunk.type === "source") modelCallContent.push(chunk);
				controller.enqueue(chunk);
				break;
		}
	} });
}
function isOutputChunk(chunk) {
	return chunk.type === "text-delta" && chunk.delta.length > 0 || chunk.type === "reasoning-delta" && chunk.delta.length > 0 || chunk.type === "tool-input-delta" && chunk.delta.length > 0 || chunk.type === "file" || chunk.type === "reasoning-file" || chunk.type === "tool-call";
}
function calculateOutputChunkTimingStats(timingsMs) {
	const sortedTimingsMs = [...timingsMs].sort((a, b) => a - b);
	const sum = timingsMs.reduce((sum2, timingMs) => sum2 + timingMs, 0);
	return {
		min: sortedTimingsMs[0],
		p10: calculateNearestRankPercentile(sortedTimingsMs, .1),
		median: calculateNearestRankPercentile(sortedTimingsMs, .5),
		avg: sum / timingsMs.length,
		p90: calculateNearestRankPercentile(sortedTimingsMs, .9),
		max: sortedTimingsMs[sortedTimingsMs.length - 1]
	};
}
function calculateNearestRankPercentile(sortedValues, percentile) {
	return sortedValues[Math.ceil(percentile * sortedValues.length) - 1];
}
function upsertTextContentPart({ content, partIndexes, id, type, textDelta, providerMetadata }) {
	let partIndex = partIndexes.get(id);
	if (partIndex == null) {
		partIndex = content.push({
			type,
			text: "",
			...providerMetadata != null ? { providerMetadata } : {}
		}) - 1;
		partIndexes.set(id, partIndex);
	}
	const part = content[partIndex];
	if (textDelta != null) part.text += textDelta;
	if (providerMetadata != null) part.providerMetadata = providerMetadata;
}
var originalGenerateId3 = createIdGenerator({
	prefix: "aitxt",
	size: 24
});
var originalGenerateCallId3 = createIdGenerator({
	prefix: "call",
	size: 24
});
var isOutputChunkType = {
	file: true,
	custom: true,
	source: true,
	"text-start": true,
	"text-end": true,
	"text-delta": true,
	"reasoning-start": true,
	"reasoning-end": true,
	"reasoning-delta": true,
	"reasoning-file": true,
	"tool-input-start": true,
	"tool-input-end": true,
	"tool-input-delta": true,
	"tool-approval-request": true,
	"tool-approval-response": true,
	"tool-call": true,
	"tool-result": true,
	"tool-error": true,
	"tool-execution-end": false,
	"model-call-start": false,
	"model-call-response-metadata": false,
	"model-call-end": false,
	error: false,
	raw: false
};
function streamText({ model, tools, toolChoice, instructions, system, prompt, messages, allowSystemInMessages, maxRetries, abortSignal, timeout, headers, stopWhen = isStepCount(1), experimental_sandbox: sandbox, output, toolApproval, experimental_toolApprovalSecret, experimental_telemetry, telemetry = experimental_telemetry, prepareStep, providerOptions, activeTools, toolOrder, experimental_repairToolCall: repairToolCall, experimental_refineToolInput: refineToolInput, experimental_transform: transform, experimental_download: download2, includeRawChunks, onChunk, onError = ({ error }) => {
	console.error(error);
}, onFinish, onEnd = onFinish, onAbort, onStepEnd, onStepFinish, onStart, experimental_onStart, onStepStart, experimental_onStepStart, onLanguageModelCallStart, experimental_onLanguageModelCallStart, onLanguageModelCallEnd, experimental_onLanguageModelCallEnd, onToolExecutionStart, onToolExecutionEnd, experimental_onToolCallStart, experimental_onToolCallFinish, runtimeContext = {}, toolsContext = {}, experimental_include, include = experimental_include, _internal: { now: now2 = now, generateId: generateId2 = originalGenerateId3, generateCallId = originalGenerateCallId3 } = {}, ...settings }) {
	var _a22, _b, _c, _d;
	const totalTimeoutMs = getTotalTimeoutMs(timeout);
	const stepTimeoutMs = getStepTimeoutMs(timeout);
	const chunkTimeoutMs = getChunkTimeoutMs(timeout);
	const stepAbortController = stepTimeoutMs != null ? new AbortController() : void 0;
	const chunkAbortController = chunkTimeoutMs != null ? new AbortController() : void 0;
	const resolvedOnStart = onStart != null ? onStart : experimental_onStart;
	const resolvedOnStepStart = onStepStart != null ? onStepStart : experimental_onStepStart;
	const resolvedOnLanguageModelCallStart = onLanguageModelCallStart != null ? onLanguageModelCallStart : experimental_onLanguageModelCallStart;
	const resolvedOnLanguageModelCallEnd = onLanguageModelCallEnd != null ? onLanguageModelCallEnd : experimental_onLanguageModelCallEnd;
	const resolvedOnToolExecutionStart = onToolExecutionStart != null ? onToolExecutionStart : experimental_onToolCallStart;
	const resolvedOnToolExecutionEnd = onToolExecutionEnd != null ? onToolExecutionEnd : experimental_onToolCallFinish;
	const resolvedOnStepEnd = onStepEnd != null ? onStepEnd : onStepFinish;
	return new DefaultStreamTextResult({
		model: resolveLanguageModel(model),
		telemetry,
		headers,
		settings,
		maxRetries,
		abortSignal: mergeAbortSignals(abortSignal, totalTimeoutMs, stepAbortController == null ? void 0 : stepAbortController.signal, chunkAbortController == null ? void 0 : chunkAbortController.signal),
		stepTimeoutMs,
		stepAbortController,
		chunkTimeoutMs,
		chunkAbortController,
		instructions,
		system,
		prompt,
		messages,
		allowSystemInMessages,
		experimental_sandbox: sandbox,
		tools,
		toolsContext,
		runtimeContext,
		toolChoice,
		transforms: asArray(transform),
		activeTools,
		toolOrder,
		repairToolCall,
		refineToolInput,
		stopConditions: asArray(stopWhen),
		output,
		toolApproval,
		experimental_toolApprovalSecret,
		providerOptions,
		prepareStep,
		timeout,
		onChunk,
		onError,
		onEnd,
		onAbort,
		onStepFinish: resolvedOnStepEnd,
		onStart: resolvedOnStart,
		onStepStart: resolvedOnStepStart,
		onLanguageModelCallStart: resolvedOnLanguageModelCallStart,
		onLanguageModelCallEnd: resolvedOnLanguageModelCallEnd,
		onToolExecutionStart: resolvedOnToolExecutionStart,
		onToolExecutionEnd: resolvedOnToolExecutionEnd,
		now: now2,
		generateId: generateId2,
		generateCallId,
		download: download2,
		include: {
			requestBody: (_a22 = include == null ? void 0 : include.requestBody) != null ? _a22 : false,
			requestMessages: (_b = include == null ? void 0 : include.requestMessages) != null ? _b : false,
			rawChunks: (_d = (_c = include == null ? void 0 : include.rawChunks) != null ? _c : includeRawChunks) != null ? _d : false
		}
	});
}
async function markPromiseAsHandled(promise) {
	try {
		await promise;
	} catch (e) {}
}
function createOutputTransformStream(output) {
	let firstTextChunkId = void 0;
	let text2 = "";
	let textChunk = "";
	let textProviderMetadata = void 0;
	let lastPublishedValue = "";
	function publishTextChunk({ controller, partialOutput = void 0 }) {
		controller.enqueue({
			part: {
				type: "text-delta",
				id: firstTextChunkId,
				text: textChunk,
				providerMetadata: textProviderMetadata
			},
			partialOutput
		});
		textChunk = "";
	}
	return new TransformStream({ async transform(chunk, controller) {
		var _a22;
		if (chunk.type === "finish-step" && textChunk.length > 0) publishTextChunk({ controller });
		if (chunk.type !== "text-delta" && chunk.type !== "text-start" && chunk.type !== "text-end") {
			controller.enqueue({
				part: chunk,
				partialOutput: void 0
			});
			return;
		}
		if (firstTextChunkId == null) firstTextChunkId = chunk.id;
		else if (chunk.id !== firstTextChunkId) {
			controller.enqueue({
				part: chunk,
				partialOutput: void 0
			});
			return;
		}
		if (chunk.type === "text-start") {
			controller.enqueue({
				part: chunk,
				partialOutput: void 0
			});
			return;
		}
		if (chunk.type === "text-end") {
			if (textChunk.length > 0) publishTextChunk({ controller });
			controller.enqueue({
				part: chunk,
				partialOutput: void 0
			});
			return;
		}
		text2 += chunk.text;
		textChunk += chunk.text;
		textProviderMetadata = (_a22 = chunk.providerMetadata) != null ? _a22 : textProviderMetadata;
		const result = await output.parsePartialOutput({ text: text2 });
		if (result !== void 0) {
			const currentValue = typeof result.partial === "string" ? result.partial : JSON.stringify(result.partial);
			if (currentValue !== lastPublishedValue) {
				publishTextChunk({
					controller,
					partialOutput: result.partial
				});
				lastPublishedValue = currentValue;
			}
		}
	} });
}
var DefaultStreamTextResult = class {
	constructor({ model, telemetry, headers, settings, maxRetries: maxRetriesArg, abortSignal, stepTimeoutMs, stepAbortController, chunkTimeoutMs, chunkAbortController, instructions, system, prompt, messages, allowSystemInMessages, experimental_sandbox: sandbox, tools, toolChoice, transforms, activeTools, toolOrder, repairToolCall, refineToolInput, stopConditions, output, toolApproval, experimental_toolApprovalSecret, providerOptions, prepareStep, now: now2, generateId: generateId2, generateCallId, timeout, onChunk, onError, onEnd, onAbort, onStepFinish, onStart, onStepStart, onLanguageModelCallStart, onLanguageModelCallEnd, onToolExecutionStart, onToolExecutionEnd, runtimeContext, toolsContext, download: download2, include }) {
		this._totalUsage = new DelayedPromise();
		this._finishReason = new DelayedPromise();
		this._rawFinishReason = new DelayedPromise();
		this._steps = new DelayedPromise();
		this._initialResponseMessages = new DelayedPromise();
		this.outputSpecification = output;
		this.tools = tools;
		const telemetryDispatcher = createRestrictedTelemetryDispatcher({
			telemetry,
			includeRuntimeContext: telemetry == null ? void 0 : telemetry.includeRuntimeContext,
			includeToolsContext: telemetry == null ? void 0 : telemetry.includeToolsContext
		});
		let stepFinish;
		let recordedContent = [];
		let recordedFinishReason = void 0;
		let recordedRawFinishReason = void 0;
		let recordedTotalUsage = void 0;
		let recordedRequest = {};
		let recordedRequestMessages = [];
		let recordedWarnings = [];
		const recordedSteps = [];
		const initialResponseMessages = [];
		let stepMessagesForNextStep;
		let currentStepMessages = [];
		const pendingDeferredToolCalls = /* @__PURE__ */ new Map();
		let activeTextContent = createIdMap();
		let activeReasoningContent = createIdMap();
		let recordedNoOutputError;
		const eventProcessor = new TransformStream({
			async transform(chunk, controller) {
				var _a22, _b, _c, _d;
				controller.enqueue(chunk);
				const { part } = chunk;
				await (onChunk == null ? void 0 : onChunk({ chunk: part }));
				if (part.type === "error") {
					const error = wrapGatewayError(part.error);
					if (NoOutputGeneratedError.isInstance(error)) recordedNoOutputError = error;
					await onError({ error });
				}
				if (part.type === "custom" || part.type === "source" || part.type === "tool-call" || part.type === "tool-approval-request" || part.type === "tool-approval-response" || part.type === "tool-error") recordedContent.push(part);
				if (part.type === "text-start") {
					activeTextContent[part.id] = {
						type: "text",
						text: "",
						providerMetadata: part.providerMetadata
					};
					recordedContent.push(activeTextContent[part.id]);
				}
				if (part.type === "text-delta") {
					const activeText = activeTextContent[part.id];
					if (activeText == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `text part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeText.text += part.text;
					activeText.providerMetadata = (_a22 = part.providerMetadata) != null ? _a22 : activeText.providerMetadata;
				}
				if (part.type === "text-end") {
					const activeText = activeTextContent[part.id];
					if (activeText == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `text part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeText.providerMetadata = (_b = part.providerMetadata) != null ? _b : activeText.providerMetadata;
					delete activeTextContent[part.id];
				}
				if (part.type === "reasoning-start") {
					activeReasoningContent[part.id] = {
						type: "reasoning",
						text: "",
						providerMetadata: part.providerMetadata
					};
					recordedContent.push(activeReasoningContent[part.id]);
				}
				if (part.type === "reasoning-delta") {
					const activeReasoning = activeReasoningContent[part.id];
					if (activeReasoning == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `reasoning part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeReasoning.text += part.text;
					activeReasoning.providerMetadata = (_c = part.providerMetadata) != null ? _c : activeReasoning.providerMetadata;
				}
				if (part.type === "reasoning-end") {
					const activeReasoning = activeReasoningContent[part.id];
					if (activeReasoning == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `reasoning part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeReasoning.providerMetadata = (_d = part.providerMetadata) != null ? _d : activeReasoning.providerMetadata;
					delete activeReasoningContent[part.id];
				}
				if (part.type === "file" || part.type === "reasoning-file") recordedContent.push({
					type: part.type,
					file: part.file,
					...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
				});
				if (part.type === "tool-result" && !part.preliminary) recordedContent.push(part);
				if (part.type === "start-step") {
					recordedContent = [];
					activeReasoningContent = createIdMap();
					activeTextContent = createIdMap();
					recordedRequest = part.request;
					recordedWarnings = part.warnings;
				}
				if (part.type === "finish-step") {
					const stepResponseMessages = await toResponseMessages({
						content: recordedContent,
						tools
					});
					const currentStepResult = new DefaultStepResult({
						callId,
						stepNumber: recordedSteps.length,
						provider: model.provider,
						modelId: model.modelId,
						runtimeContext,
						toolsContext,
						content: recordedContent,
						finishReason: part.finishReason,
						rawFinishReason: part.rawFinishReason,
						usage: part.usage,
						performance: part.performance,
						warnings: recordedWarnings,
						request: {
							...recordedRequest,
							messages: include.requestMessages ? cloneModelMessages(recordedRequestMessages) : void 0
						},
						response: {
							...part.response,
							messages: cloneModelMessages(stepResponseMessages)
						},
						providerMetadata: part.providerMetadata
					});
					await notify({
						event: currentStepResult,
						callbacks: [onStepFinish, telemetryDispatcher.onStepEnd]
					});
					logWarnings({
						warnings: recordedWarnings,
						provider: model.provider,
						model: model.modelId
					});
					recordedSteps.push(currentStepResult);
					stepMessagesForNextStep = [...currentStepMessages, ...stepResponseMessages];
					stepFinish.resolve();
				}
				if (part.type === "finish") {
					recordedTotalUsage = part.totalUsage;
					recordedFinishReason = part.finishReason;
					recordedRawFinishReason = part.rawFinishReason;
				}
			},
			async flush(controller) {
				try {
					if (recordedSteps.length === 0 || recordedNoOutputError != null) {
						const error = (abortSignal == null ? void 0 : abortSignal.aborted) ? abortSignal.reason : recordedNoOutputError != null ? recordedNoOutputError : new NoOutputGeneratedError({ message: "No output generated. Check the stream for errors." });
						self.rejectResultPromises(error);
						return;
					}
					const finishReason = recordedFinishReason != null ? recordedFinishReason : "other";
					const totalUsage = recordedTotalUsage != null ? recordedTotalUsage : createNullLanguageModelUsage();
					self._finishReason.resolve(finishReason);
					self._rawFinishReason.resolve(recordedRawFinishReason);
					self._totalUsage.resolve(totalUsage);
					self._steps.resolve(recordedSteps);
					const finalStep = recordedSteps[recordedSteps.length - 1];
					const content = recordedSteps.flatMap((step) => step.content);
					const files = recordedSteps.flatMap((step) => step.files);
					const sources = recordedSteps.flatMap((step) => step.sources);
					const toolCalls = recordedSteps.flatMap((step) => step.toolCalls);
					const staticToolCalls = recordedSteps.flatMap((step) => step.staticToolCalls);
					const dynamicToolCalls = recordedSteps.flatMap((step) => step.dynamicToolCalls);
					const toolResults = recordedSteps.flatMap((step) => step.toolResults);
					const staticToolResults = recordedSteps.flatMap((step) => step.staticToolResults);
					const dynamicToolResults = recordedSteps.flatMap((step) => step.dynamicToolResults);
					const warnings = recordedSteps.flatMap((step) => {
						var _a22;
						return (_a22 = step.warnings) != null ? _a22 : [];
					});
					await notify({
						event: {
							callId,
							toolsContext: finalStep.toolsContext,
							stepNumber: finalStep.stepNumber,
							model: finalStep.model,
							runtimeContext: finalStep.runtimeContext,
							finishReason: finalStep.finishReason,
							rawFinishReason: finalStep.rawFinishReason,
							usage: totalUsage,
							totalUsage,
							content,
							text: finalStep.text,
							reasoning: finalStep.reasoning,
							reasoningText: finalStep.reasoningText,
							files,
							sources,
							toolCalls,
							staticToolCalls,
							dynamicToolCalls,
							toolResults,
							staticToolResults,
							dynamicToolResults,
							responseMessages: [...initialResponseMessages, ...recordedSteps.flatMap((step) => step.response.messages)],
							warnings,
							request: finalStep.request,
							response: finalStep.response,
							providerMetadata: finalStep.providerMetadata,
							steps: recordedSteps,
							finalStep
						},
						callbacks: [onEnd, telemetryDispatcher.onEnd]
					});
				} catch (error) {
					controller.error(error);
				}
			}
		});
		const stitchableStream = createStitchableStream();
		this.addStream = stitchableStream.addStream;
		this.closeStream = stitchableStream.close;
		const reader = stitchableStream.stream.getReader();
		let stream = new ReadableStream({
			async start(controller) {
				controller.enqueue({ type: "start" });
			},
			async pull(controller) {
				async function abort() {
					await notify({
						event: {
							callId,
							steps: recordedSteps,
							...(abortSignal == null ? void 0 : abortSignal.reason) !== void 0 ? { reason: abortSignal.reason } : {}
						},
						callbacks: [onAbort, telemetryDispatcher.onAbort]
					});
					controller.enqueue({
						type: "abort",
						...(abortSignal == null ? void 0 : abortSignal.reason) !== void 0 ? { reason: getErrorMessage(abortSignal.reason) } : {}
					});
					controller.close();
				}
				try {
					const { done, value } = await reader.read();
					if (done) {
						controller.close();
						return;
					}
					if (abortSignal == null ? void 0 : abortSignal.aborted) {
						await abort();
						return;
					}
					controller.enqueue(value);
				} catch (error) {
					if (isAbortError(error) && (abortSignal == null ? void 0 : abortSignal.aborted)) await abort();
					else controller.error(error);
				}
			},
			cancel(reason) {
				return stitchableStream.stream.cancel(reason);
			}
		});
		let isRunning = true;
		stream = stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
			if (isRunning) controller.enqueue(chunk);
		} }));
		for (const transform of transforms) stream = stream.pipeThrough(transform({
			tools,
			stopStream() {
				stitchableStream.terminate();
				isRunning = false;
			}
		}));
		this.baseStream = stream.pipeThrough(createOutputTransformStream(output != null ? output : text())).pipeThrough(eventProcessor);
		const { maxRetries } = prepareRetries({
			maxRetries: maxRetriesArg,
			abortSignal
		});
		const callSettings = prepareLanguageModelCallOptions(settings);
		const self = this;
		const callId = generateCallId();
		(async () => {
			var _a22;
			const initialPrompt = await standardizePrompt({
				instructions,
				system,
				prompt,
				messages,
				allowSystemInMessages
			});
			const startEvent = {
				callId,
				operationId: "ai.streamText",
				provider: model.provider,
				modelId: model.modelId,
				instructions: initialPrompt.instructions,
				messages: initialPrompt.messages,
				tools,
				toolChoice,
				activeTools,
				toolOrder,
				maxOutputTokens: callSettings.maxOutputTokens,
				temperature: callSettings.temperature,
				topP: callSettings.topP,
				topK: callSettings.topK,
				presencePenalty: callSettings.presencePenalty,
				frequencyPenalty: callSettings.frequencyPenalty,
				stopSequences: callSettings.stopSequences,
				seed: callSettings.seed,
				reasoning: callSettings.reasoning,
				maxRetries,
				timeout,
				headers,
				providerOptions,
				output,
				runtimeContext,
				toolsContext
			};
			const streamTextTracingChannelContext = (_a22 = telemetryDispatcher.startTracingChannelContext) == null ? void 0 : _a22.call(telemetryDispatcher, {
				type: "streamText",
				event: startEvent,
				completion: self._totalUsage.promise.then(() => void 0)
			});
			const runInStreamTextTracingChannelContext = (execute) => {
				var _a23;
				return (_a23 = streamTextTracingChannelContext == null ? void 0 : streamTextTracingChannelContext.run(execute)) != null ? _a23 : execute();
			};
			await notify({
				event: startEvent,
				callbacks: [onStart, telemetryDispatcher.onStart]
			});
			const initialMessages = initialPrompt.messages;
			let instructionsForNextStep = initialPrompt.instructions;
			const { approvedToolApprovals, deniedToolApprovals } = collectToolApprovals({ messages: initialMessages });
			if (deniedToolApprovals.length > 0 || approvedToolApprovals.length > 0) {
				const { approvedToolApprovals: localApprovedToolApprovals, deniedToolApprovals: revalidationDeniedToolApprovals } = await validateApprovedToolApprovals({
					approvedToolApprovals: approvedToolApprovals.filter((toolApproval2) => !toolApproval2.toolCall.providerExecuted),
					tools,
					toolApproval,
					messages: initialMessages,
					toolsContext,
					runtimeContext,
					toolApprovalSecret: experimental_toolApprovalSecret
				});
				const localDeniedToolApprovals = [...deniedToolApprovals.filter((toolApproval2) => !toolApproval2.toolCall.providerExecuted), ...revalidationDeniedToolApprovals];
				const deniedProviderExecutedToolApprovals = deniedToolApprovals.filter((toolApproval2) => toolApproval2.toolCall.providerExecuted);
				let toolExecutionStepStreamController;
				const toolExecutionStepStream = new ReadableStream({ start(controller) {
					toolExecutionStepStreamController = controller;
				} });
				self.addStream(toolExecutionStepStream);
				try {
					for (const toolApproval2 of [...localDeniedToolApprovals, ...deniedProviderExecutedToolApprovals]) toolExecutionStepStreamController?.enqueue({
						type: "tool-output-denied",
						toolCallId: toolApproval2.toolCall.toolCallId,
						toolName: toolApproval2.toolCall.toolName
					});
					const toolOutputs = [];
					await Promise.all(localApprovedToolApprovals.map(async (toolApproval2) => {
						const result = await executeToolCall({
							toolCall: toolApproval2.toolCall,
							tools,
							callId,
							messages: initialMessages,
							abortSignal,
							timeout,
							experimental_sandbox: sandbox,
							toolsContext,
							onToolExecutionStart: filterNullable(onToolExecutionStart, telemetryDispatcher.onToolExecutionStart),
							onToolExecutionEnd: filterNullable(onToolExecutionEnd, telemetryDispatcher.onToolExecutionEnd),
							executeToolInTelemetryContext: telemetryDispatcher.executeTool,
							runInTracingChannelSpan: telemetryDispatcher.runInTracingChannelSpan,
							onPreliminaryToolResult: (result2) => {
								toolExecutionStepStreamController?.enqueue(result2);
							}
						});
						if (result != null) {
							toolExecutionStepStreamController?.enqueue(result.output);
							toolOutputs.push(result.output);
						}
					}));
					if (toolOutputs.length > 0 || localDeniedToolApprovals.length > 0) {
						const localToolContent = [];
						for (const output2 of toolOutputs) localToolContent.push({
							type: "tool-result",
							toolCallId: output2.toolCallId,
							toolName: output2.toolName,
							output: await createToolModelOutput({
								toolCallId: output2.toolCallId,
								input: output2.input,
								tool: tools == null ? void 0 : tools[output2.toolName],
								output: output2.type === "tool-result" ? output2.output : output2.error,
								errorMode: output2.type === "tool-error" ? "text" : "none"
							})
						});
						for (const toolApproval2 of localDeniedToolApprovals) localToolContent.push({
							type: "tool-result",
							toolCallId: toolApproval2.toolCall.toolCallId,
							toolName: toolApproval2.toolCall.toolName,
							output: {
								type: "execution-denied",
								reason: toolApproval2.approvalResponse.reason
							}
						});
						initialResponseMessages.push({
							role: "tool",
							content: localToolContent
						});
					}
				} finally {
					toolExecutionStepStreamController?.close();
				}
			}
			self._initialResponseMessages.resolve(initialResponseMessages);
			async function streamStep({ currentStep, usage }) {
				var _a23, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
				const stepTimeoutId = setAbortTimeout({
					abortController: stepAbortController,
					label: "Step",
					timeoutMs: stepTimeoutMs
				});
				let chunkTimeoutId = void 0;
				function resetChunkTimeout() {
					if (chunkTimeoutId != null) clearTimeout(chunkTimeoutId);
					chunkTimeoutId = setAbortTimeout({
						abortController: chunkAbortController,
						label: "Chunk",
						timeoutMs: chunkTimeoutMs
					});
				}
				function clearChunkTimeout() {
					if (chunkTimeoutId != null) {
						clearTimeout(chunkTimeoutId);
						chunkTimeoutId = void 0;
					}
				}
				function clearStepTimeout() {
					if (stepTimeoutId != null) clearTimeout(stepTimeoutId);
				}
				abortSignal?.addEventListener("abort", clearStepTimeout);
				abortSignal?.addEventListener("abort", clearChunkTimeout);
				try {
					stepFinish = new DelayedPromise();
					const stepTracingChannelContext = (_a23 = telemetryDispatcher.startTracingChannelContext) == null ? void 0 : _a23.call(telemetryDispatcher, {
						type: "step",
						event: {
							callId,
							stepNumber: currentStep
						},
						completion: stepFinish.promise
					});
					const runInStepTracingChannelContext = (execute) => {
						var _a24;
						return (_a24 = stepTracingChannelContext == null ? void 0 : stepTracingChannelContext.run(execute)) != null ? _a24 : execute();
					};
					const responseMessagesFromPreviousSteps = recordedSteps.flatMap((step) => step.response.messages);
					const accumulatedResponseMessages = [...initialResponseMessages, ...responseMessagesFromPreviousSteps];
					const stepInputMessages = stepMessagesForNextStep != null ? stepMessagesForNextStep : [...initialMessages, ...initialResponseMessages];
					const prepareStepResult = await (prepareStep == null ? void 0 : prepareStep({
						model,
						steps: recordedSteps,
						stepNumber: recordedSteps.length,
						instructions: instructionsForNextStep,
						initialInstructions: initialPrompt.instructions,
						messages: stepInputMessages,
						initialMessages,
						responseMessages: accumulatedResponseMessages,
						toolsContext,
						runtimeContext,
						experimental_sandbox: sandbox
					}));
					const stepSandbox = (_b = prepareStepResult == null ? void 0 : prepareStepResult.experimental_sandbox) != null ? _b : sandbox;
					runtimeContext = (_c = prepareStepResult == null ? void 0 : prepareStepResult.runtimeContext) != null ? _c : runtimeContext;
					toolsContext = (_d = prepareStepResult == null ? void 0 : prepareStepResult.toolsContext) != null ? _d : toolsContext;
					const stepModel = resolveLanguageModel((_e = prepareStepResult == null ? void 0 : prepareStepResult.model) != null ? _e : model);
					const stepActiveTools = filterActiveTools({
						tools,
						activeTools: (_f = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _f : activeTools
					});
					const stepToolOrder = (_g = prepareStepResult == null ? void 0 : prepareStepResult.toolOrder) != null ? _g : toolOrder;
					const stepTools = await prepareTools({
						tools: stepActiveTools,
						toolOrder: stepToolOrder,
						toolsContext,
						experimental_sandbox: stepSandbox
					});
					const stepToolChoice = prepareToolChoice({ toolChoice: (_h = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _h : toolChoice });
					const stepMessages = (_i = prepareStepResult == null ? void 0 : prepareStepResult.messages) != null ? _i : stepInputMessages;
					currentStepMessages = stepMessages;
					const stepInstructions = (_k = (_j = prepareStepResult == null ? void 0 : prepareStepResult.instructions) != null ? _j : prepareStepResult == null ? void 0 : prepareStepResult.system) != null ? _k : instructionsForNextStep;
					instructionsForNextStep = stepInstructions;
					const stepProviderOptions = mergeObjects(providerOptions, prepareStepResult == null ? void 0 : prepareStepResult.providerOptions);
					const stepStartTimestampMs = now2();
					const { retry } = prepareRetries({
						maxRetries,
						abortSignal
					});
					const { stream: languageModelStream, request, response } = await runInStepTracingChannelContext(() => retry(async () => {
						var _a24, _b2;
						return streamLanguageModelCall({
							model: (_a24 = prepareStepResult == null ? void 0 : prepareStepResult.model) != null ? _a24 : model,
							tools: stepActiveTools,
							toolOrder: stepToolOrder,
							toolChoice: (_b2 = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _b2 : toolChoice,
							instructions: stepInstructions,
							messages: stepMessages,
							allowSystemInMessages,
							repairToolCall,
							refineToolInput,
							abortSignal,
							headers,
							includeRawChunks: include.rawChunks,
							providerOptions: stepProviderOptions,
							download: download2,
							output,
							callId,
							executeLanguageModelCallInTelemetryContext: telemetryDispatcher.executeLanguageModelCall,
							toolsContext,
							experimental_sandbox: stepSandbox,
							onLanguageModelCallStart: filterNullable(onLanguageModelCallStart, telemetryDispatcher.onLanguageModelCallStart),
							onLanguageModelCallEnd: filterNullable(onLanguageModelCallEnd, telemetryDispatcher.onLanguageModelCallEnd),
							onStart: async ({ promptMessages }) => {
								var _a25, _b3;
								await notify({
									event: {
										callId,
										provider: stepModel.provider,
										modelId: stepModel.modelId,
										stepNumber: recordedSteps.length,
										instructions: stepInstructions,
										messages: stepMessages,
										tools,
										toolChoice: (_a25 = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _a25 : toolChoice,
										activeTools: (_b3 = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _b3 : activeTools,
										toolOrder: stepToolOrder,
										steps: [...recordedSteps],
										providerOptions: stepProviderOptions,
										runtimeContext,
										toolsContext,
										output,
										promptMessages,
										stepTools,
										stepToolChoice
									},
									callbacks: [onStepStart, telemetryDispatcher.onStepStart]
								});
							},
							_internal: { now: now2 },
							...callSettings
						});
					}));
					const streamAfterToolCallbackInvocation = invokeToolCallbacksFromStream({
						stream: languageModelStream,
						tools,
						stepInputMessages: stepMessages,
						abortSignal,
						runtimeContext
					});
					const runInTracingChannelSpanInStep = telemetryDispatcher.runInTracingChannelSpan == null ? void 0 : (options) => runInStepTracingChannelContext(() => telemetryDispatcher.runInTracingChannelSpan(options));
					const streamWithToolResults = executeToolsFromStream({
						stream: streamAfterToolCallbackInvocation,
						tools,
						callId,
						messages: stepMessages,
						abortSignal,
						timeout,
						experimental_sandbox: stepSandbox,
						toolsContext,
						toolApproval,
						runtimeContext,
						toolApprovalSecret: experimental_toolApprovalSecret,
						generateId: generateId2,
						onToolExecutionStart: filterNullable(onToolExecutionStart, telemetryDispatcher.onToolExecutionStart),
						onToolExecutionEnd: filterNullable(onToolExecutionEnd, telemetryDispatcher.onToolExecutionEnd),
						executeToolInTelemetryContext: telemetryDispatcher.executeTool,
						runInTracingChannelSpan: runInTracingChannelSpanInStep
					});
					const stepRequest = {
						...request,
						body: include.requestBody ? request == null ? void 0 : request.body : void 0,
						messages: include.requestMessages ? cloneModelMessages(stepMessages) : void 0
					};
					recordedRequestMessages = (_l = stepRequest.messages) != null ? _l : [];
					const stepToolCalls = [];
					const stepToolOutputs = [];
					const stepToolApprovalResponses = [];
					let warnings;
					let stepFinishReason = "other";
					let stepRawFinishReason = void 0;
					let hasReceivedTerminalChunk = false;
					let hasReceivedOutputChunk = false;
					let stepUsage = createNullLanguageModelUsage();
					let stepProviderMetadata;
					let stepFirstChunk = true;
					let modelCallPerformance = {
						responseTimeMs: 0,
						effectiveOutputTokensPerSecond: 0,
						outputTokensPerSecond: void 0,
						inputTokensPerSecond: void 0,
						effectiveTotalTokensPerSecond: 0,
						timeToFirstOutputMs: void 0,
						timeBetweenOutputChunksMs: void 0
					};
					const toolExecutionMs = {};
					let stepResponse = {
						id: generateId2(),
						timestamp: /* @__PURE__ */ new Date(),
						modelId: model.modelId
					};
					self.addStream(streamWithToolResults.pipeThrough(new TransformStream({
						async transform(chunk, controller) {
							var _a24, _b2, _c2;
							resetChunkTimeout();
							if (chunk.type === "model-call-start") {
								warnings = chunk.warnings;
								return;
							}
							if (stepFirstChunk) {
								stepFirstChunk = false;
								controller.enqueue({
									type: "start-step",
									request: stepRequest,
									warnings: warnings != null ? warnings : []
								});
							}
							const chunkType = chunk.type;
							if (isOutputChunkType[chunkType]) hasReceivedOutputChunk = true;
							switch (chunkType) {
								case "file":
								case "custom":
								case "source":
								case "text-start":
								case "text-end":
								case "reasoning-start":
								case "reasoning-end":
								case "reasoning-delta":
								case "reasoning-file":
								case "tool-input-start":
								case "tool-input-end":
								case "tool-input-delta":
								case "tool-approval-request":
									controller.enqueue(chunk);
									break;
								case "text-delta":
									if (chunk.text.length > 0) controller.enqueue(chunk);
									break;
								case "tool-call":
									controller.enqueue(chunk);
									stepToolCalls.push(chunk);
									break;
								case "tool-approval-response":
									controller.enqueue(chunk);
									stepToolApprovalResponses.push(chunk);
									break;
								case "tool-result":
									controller.enqueue(chunk);
									if (!chunk.preliminary) stepToolOutputs.push(chunk);
									break;
								case "tool-error":
									controller.enqueue(chunk);
									stepToolOutputs.push(chunk);
									break;
								case "tool-execution-end":
									toolExecutionMs[chunk.toolCallId] = chunk.toolExecutionMs;
									break;
								case "model-call-response-metadata":
									stepResponse = {
										id: (_a24 = chunk.id) != null ? _a24 : stepResponse.id,
										timestamp: (_b2 = chunk.timestamp) != null ? _b2 : stepResponse.timestamp,
										modelId: (_c2 = chunk.modelId) != null ? _c2 : stepResponse.modelId
									};
									break;
								case "model-call-end":
									hasReceivedTerminalChunk = true;
									stepUsage = chunk.usage;
									stepFinishReason = chunk.finishReason;
									stepRawFinishReason = chunk.rawFinishReason;
									stepProviderMetadata = chunk.providerMetadata;
									modelCallPerformance = chunk.performance;
									break;
								case "error":
									hasReceivedTerminalChunk = true;
									controller.enqueue(chunk);
									stepFinishReason = "error";
									break;
								case "raw":
									if (include.rawChunks) controller.enqueue(chunk);
									break;
								default: throw new Error(`Unknown chunk type: ${chunkType}`);
							}
						},
						async flush(controller) {
							if (!hasReceivedTerminalChunk && !hasReceivedOutputChunk) {
								controller.enqueue({
									type: "error",
									error: new NoOutputGeneratedError({ message: "No output generated. The model stream ended without a finish chunk." })
								});
								clearStepTimeout();
								clearChunkTimeout();
								self.closeStream();
								return;
							}
							const stepTimeMs = now2() - stepStartTimestampMs;
							const finishStepPart = {
								type: "finish-step",
								finishReason: stepFinishReason,
								rawFinishReason: stepRawFinishReason,
								usage: stepUsage,
								performance: {
									stepTimeMs,
									toolExecutionMs,
									...modelCallPerformance
								},
								providerMetadata: stepProviderMetadata,
								response: {
									...stepResponse,
									headers: response == null ? void 0 : response.headers
								}
							};
							controller.enqueue(finishStepPart);
							const combinedUsage = addLanguageModelUsage(usage, stepUsage);
							await stepFinish.promise;
							const clientToolCalls = stepToolCalls.filter((toolCall) => toolCall.providerExecuted !== true);
							const clientToolOutputs = stepToolOutputs.filter((toolOutput) => toolOutput.providerExecuted !== true);
							const deniedToolApprovalResponses = stepToolApprovalResponses.filter((toolApprovalResponse) => toolApprovalResponse.approved === false);
							for (const toolCall of stepToolCalls) {
								if (toolCall.providerExecuted !== true) continue;
								const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
								if ((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults) {
									if (!stepToolOutputs.some((output2) => (output2.type === "tool-result" || output2.type === "tool-error") && output2.toolCallId === toolCall.toolCallId)) pendingDeferredToolCalls.set(toolCall.toolCallId, { toolName: toolCall.toolName });
								}
							}
							for (const output2 of stepToolOutputs) if (output2.type === "tool-result" || output2.type === "tool-error") pendingDeferredToolCalls.delete(output2.toolCallId);
							clearStepTimeout();
							clearChunkTimeout();
							if ((clientToolCalls.length > 0 && clientToolCalls.length === clientToolOutputs.length + deniedToolApprovalResponses.length || pendingDeferredToolCalls.size > 0) && !await isStopConditionMet({
								stopConditions,
								steps: recordedSteps
							})) try {
								await runInStreamTextTracingChannelContext(() => streamStep({
									currentStep: currentStep + 1,
									usage: combinedUsage
								}));
							} catch (error) {
								controller.enqueue({
									type: "error",
									error
								});
								self.closeStream();
							}
							else {
								controller.enqueue({
									type: "finish",
									finishReason: stepFinishReason,
									rawFinishReason: stepRawFinishReason,
									totalUsage: combinedUsage
								});
								self.closeStream();
							}
						}
					})));
				} catch (error) {
					clearStepTimeout();
					clearChunkTimeout();
					throw error;
				}
			}
			await runInStreamTextTracingChannelContext(() => streamStep({
				currentStep: 0,
				usage: createNullLanguageModelUsage()
			}));
		})().catch(async (error) => {
			var _a22;
			await ((_a22 = telemetryDispatcher.onError) == null ? void 0 : _a22.call(telemetryDispatcher, {
				callId,
				error
			}));
			self._initialResponseMessages.reject(error);
			markPromiseAsHandled(self._initialResponseMessages.promise);
			self.addStream(new ReadableStream({ start(controller) {
				controller.enqueue({
					type: "error",
					error
				});
				controller.close();
			} }));
			self.closeStream();
		});
	}
	get steps() {
		this.consumeStream();
		return this._steps.promise;
	}
	get finalStep() {
		return this.steps.then((steps) => steps.at(-1));
	}
	get content() {
		return this.steps.then((steps) => steps.flatMap((step) => step.content));
	}
	get warnings() {
		return this.steps.then((steps) => steps.flatMap((step) => {
			var _a22;
			return (_a22 = step.warnings) != null ? _a22 : [];
		}));
	}
	get providerMetadata() {
		return this.finalStep.then((step) => step.providerMetadata);
	}
	get text() {
		return this.finalStep.then((step) => step.text);
	}
	get reasoningText() {
		return this.finalStep.then((step) => step.reasoningText);
	}
	get reasoning() {
		return this.finalStep.then((step) => convertToReasoningOutputs(step.reasoning));
	}
	get sources() {
		return this.steps.then((steps) => steps.flatMap((step) => step.sources));
	}
	get files() {
		return this.steps.then((steps) => steps.flatMap((step) => step.files));
	}
	get toolCalls() {
		return this.steps.then((steps) => steps.flatMap((step) => step.toolCalls));
	}
	get staticToolCalls() {
		return this.steps.then((steps) => steps.flatMap((step) => step.staticToolCalls));
	}
	get dynamicToolCalls() {
		return this.steps.then((steps) => steps.flatMap((step) => step.dynamicToolCalls));
	}
	get toolResults() {
		return this.steps.then((steps) => steps.flatMap((step) => step.toolResults));
	}
	get staticToolResults() {
		return this.steps.then((steps) => steps.flatMap((step) => step.staticToolResults));
	}
	get dynamicToolResults() {
		return this.steps.then((steps) => steps.flatMap((step) => step.dynamicToolResults));
	}
	get usage() {
		return this.totalUsage;
	}
	get request() {
		return this.finalStep.then((step) => step.request);
	}
	get response() {
		return this.finalStep.then((step) => step.response);
	}
	get responseMessages() {
		return Promise.all([this._initialResponseMessages.promise, this.steps]).then(([initialResponseMessages, steps]) => [...initialResponseMessages, ...steps.flatMap((step) => step.response.messages)]);
	}
	get totalUsage() {
		this.consumeStream();
		return this._totalUsage.promise;
	}
	get finishReason() {
		this.consumeStream();
		return this._finishReason.promise;
	}
	get rawFinishReason() {
		this.consumeStream();
		return this._rawFinishReason.promise;
	}
	/**
	* Split out a new stream from the original stream.
	* The original stream is replaced to allow for further splitting,
	* since we do not know how many times the stream will be split.
	*
	* Note: this leads to buffering the stream content on the server.
	* However, the LLM results are expected to be small enough to not cause issues.
	*/
	teeStream() {
		const [stream1, stream2] = this.baseStream.tee();
		this.baseStream = stream2;
		return stream1;
	}
	get textStream() {
		return createAsyncIterableStream(toTextStream({ stream: this.stream }));
	}
	get stream() {
		return createAsyncIterableStream(this.teeStream().pipeThrough(new TransformStream({ transform({ part }, controller) {
			controller.enqueue(part);
		} })));
	}
	get fullStream() {
		return this.stream;
	}
	rejectResultPromises(error) {
		this.rejectResultPromise({
			delayedPromise: this._finishReason,
			error
		});
		this.rejectResultPromise({
			delayedPromise: this._rawFinishReason,
			error
		});
		this.rejectResultPromise({
			delayedPromise: this._totalUsage,
			error
		});
		this.rejectResultPromise({
			delayedPromise: this._steps,
			error
		});
		this.rejectResultPromise({
			delayedPromise: this._initialResponseMessages,
			error
		});
	}
	rejectResultPromise({ delayedPromise, error }) {
		if (delayedPromise.isPending()) {
			delayedPromise.reject(error);
			markPromiseAsHandled(delayedPromise.promise);
		}
	}
	async consumeStream(options) {
		var _a22;
		try {
			await consumeStream({
				stream: this.stream,
				onError: (error) => {
					var _a23;
					this.rejectResultPromises(error);
					(_a23 = options == null ? void 0 : options.onError) == null || _a23.call(options, error);
				}
			});
		} catch (error) {
			this.rejectResultPromises(error);
			(_a22 = options == null ? void 0 : options.onError) == null || _a22.call(options, error);
		}
	}
	get experimental_partialOutputStream() {
		return this.partialOutputStream;
	}
	get partialOutputStream() {
		return createAsyncIterableStream(this.teeStream().pipeThrough(new TransformStream({ transform({ partialOutput }, controller) {
			if (partialOutput != null) controller.enqueue(partialOutput);
		} })));
	}
	get elementStream() {
		var _a22, _b, _c;
		const transform = (_a22 = this.outputSpecification) == null ? void 0 : _a22.createElementStreamTransform();
		if (transform == null) throw new UnsupportedFunctionalityError({ functionality: `element streams in ${(_c = (_b = this.outputSpecification) == null ? void 0 : _b.name) != null ? _c : "text"} mode` });
		return createAsyncIterableStream(this.teeStream().pipeThrough(transform));
	}
	get output() {
		return this.finalStep.then((step) => {
			var _a22;
			return ((_a22 = this.outputSpecification) != null ? _a22 : text()).parseCompleteOutput({ text: step.text }, {
				response: step.response,
				usage: step.usage,
				finishReason: step.finishReason
			});
		});
	}
	toUIMessageStream({ originalMessages, generateMessageId, onEnd, onFinish, messageMetadata, sendReasoning, sendSources, sendStart, sendFinish, onError } = {}) {
		return createAsyncIterableStream(toUIMessageStream({
			stream: this.stream,
			tools: this.tools,
			originalMessages,
			generateMessageId,
			onEnd: onEnd != null ? onEnd : onFinish,
			messageMetadata,
			sendReasoning,
			sendSources,
			sendStart,
			sendFinish,
			onError
		}));
	}
	pipeUIMessageStreamToResponse(response, { originalMessages, generateMessageId, onEnd, onFinish, messageMetadata, sendReasoning, sendSources, sendFinish, sendStart, onError, ...init } = {}) {
		pipeUIMessageStreamToResponse({
			response,
			stream: this.toUIMessageStream({
				originalMessages,
				generateMessageId,
				onEnd: onEnd != null ? onEnd : onFinish,
				messageMetadata,
				sendReasoning,
				sendSources,
				sendFinish,
				sendStart,
				onError
			}),
			...init
		});
	}
	pipeTextStreamToResponse(response, init) {
		pipeTextStreamToResponse({
			response,
			stream: this.textStream,
			...init
		});
	}
	toUIMessageStreamResponse({ originalMessages, generateMessageId, onEnd, onFinish, messageMetadata, sendReasoning, sendSources, sendFinish, sendStart, onError, ...init } = {}) {
		return createUIMessageStreamResponse({
			stream: this.toUIMessageStream({
				originalMessages,
				generateMessageId,
				onEnd: onEnd != null ? onEnd : onFinish,
				messageMetadata,
				sendReasoning,
				sendSources,
				sendFinish,
				sendStart,
				onError
			}),
			...init
		});
	}
	toTextStreamResponse(init) {
		return createTextStreamResponse({
			stream: this.textStream,
			...init
		});
	}
};
var ToolLoopAgent = class {
	constructor(settings) {
		this.version = "agent-v1";
		const { onFinish, onEnd = onFinish } = settings;
		this.settings = {
			...settings,
			onEnd
		};
	}
	/**
	* The id of the agent.
	*/
	get id() {
		return this.settings.id;
	}
	/**
	* The tools that the agent can use.
	*/
	get tools() {
		return this.settings.tools;
	}
	async prepareCall(options) {
		var _a22, _b, _c, _d;
		if (this.settings.callOptionsSchema != null && options.options !== void 0) {
			const validatedOptions = await validateTypes({
				value: options.options,
				schema: this.settings.callOptionsSchema,
				context: { field: "options" }
			});
			options = {
				...options,
				options: validatedOptions
			};
		}
		const { onStart: _settingsStableOnStart, experimental_onStart: _settingsExperimentalOnStart, onStepStart: _settingsStableOnStepStart, experimental_onStepStart: _settingsExperimentalOnStepStart, onToolExecutionStart: _settingsOnToolExecutionStart, onToolExecutionEnd: _settingsOnToolExecutionEnd, onStepEnd: _settingsOnStepEnd, onStepFinish: _settingsOnStepFinish, onFinish: _settingsOnFinish, onEnd: _settingsOnEnd, ...settingsWithoutCallbacks } = this.settings;
		const baseCallArgs = {
			...settingsWithoutCallbacks,
			stopWhen: (_a22 = this.settings.stopWhen) != null ? _a22 : isStepCount(20),
			...options
		};
		const { instructions, allowSystemInMessages, messages, prompt, runtimeContext, ...callArgs } = (_d = await ((_c = (_b = this.settings).prepareCall) == null ? void 0 : _c.call(_b, baseCallArgs))) != null ? _d : baseCallArgs;
		const promptArgs = {
			instructions,
			allowSystemInMessages,
			messages,
			prompt
		};
		if (runtimeContext === void 0) return {
			...callArgs,
			...promptArgs
		};
		return {
			...callArgs,
			runtimeContext,
			...promptArgs
		};
	}
	/**
	* Tags outgoing requests so usage can be attributed to ToolLoopAgent. Chains
	* with the `ai/<version>` and `ai-sdk/<provider>/<version>` suffixes added
	* downstream by generateText/streamText and the provider.
	*/
	agentHeaders(preparedCall) {
		var _a22;
		return withUserAgentSuffix((_a22 = preparedCall.headers) != null ? _a22 : {}, "ai-sdk-agent/tool-loop");
	}
	/**
	* Generates an output from the agent (non-streaming).
	*/
	async generate({ abortSignal, timeout, experimental_sandbox: sandbox, onStart, experimental_onStart, onStepStart, experimental_onStepStart, onToolExecutionStart, onToolExecutionEnd, onStepEnd, onStepFinish, onFinish, onEnd = onFinish, ...options }) {
		var _a22, _b, _c;
		const generate = generateText;
		const preparedCall = await this.prepareCall({
			...options,
			experimental_sandbox: sandbox
		});
		const callbackArgs = {
			abortSignal,
			timeout,
			experimental_sandbox: sandbox,
			onStart: mergeCallbacks((_a22 = this.settings.onStart) != null ? _a22 : this.settings.experimental_onStart, onStart != null ? onStart : experimental_onStart),
			onStepStart: mergeCallbacks((_b = this.settings.onStepStart) != null ? _b : this.settings.experimental_onStepStart, onStepStart != null ? onStepStart : experimental_onStepStart),
			onToolExecutionStart: mergeCallbacks(this.settings.onToolExecutionStart, onToolExecutionStart),
			onToolExecutionEnd: mergeCallbacks(this.settings.onToolExecutionEnd, onToolExecutionEnd),
			onStepEnd: mergeCallbacks((_c = this.settings.onStepEnd) != null ? _c : this.settings.onStepFinish, onStepEnd != null ? onStepEnd : onStepFinish),
			onEnd: mergeCallbacks(this.settings.onEnd, onEnd)
		};
		return await generate({
			...preparedCall,
			...callbackArgs,
			headers: this.agentHeaders(preparedCall)
		});
	}
	/**
	* Streams an output from the agent (streaming).
	*/
	async stream({ abortSignal, timeout, experimental_sandbox: sandbox, experimental_transform, onStart, experimental_onStart, onStepStart, experimental_onStepStart, onToolExecutionStart, onToolExecutionEnd, onStepEnd, onStepFinish, onFinish, onEnd = onFinish, ...options }) {
		var _a22, _b, _c;
		const stream = streamText;
		const preparedCall = await this.prepareCall({
			...options,
			experimental_sandbox: sandbox
		});
		const callbackArgs = {
			abortSignal,
			timeout,
			experimental_sandbox: sandbox,
			experimental_transform,
			onStart: mergeCallbacks((_a22 = this.settings.onStart) != null ? _a22 : this.settings.experimental_onStart, onStart != null ? onStart : experimental_onStart),
			onStepStart: mergeCallbacks((_b = this.settings.onStepStart) != null ? _b : this.settings.experimental_onStepStart, onStepStart != null ? onStepStart : experimental_onStepStart),
			onToolExecutionStart: mergeCallbacks(this.settings.onToolExecutionStart, onToolExecutionStart),
			onToolExecutionEnd: mergeCallbacks(this.settings.onToolExecutionEnd, onToolExecutionEnd),
			onStepEnd: mergeCallbacks((_c = this.settings.onStepEnd) != null ? _c : this.settings.onStepFinish, onStepEnd != null ? onStepEnd : onStepFinish),
			onEnd: mergeCallbacks(this.settings.onEnd, onEnd)
		};
		return await stream({
			...preparedCall,
			...callbackArgs,
			headers: this.agentHeaders(preparedCall)
		});
	}
};
var toolMetadataSchema2 = record(string(), jsonValueSchema.optional());
var providerReferenceSchema2 = record(string(), string());
lazySchema(() => zodSchema(array$1(object$1({
	id: string(),
	role: _enum([
		"system",
		"user",
		"assistant"
	]),
	metadata: unknown().optional(),
	parts: array$1(union([
		object$1({
			type: literal("text"),
			text: string(),
			state: _enum(["streaming", "done"]).optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("reasoning"),
			text: string(),
			state: _enum(["streaming", "done"]).optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("custom"),
			kind: string(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("source-url"),
			sourceId: string(),
			url: string(),
			title: string().optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("source-document"),
			sourceId: string(),
			mediaType: string(),
			title: string(),
			filename: string().optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("file"),
			mediaType: string(),
			filename: string().optional(),
			url: string(),
			providerReference: providerReferenceSchema2.optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("reasoning-file"),
			mediaType: string(),
			url: string(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({ type: literal("step-start") }),
		object$1({
			type: string().startsWith("data-"),
			id: string().optional(),
			data: unknown()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("input-streaming"),
			input: unknown().optional(),
			providerExecuted: boolean().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			output: never().optional(),
			errorText: never().optional(),
			approval: never().optional()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("input-available"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: never().optional()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("approval-requested"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: never().optional(),
				reason: never().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			})
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("approval-responded"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: boolean(),
				reason: string().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			})
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("output-available"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: unknown(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			resultProviderMetadata: providerMetadataSchema.optional(),
			preliminary: boolean().optional(),
			approval: object$1({
				id: string(),
				approved: literal(true),
				reason: string().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			}).optional()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("output-error"),
			input: unknown().optional(),
			rawInput: unknown().optional(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: string(),
			callProviderMetadata: providerMetadataSchema.optional(),
			resultProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: literal(true),
				reason: string().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			}).optional()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("output-denied"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: literal(false),
				reason: string().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			})
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("input-streaming"),
			providerExecuted: boolean().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			input: unknown().optional(),
			output: never().optional(),
			errorText: never().optional(),
			approval: never().optional()
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("input-available"),
			providerExecuted: boolean().optional(),
			input: unknown(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: never().optional()
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("approval-requested"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: never().optional(),
				reason: never().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			})
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("approval-responded"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: boolean(),
				reason: string().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			})
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("output-available"),
			providerExecuted: boolean().optional(),
			input: unknown(),
			output: unknown(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			resultProviderMetadata: providerMetadataSchema.optional(),
			preliminary: boolean().optional(),
			approval: object$1({
				id: string(),
				approved: literal(true),
				reason: string().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			}).optional()
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("output-error"),
			providerExecuted: boolean().optional(),
			input: unknown().optional(),
			rawInput: unknown().optional(),
			output: never().optional(),
			errorText: string(),
			callProviderMetadata: providerMetadataSchema.optional(),
			resultProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: literal(true),
				reason: string().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			}).optional()
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: literal("output-denied"),
			providerExecuted: boolean().optional(),
			input: unknown(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: literal(false),
				reason: string().optional(),
				isAutomatic: boolean().optional(),
				signature: string().optional()
			})
		})
	])).nonempty("Message must contain at least one part")
})).nonempty("Messages array must not be empty")));
createIdGenerator({
	prefix: "call",
	size: 24
});
createIdGenerator({
	prefix: "call",
	size: 24
});
function convertDataContentToBase64String(content) {
	if (typeof content === "string") return content;
	if (content instanceof ArrayBuffer) return convertUint8ArrayToBase64(new Uint8Array(content));
	return convertUint8ArrayToBase64(content);
}
createIdGenerator({
	prefix: "aiobj",
	size: 24
});
function createDownload(options) {
	return ({ url, abortSignal }) => download({
		url,
		maxBytes: options == null ? void 0 : options.maxBytes,
		abortSignal
	});
}
createIdGenerator({
	prefix: "aiobj",
	size: 24
});
createIdGenerator({
	prefix: "call",
	size: 24
});
//#endregion
//#region ../../node_modules/.pnpm/ai@7.0.17_zod@4.4.3/node_modules/ai/dist/test/index.js
function notImplemented() {
	throw new Error("Not implemented");
}
var MockLanguageModelV3 = class {
	constructor({ provider = "mock-provider", modelId = "mock-model-id", supportedUrls = {}, doGenerate = notImplemented, doStream = notImplemented } = {}) {
		this.specificationVersion = "v3";
		this.doGenerateCalls = [];
		this.doStreamCalls = [];
		this.provider = provider;
		this.modelId = modelId;
		this.doGenerate = async (options) => {
			this.doGenerateCalls.push(options);
			if (typeof doGenerate === "function") return await doGenerate(options);
			else if (Array.isArray(doGenerate)) return doGenerate[this.doGenerateCalls.length - 1];
			else return doGenerate;
		};
		this.doStream = async (options) => {
			this.doStreamCalls.push(options);
			if (typeof doStream === "function") return await doStream(options);
			else if (Array.isArray(doStream)) return doStream[this.doStreamCalls.length - 1];
			else return doStream;
		};
		this._supportedUrls = typeof supportedUrls === "function" ? supportedUrls : async () => await supportedUrls;
	}
	get supportedUrls() {
		return this._supportedUrls();
	}
};
//#endregion
export { getStaticToolName as A, parsePartialJson as B, convertDataContentToBase64String as C, filterActiveTools as D, createUIMessageStreamResponse as E, isStaticToolUIPart as F, streamText as G, pipeUIMessageStreamToResponse as H, isStepCount as I, toUIMessageChunk as J, systemModelMessageSchema as K, isToolUIPart as L, getToolTimeoutMs as M, getTotalTimeoutMs as N, generateText as O, isDynamicToolUIPart as P, modelMessageSchema as R, consumeStream as S, createTextStreamResponse as T, registerTelemetry as U, pipeTextStreamToResponse as V, streamLanguageModelCall as W, toolModelMessageSchema as X, toUIMessageStream as Y, userModelMessageSchema as Z, ToolLoopAgent as _, InvalidMessageRoleError as a, UnsupportedModelVersionError as b, InvalidToolInputError as c, NoObjectGeneratedError as d, NoOutputGeneratedError as f, ToolCallRepairError as g, ToolCallNotFoundForApprovalError as h, InvalidDataContentError as i, getStepTimeoutMs as j, getChunkTimeoutMs as k, JsonToSseTransformStream as l, RetryError as m, DefaultGeneratedFile as n, InvalidToolApprovalError as o, NoSuchToolError as p, toTextStream as q, InvalidArgumentError as r, InvalidToolApprovalSignatureError as s, MockLanguageModelV3 as t, MissingToolResultsError as u, UIMessageStreamError as v, createDownload as w, assistantModelMessageSchema as x, UI_MESSAGE_STREAM_HEADERS as y, output_exports as z };

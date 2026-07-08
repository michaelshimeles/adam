import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/values/base64.js
var lookup = [];
var revLookup = [];
var Arr = Uint8Array;
var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (var i = 0, len = code.length; i < len; ++i) {
	lookup[i] = code[i];
	revLookup[code.charCodeAt(i)] = i;
}
revLookup["-".charCodeAt(0)] = 62;
revLookup["_".charCodeAt(0)] = 63;
function getLens(b64) {
	var len = b64.length;
	if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
	var validLen = b64.indexOf("=");
	if (validLen === -1) validLen = len;
	var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
	return [validLen, placeHoldersLen];
}
function _byteLength(_b64, validLen, placeHoldersLen) {
	return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function toByteArray(b64) {
	var tmp;
	var lens = getLens(b64);
	var validLen = lens[0];
	var placeHoldersLen = lens[1];
	var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
	var curByte = 0;
	var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
	var i;
	for (i = 0; i < len; i += 4) {
		tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
		arr[curByte++] = tmp >> 16 & 255;
		arr[curByte++] = tmp >> 8 & 255;
		arr[curByte++] = tmp & 255;
	}
	if (placeHoldersLen === 2) {
		tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
		arr[curByte++] = tmp & 255;
	}
	if (placeHoldersLen === 1) {
		tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
		arr[curByte++] = tmp >> 8 & 255;
		arr[curByte++] = tmp & 255;
	}
	return arr;
}
function tripletToBase64(num) {
	return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
	var tmp;
	var output = [];
	for (var i = start; i < end; i += 3) {
		tmp = (uint8[i] << 16 & 16711680) + (uint8[i + 1] << 8 & 65280) + (uint8[i + 2] & 255);
		output.push(tripletToBase64(tmp));
	}
	return output.join("");
}
function fromByteArray(uint8) {
	var tmp;
	var len = uint8.length;
	var extraBytes = len % 3;
	var parts = [];
	var maxChunkLength = 16383;
	for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
	if (extraBytes === 1) {
		tmp = uint8[len - 1];
		parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
	} else if (extraBytes === 2) {
		tmp = (uint8[len - 2] << 8) + uint8[len - 1];
		parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
	}
	return parts.join("");
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/common/index.js
function parseArgs(args) {
	if (args === void 0) return {};
	if (!isSimpleObject(args)) throw new Error(`The arguments to a Convex function must be an object. Received: ${args}`);
	return args;
}
function validateDeploymentUrl(deploymentUrl) {
	if (typeof deploymentUrl === "undefined") throw new Error(`Client created with undefined deployment address. If you used an environment variable, check that it's set.`);
	if (typeof deploymentUrl !== "string") throw new Error(`Invalid deployment address: found ${deploymentUrl}".`);
	if (!(deploymentUrl.startsWith("http:") || deploymentUrl.startsWith("https:"))) throw new Error(`Invalid deployment address: Must start with "https://" or "http://". Found "${deploymentUrl}".`);
	try {
		new URL(deploymentUrl);
	} catch {
		throw new Error(`Invalid deployment address: "${deploymentUrl}" is not a valid URL. If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`);
	}
	if (deploymentUrl.endsWith(".convex.site")) throw new Error(`Invalid deployment address: "${deploymentUrl}" ends with .convex.site, which is used for HTTP Actions. Convex deployment URLs typically end with .convex.cloud? If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`);
}
function isSimpleObject(value) {
	const isObject = typeof value === "object";
	const prototype = Object.getPrototypeOf(value);
	const isSimple = prototype === null || prototype === Object.prototype || prototype?.constructor?.name === "Object";
	return isObject && isSimple;
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/values/value.js
const LITTLE_ENDIAN = true;
const MIN_INT64 = BigInt("-9223372036854775808");
const MAX_INT64 = BigInt("9223372036854775807");
const ZERO = BigInt("0");
const EIGHT = BigInt("8");
const TWOFIFTYSIX = BigInt("256");
function isSpecial(n) {
	return Number.isNaN(n) || !Number.isFinite(n) || Object.is(n, -0);
}
function slowBigIntToBase64(value) {
	if (value < ZERO) value -= MIN_INT64 + MIN_INT64;
	let hex = value.toString(16);
	if (hex.length % 2 === 1) hex = "0" + hex;
	const bytes = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(8));
	let i = 0;
	for (const hexByte of hex.match(/.{2}/g).reverse()) {
		bytes.set([parseInt(hexByte, 16)], i++);
		value >>= EIGHT;
	}
	return fromByteArray(bytes);
}
function slowBase64ToBigInt(encoded) {
	const integerBytes = toByteArray(encoded);
	if (integerBytes.byteLength !== 8) throw new Error(`Received ${integerBytes.byteLength} bytes, expected 8 for $integer`);
	let value = ZERO;
	let power = ZERO;
	for (const byte of integerBytes) {
		value += BigInt(byte) * TWOFIFTYSIX ** power;
		power++;
	}
	if (value > MAX_INT64) value += MIN_INT64 + MIN_INT64;
	return value;
}
function modernBigIntToBase64(value) {
	if (value < MIN_INT64 || MAX_INT64 < value) throw new Error(`BigInt ${value} does not fit into a 64-bit signed integer.`);
	const buffer = /* @__PURE__ */ new ArrayBuffer(8);
	new DataView(buffer).setBigInt64(0, value, true);
	return fromByteArray(new Uint8Array(buffer));
}
function modernBase64ToBigInt(encoded) {
	const integerBytes = toByteArray(encoded);
	if (integerBytes.byteLength !== 8) throw new Error(`Received ${integerBytes.byteLength} bytes, expected 8 for $integer`);
	return new DataView(integerBytes.buffer).getBigInt64(0, true);
}
const bigIntToBase64 = DataView.prototype.setBigInt64 ? modernBigIntToBase64 : slowBigIntToBase64;
const base64ToBigInt = DataView.prototype.getBigInt64 ? modernBase64ToBigInt : slowBase64ToBigInt;
const MAX_IDENTIFIER_LEN = 1024;
function validateObjectField(k) {
	if (k.length > MAX_IDENTIFIER_LEN) throw new Error(`Field name ${k} exceeds maximum field name length ${MAX_IDENTIFIER_LEN}.`);
	if (k.startsWith("$")) throw new Error(`Field name ${k} starts with a '$', which is reserved.`);
	for (let i = 0; i < k.length; i += 1) {
		const charCode = k.charCodeAt(i);
		if (charCode < 32 || charCode >= 127) throw new Error(`Field name ${k} has invalid character '${k[i]}': Field names can only contain non-control ASCII characters`);
	}
}
function jsonToConvex(value) {
	if (value === null) return value;
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value;
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value.map((value2) => jsonToConvex(value2));
	if (typeof value !== "object") throw new Error(`Unexpected type of ${value}`);
	const entries = Object.entries(value);
	if (entries.length === 1) {
		const key = entries[0][0];
		if (key === "$bytes") {
			if (typeof value.$bytes !== "string") throw new Error(`Malformed $bytes field on ${value}`);
			return toByteArray(value.$bytes).buffer;
		}
		if (key === "$integer") {
			if (typeof value.$integer !== "string") throw new Error(`Malformed $integer field on ${value}`);
			return base64ToBigInt(value.$integer);
		}
		if (key === "$float") {
			if (typeof value.$float !== "string") throw new Error(`Malformed $float field on ${value}`);
			const floatBytes = toByteArray(value.$float);
			if (floatBytes.byteLength !== 8) throw new Error(`Received ${floatBytes.byteLength} bytes, expected 8 for $float`);
			const float = new DataView(floatBytes.buffer).getFloat64(0, LITTLE_ENDIAN);
			if (!isSpecial(float)) throw new Error(`Float ${float} should be encoded as a number`);
			return float;
		}
		if (key === "$set") throw new Error(`Received a Set which is no longer supported as a Convex type.`);
		if (key === "$map") throw new Error(`Received a Map which is no longer supported as a Convex type.`);
	}
	const out = {};
	for (const [k, v] of Object.entries(value)) {
		validateObjectField(k);
		out[k] = jsonToConvex(v);
	}
	return out;
}
const MAX_VALUE_FOR_ERROR_LEN = 16384;
function stringifyValueForError(value) {
	const str = JSON.stringify(value, (_key, value2) => {
		if (value2 === void 0) return "undefined";
		if (typeof value2 === "bigint") return `${value2.toString()}n`;
		return value2;
	});
	if (str.length > MAX_VALUE_FOR_ERROR_LEN) {
		const rest = "[...truncated]";
		let truncateAt = MAX_VALUE_FOR_ERROR_LEN - 14;
		const codePoint = str.codePointAt(truncateAt - 1);
		if (codePoint !== void 0 && codePoint > 65535) truncateAt -= 1;
		return str.substring(0, truncateAt) + rest;
	}
	return str;
}
function convexToJsonInternal(value, originalValue, context, includeTopLevelUndefined) {
	if (value === void 0) {
		const contextText = context && ` (present at path ${context} in original object ${stringifyValueForError(originalValue)})`;
		throw new Error(`undefined is not a valid Convex value${contextText}. To learn about Convex's supported types, see https://docs.convex.dev/using/types.`);
	}
	if (value === null) return value;
	if (typeof value === "bigint") {
		if (value < MIN_INT64 || MAX_INT64 < value) throw new Error(`BigInt ${value} does not fit into a 64-bit signed integer.`);
		return { $integer: bigIntToBase64(value) };
	}
	if (typeof value === "number") if (isSpecial(value)) {
		const buffer = /* @__PURE__ */ new ArrayBuffer(8);
		new DataView(buffer).setFloat64(0, value, LITTLE_ENDIAN);
		return { $float: fromByteArray(new Uint8Array(buffer)) };
	} else return value;
	if (typeof value === "boolean") return value;
	if (typeof value === "string") return value;
	if (value instanceof ArrayBuffer) return { $bytes: fromByteArray(new Uint8Array(value)) };
	if (Array.isArray(value)) return value.map((value2, i) => convexToJsonInternal(value2, originalValue, context + `[${i}]`, false));
	if (value instanceof Set) throw new Error(errorMessageForUnsupportedType(context, "Set", [...value], originalValue));
	if (value instanceof Map) throw new Error(errorMessageForUnsupportedType(context, "Map", [...value], originalValue));
	if (!isSimpleObject(value)) {
		const theType = value?.constructor?.name;
		const typeName = theType ? `${theType} ` : "";
		throw new Error(errorMessageForUnsupportedType(context, typeName, value, originalValue));
	}
	const out = {};
	const entries = Object.entries(value);
	entries.sort(([k1, _v1], [k2, _v2]) => k1 === k2 ? 0 : k1 < k2 ? -1 : 1);
	for (const [k, v] of entries) if (v !== void 0) {
		validateObjectField(k);
		out[k] = convexToJsonInternal(v, originalValue, context + `.${k}`, false);
	} else if (includeTopLevelUndefined) {
		validateObjectField(k);
		out[k] = convexOrUndefinedToJsonInternal(v, originalValue, context + `.${k}`);
	}
	return out;
}
function errorMessageForUnsupportedType(context, typeName, value, originalValue) {
	if (context) return `${typeName}${stringifyValueForError(value)} is not a supported Convex type (present at path ${context} in original object ${stringifyValueForError(originalValue)}). To learn about Convex's supported types, see https://docs.convex.dev/using/types.`;
	else return `${typeName}${stringifyValueForError(value)} is not a supported Convex type.`;
}
function convexOrUndefinedToJsonInternal(value, originalValue, context) {
	if (value === void 0) return { $undefined: null };
	else {
		if (originalValue === void 0) throw new Error(`Programming error. Current value is ${stringifyValueForError(value)} but original value is undefined`);
		return convexToJsonInternal(value, originalValue, context, false);
	}
}
function convexToJson(value) {
	return convexToJsonInternal(value, value, "", false);
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/values/errors.js
var __defProp$12 = Object.defineProperty;
var __defNormalProp$12 = (obj, key, value) => key in obj ? __defProp$12(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$12 = (obj, key, value) => __defNormalProp$12(obj, typeof key !== "symbol" ? key + "" : key, value);
var _a, _b;
const IDENTIFYING_FIELD = Symbol.for("ConvexError");
var ConvexError = class extends (_b = Error, _a = IDENTIFYING_FIELD, _b) {
	constructor(data) {
		super(typeof data === "string" ? data : stringifyValueForError(data));
		__publicField$12(this, "name", "ConvexError");
		__publicField$12(this, "data");
		__publicField$12(this, _a, true);
		this.data = data;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/logging.js
var __defProp$11 = Object.defineProperty;
var __defNormalProp$11 = (obj, key, value) => key in obj ? __defProp$11(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$11 = (obj, key, value) => __defNormalProp$11(obj, typeof key !== "symbol" ? key + "" : key, value);
const INFO_COLOR = "color:rgb(0, 145, 255)";
function prefix_for_source(source) {
	switch (source) {
		case "query": return "Q";
		case "mutation": return "M";
		case "action": return "A";
		case "any": return "?";
	}
}
var DefaultLogger = class {
	constructor(options) {
		__publicField$11(this, "_onLogLineFuncs");
		__publicField$11(this, "_verbose");
		this._onLogLineFuncs = {};
		this._verbose = options.verbose;
	}
	addLogLineListener(func) {
		let id = Math.random().toString(36).substring(2, 15);
		for (let i = 0; i < 10; i++) {
			if (this._onLogLineFuncs[id] === void 0) break;
			id = Math.random().toString(36).substring(2, 15);
		}
		this._onLogLineFuncs[id] = func;
		return () => {
			delete this._onLogLineFuncs[id];
		};
	}
	logVerbose(...args) {
		if (this._verbose) for (const func of Object.values(this._onLogLineFuncs)) func("debug", `${(/* @__PURE__ */ new Date()).toISOString()}`, ...args);
	}
	log(...args) {
		for (const func of Object.values(this._onLogLineFuncs)) func("info", ...args);
	}
	warn(...args) {
		for (const func of Object.values(this._onLogLineFuncs)) func("warn", ...args);
	}
	error(...args) {
		for (const func of Object.values(this._onLogLineFuncs)) func("error", ...args);
	}
};
function instantiateDefaultLogger(options) {
	const logger = new DefaultLogger(options);
	logger.addLogLineListener((level, ...args) => {
		switch (level) {
			case "debug":
				console.debug(...args);
				break;
			case "info":
				console.log(...args);
				break;
			case "warn":
				console.warn(...args);
				break;
			case "error":
				console.error(...args);
				break;
			default: console.log(...args);
		}
	});
	return logger;
}
function instantiateNoopLogger(options) {
	return new DefaultLogger(options);
}
function logForFunction(logger, type, source, udfPath, message) {
	const prefix = prefix_for_source(source);
	if (typeof message === "object") message = `ConvexError ${JSON.stringify(message.errorData, null, 2)}`;
	if (type === "info") {
		const match = message.match(/^\[.*?\] /);
		if (match === null) {
			logger.error(`[CONVEX ${prefix}(${udfPath})] Could not parse console.log`);
			return;
		}
		const level = message.slice(1, match[0].length - 2);
		const args = message.slice(match[0].length);
		logger.log(`%c[CONVEX ${prefix}(${udfPath})] [${level}]`, INFO_COLOR, args);
	} else logger.error(`[CONVEX ${prefix}(${udfPath})] ${message}`);
}
function logFatalError(logger, message) {
	const errorMessage = `[CONVEX FATAL ERROR] ${message}`;
	logger.error(errorMessage);
	return new Error(errorMessage);
}
function createHybridErrorStacktrace(source, udfPath, result) {
	return `[CONVEX ${prefix_for_source(source)}(${udfPath})] ${result.errorMessage}
  Called by client`;
}
function forwardData(result, error) {
	error.data = result.errorData;
	return error;
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/udf_path_utils.js
function canonicalizeUdfPath(udfPath) {
	const pieces = udfPath.split(":");
	let moduleName;
	let functionName;
	if (pieces.length === 1) {
		moduleName = pieces[0];
		functionName = "default";
	} else {
		moduleName = pieces.slice(0, pieces.length - 1).join(":");
		functionName = pieces[pieces.length - 1];
	}
	if (moduleName.endsWith(".js")) moduleName = moduleName.slice(0, -3);
	return `${moduleName}:${functionName}`;
}
function serializePathAndArgs(udfPath, args) {
	return JSON.stringify({
		udfPath: canonicalizeUdfPath(udfPath),
		args: convexToJson(args)
	});
}
function serializePaginatedPathAndArgs(udfPath, args, options) {
	const { initialNumItems, id } = options;
	return JSON.stringify({
		type: "paginated",
		udfPath: canonicalizeUdfPath(udfPath),
		args: convexToJson(args),
		options: convexToJson({
			initialNumItems,
			id
		})
	});
}
function serializedQueryTokenIsPaginated(token) {
	return JSON.parse(token).type === "paginated";
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/local_state.js
var __defProp$10 = Object.defineProperty;
var __defNormalProp$10 = (obj, key, value) => key in obj ? __defProp$10(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$10 = (obj, key, value) => __defNormalProp$10(obj, typeof key !== "symbol" ? key + "" : key, value);
var LocalSyncState = class {
	constructor() {
		__publicField$10(this, "nextQueryId");
		__publicField$10(this, "querySetVersion");
		__publicField$10(this, "querySet");
		__publicField$10(this, "queryIdToToken");
		__publicField$10(this, "identityVersion");
		__publicField$10(this, "auth");
		__publicField$10(this, "outstandingQueriesOlderThanRestart");
		__publicField$10(this, "outstandingAuthOlderThanRestart");
		__publicField$10(this, "paused");
		__publicField$10(this, "pendingQuerySetModifications");
		this.nextQueryId = 0;
		this.querySetVersion = 0;
		this.identityVersion = 0;
		this.querySet = /* @__PURE__ */ new Map();
		this.queryIdToToken = /* @__PURE__ */ new Map();
		this.outstandingQueriesOlderThanRestart = /* @__PURE__ */ new Set();
		this.outstandingAuthOlderThanRestart = false;
		this.paused = false;
		this.pendingQuerySetModifications = /* @__PURE__ */ new Map();
	}
	hasSyncedPastLastReconnect() {
		return this.outstandingQueriesOlderThanRestart.size === 0 && !this.outstandingAuthOlderThanRestart;
	}
	markAuthCompletion() {
		this.outstandingAuthOlderThanRestart = false;
	}
	subscribe(udfPath, args, journal, componentPath) {
		const canonicalizedUdfPath = canonicalizeUdfPath(udfPath);
		const queryToken = serializePathAndArgs(canonicalizedUdfPath, args);
		const existingEntry = this.querySet.get(queryToken);
		if (existingEntry !== void 0) {
			existingEntry.numSubscribers += 1;
			return {
				queryToken,
				modification: null,
				unsubscribe: () => this.removeSubscriber(queryToken)
			};
		} else {
			const queryId = this.nextQueryId++;
			const query = {
				id: queryId,
				canonicalizedUdfPath,
				args,
				numSubscribers: 1,
				journal,
				componentPath
			};
			this.querySet.set(queryToken, query);
			this.queryIdToToken.set(queryId, queryToken);
			const baseVersion = this.querySetVersion;
			const newVersion = this.querySetVersion + 1;
			const add = {
				type: "Add",
				queryId,
				udfPath: canonicalizedUdfPath,
				args: [convexToJson(args)],
				journal,
				componentPath
			};
			if (this.paused) this.pendingQuerySetModifications.set(queryId, add);
			else this.querySetVersion = newVersion;
			return {
				queryToken,
				modification: {
					type: "ModifyQuerySet",
					baseVersion,
					newVersion,
					modifications: [add]
				},
				unsubscribe: () => this.removeSubscriber(queryToken)
			};
		}
	}
	transition(transition) {
		for (const modification of transition.modifications) switch (modification.type) {
			case "QueryUpdated":
			case "QueryFailed": {
				this.outstandingQueriesOlderThanRestart.delete(modification.queryId);
				const journal = modification.journal;
				if (journal !== void 0) {
					const queryToken = this.queryIdToToken.get(modification.queryId);
					if (queryToken !== void 0) this.querySet.get(queryToken).journal = journal;
				}
				break;
			}
			case "QueryRemoved":
				this.outstandingQueriesOlderThanRestart.delete(modification.queryId);
				break;
			default: throw new Error(`Invalid modification ${modification.type}`);
		}
	}
	queryId(udfPath, args) {
		const queryToken = serializePathAndArgs(canonicalizeUdfPath(udfPath), args);
		const existingEntry = this.querySet.get(queryToken);
		if (existingEntry !== void 0) return existingEntry.id;
		return null;
	}
	isCurrentOrNewerAuthVersion(version) {
		return version >= this.identityVersion;
	}
	getAuth() {
		return this.auth;
	}
	setAuth(value) {
		this.auth = {
			tokenType: "User",
			value
		};
		const baseVersion = this.identityVersion;
		if (!this.paused) this.identityVersion = baseVersion + 1;
		return {
			type: "Authenticate",
			baseVersion,
			...this.auth
		};
	}
	setAdminAuth(value, actingAs) {
		const auth = {
			tokenType: "Admin",
			value,
			impersonating: actingAs
		};
		this.auth = auth;
		const baseVersion = this.identityVersion;
		if (!this.paused) this.identityVersion = baseVersion + 1;
		return {
			type: "Authenticate",
			baseVersion,
			...auth
		};
	}
	clearAuth() {
		this.auth = void 0;
		this.markAuthCompletion();
		const baseVersion = this.identityVersion;
		if (!this.paused) this.identityVersion = baseVersion + 1;
		return {
			type: "Authenticate",
			tokenType: "None",
			baseVersion
		};
	}
	hasAuth() {
		return !!this.auth;
	}
	isNewAuth(value) {
		return this.auth?.value !== value;
	}
	queryPath(queryId) {
		const pathAndArgs = this.queryIdToToken.get(queryId);
		if (pathAndArgs) return this.querySet.get(pathAndArgs).canonicalizedUdfPath;
		return null;
	}
	queryArgs(queryId) {
		const pathAndArgs = this.queryIdToToken.get(queryId);
		if (pathAndArgs) return this.querySet.get(pathAndArgs).args;
		return null;
	}
	queryToken(queryId) {
		return this.queryIdToToken.get(queryId) ?? null;
	}
	queryJournal(queryToken) {
		return this.querySet.get(queryToken)?.journal;
	}
	restart() {
		this.unpause();
		this.outstandingQueriesOlderThanRestart.clear();
		const modifications = [];
		for (const localQuery of this.querySet.values()) {
			const add = {
				type: "Add",
				queryId: localQuery.id,
				udfPath: localQuery.canonicalizedUdfPath,
				args: [convexToJson(localQuery.args)],
				journal: localQuery.journal,
				componentPath: localQuery.componentPath
			};
			modifications.push(add);
			this.outstandingQueriesOlderThanRestart.add(localQuery.id);
		}
		this.querySetVersion = 1;
		const querySet = {
			type: "ModifyQuerySet",
			baseVersion: 0,
			newVersion: 1,
			modifications
		};
		if (!this.auth) {
			this.identityVersion = 0;
			return [querySet, void 0];
		}
		this.outstandingAuthOlderThanRestart = true;
		const authenticate = {
			type: "Authenticate",
			baseVersion: 0,
			...this.auth
		};
		this.identityVersion = 1;
		return [querySet, authenticate];
	}
	pause() {
		this.paused = true;
	}
	resume() {
		const querySet = this.pendingQuerySetModifications.size > 0 ? {
			type: "ModifyQuerySet",
			baseVersion: this.querySetVersion,
			newVersion: ++this.querySetVersion,
			modifications: Array.from(this.pendingQuerySetModifications.values())
		} : void 0;
		const authenticate = this.auth !== void 0 ? {
			type: "Authenticate",
			baseVersion: this.identityVersion++,
			...this.auth
		} : void 0;
		this.unpause();
		return [querySet, authenticate];
	}
	unpause() {
		this.paused = false;
		this.pendingQuerySetModifications.clear();
	}
	removeSubscriber(queryToken) {
		const localQuery = this.querySet.get(queryToken);
		if (localQuery.numSubscribers > 1) {
			localQuery.numSubscribers -= 1;
			return null;
		} else {
			this.querySet.delete(queryToken);
			this.queryIdToToken.delete(localQuery.id);
			this.outstandingQueriesOlderThanRestart.delete(localQuery.id);
			const baseVersion = this.querySetVersion;
			const newVersion = this.querySetVersion + 1;
			const remove = {
				type: "Remove",
				queryId: localQuery.id
			};
			if (this.paused) if (this.pendingQuerySetModifications.has(localQuery.id)) this.pendingQuerySetModifications.delete(localQuery.id);
			else this.pendingQuerySetModifications.set(localQuery.id, remove);
			else this.querySetVersion = newVersion;
			return {
				type: "ModifyQuerySet",
				baseVersion,
				newVersion,
				modifications: [remove]
			};
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/request_manager.js
var __defProp$9 = Object.defineProperty;
var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$9 = (obj, key, value) => __defNormalProp$9(obj, typeof key !== "symbol" ? key + "" : key, value);
var RequestManager = class {
	constructor(logger, markConnectionStateDirty) {
		this.logger = logger;
		this.markConnectionStateDirty = markConnectionStateDirty;
		__publicField$9(this, "inflightRequests");
		__publicField$9(this, "requestsOlderThanRestart");
		__publicField$9(this, "inflightMutationsCount", 0);
		__publicField$9(this, "inflightActionsCount", 0);
		this.inflightRequests = /* @__PURE__ */ new Map();
		this.requestsOlderThanRestart = /* @__PURE__ */ new Set();
	}
	request(message, sent) {
		const result = new Promise((resolve) => {
			const status = sent ? "Requested" : "NotSent";
			this.inflightRequests.set(message.requestId, {
				message,
				status: {
					status,
					requestedAt: /* @__PURE__ */ new Date(),
					onResult: resolve
				}
			});
			if (message.type === "Mutation") this.inflightMutationsCount++;
			else if (message.type === "Action") this.inflightActionsCount++;
		});
		this.markConnectionStateDirty();
		return result;
	}
	/**
	* Update the state after receiving a response.
	*
	* @returns A RequestId if the request is complete and its optimistic update
	* can be dropped, null otherwise.
	*/
	onResponse(response) {
		const requestInfo = this.inflightRequests.get(response.requestId);
		if (requestInfo === void 0) return null;
		if (requestInfo.status.status === "Completed") return null;
		const udfType = requestInfo.message.type === "Mutation" ? "mutation" : "action";
		const udfPath = requestInfo.message.udfPath;
		for (const line of response.logLines) logForFunction(this.logger, "info", udfType, udfPath, line);
		const status = requestInfo.status;
		let result;
		let onResolve;
		if (response.success) {
			result = {
				success: true,
				logLines: response.logLines,
				value: jsonToConvex(response.result)
			};
			onResolve = () => status.onResult(result);
		} else {
			const errorMessage = response.result;
			const { errorData } = response;
			logForFunction(this.logger, "error", udfType, udfPath, errorMessage);
			result = {
				success: false,
				errorMessage,
				errorData: errorData !== void 0 ? jsonToConvex(errorData) : void 0,
				logLines: response.logLines
			};
			onResolve = () => status.onResult(result);
		}
		if (response.type === "ActionResponse" || !response.success) {
			onResolve();
			this.inflightRequests.delete(response.requestId);
			this.requestsOlderThanRestart.delete(response.requestId);
			if (requestInfo.message.type === "Action") this.inflightActionsCount--;
			else if (requestInfo.message.type === "Mutation") this.inflightMutationsCount--;
			this.markConnectionStateDirty();
			return {
				requestId: response.requestId,
				result
			};
		}
		requestInfo.status = {
			status: "Completed",
			result,
			ts: response.ts,
			onResolve
		};
		return null;
	}
	removeCompleted(ts) {
		const completeRequests = /* @__PURE__ */ new Map();
		for (const [requestId, requestInfo] of this.inflightRequests.entries()) {
			const status = requestInfo.status;
			if (status.status === "Completed" && status.ts.lessThanOrEqual(ts)) {
				status.onResolve();
				completeRequests.set(requestId, status.result);
				if (requestInfo.message.type === "Mutation") this.inflightMutationsCount--;
				else if (requestInfo.message.type === "Action") this.inflightActionsCount--;
				this.inflightRequests.delete(requestId);
				this.requestsOlderThanRestart.delete(requestId);
			}
		}
		if (completeRequests.size > 0) this.markConnectionStateDirty();
		return completeRequests;
	}
	restart() {
		this.requestsOlderThanRestart = new Set(this.inflightRequests.keys());
		const allMessages = [];
		for (const [requestId, value] of this.inflightRequests) {
			if (value.status.status === "NotSent") {
				value.status.status = "Requested";
				allMessages.push(value.message);
				continue;
			}
			if (value.message.type === "Mutation") allMessages.push(value.message);
			else if (value.message.type === "Action") {
				this.inflightRequests.delete(requestId);
				this.requestsOlderThanRestart.delete(requestId);
				this.inflightActionsCount--;
				if (value.status.status === "Completed") throw new Error("Action should never be in 'Completed' state");
				value.status.onResult({
					success: false,
					errorMessage: "Connection lost while action was in flight",
					logLines: []
				});
			}
		}
		this.markConnectionStateDirty();
		return allMessages;
	}
	resume() {
		const allMessages = [];
		for (const [, value] of this.inflightRequests) if (value.status.status === "NotSent") {
			value.status.status = "Requested";
			allMessages.push(value.message);
			continue;
		}
		return allMessages;
	}
	/**
	* @returns true if there are any requests that have been requested but have
	* not be completed yet.
	*/
	hasIncompleteRequests() {
		for (const requestInfo of this.inflightRequests.values()) if (requestInfo.status.status === "Requested") return true;
		return false;
	}
	/**
	* @returns true if there are any inflight requests, including ones that have
	* completed on the server, but have not been applied.
	*/
	hasInflightRequests() {
		return this.inflightRequests.size > 0;
	}
	/**
	* @returns true if there are any inflight requests, that have been hanging around
	* since prior to the most recent restart.
	*/
	hasSyncedPastLastReconnect() {
		return this.requestsOlderThanRestart.size === 0;
	}
	timeOfOldestInflightRequest() {
		if (this.inflightRequests.size === 0) return null;
		let oldestInflightRequest = Date.now();
		for (const request of this.inflightRequests.values()) if (request.status.status !== "Completed") {
			if (request.status.requestedAt.getTime() < oldestInflightRequest) oldestInflightRequest = request.status.requestedAt.getTime();
		}
		return new Date(oldestInflightRequest);
	}
	/**
	* @returns The number of mutations currently in flight.
	*/
	inflightMutations() {
		return this.inflightMutationsCount;
	}
	/**
	* @returns The number of actions currently in flight.
	*/
	inflightActions() {
		return this.inflightActionsCount;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/server/functionName.js
const functionName = Symbol.for("functionName");
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/server/components/paths.js
const toReferencePath = Symbol.for("toReferencePath");
function extractReferencePath(reference) {
	return reference[toReferencePath] ?? null;
}
function isFunctionHandle(s) {
	return s.startsWith("function://");
}
function getFunctionAddress(functionReference) {
	let functionAddress;
	if (typeof functionReference === "string") if (isFunctionHandle(functionReference)) functionAddress = { functionHandle: functionReference };
	else functionAddress = { name: functionReference };
	else if (functionReference[functionName]) functionAddress = { name: functionReference[functionName] };
	else {
		const referencePath = extractReferencePath(functionReference);
		if (!referencePath) throw new Error(`${functionReference} is not a functionReference`);
		functionAddress = { reference: referencePath };
	}
	return functionAddress;
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/server/api.js
function getFunctionName(functionReference) {
	const address = getFunctionAddress(functionReference);
	if (address.name === void 0) {
		if (address.functionHandle !== void 0) throw new Error(`Expected function reference like "api.file.func" or "internal.file.func", but received function handle ${address.functionHandle}`);
		else if (address.reference !== void 0) throw new Error(`Expected function reference in the current component like "api.file.func" or "internal.file.func", but received reference ${address.reference}`);
		throw new Error(`Expected function reference like "api.file.func" or "internal.file.func", but received ${JSON.stringify(address)}`);
	}
	if (typeof functionReference === "string") return functionReference;
	const name = functionReference[functionName];
	if (!name) throw new Error(`${functionReference} is not a functionReference`);
	return name;
}
function makeFunctionReference(name) {
	return { [functionName]: name };
}
function createApi(pathParts = []) {
	return new Proxy({}, { get(_, prop) {
		if (typeof prop === "string") return createApi([...pathParts, prop]);
		else if (prop === functionName) {
			if (pathParts.length < 2) {
				const found = ["api", ...pathParts].join(".");
				throw new Error(`API path is expected to be of the form \`api.moduleName.functionName\`. Found: \`${found}\``);
			}
			const path = pathParts.slice(0, -1).join("/");
			const exportName = pathParts[pathParts.length - 1];
			if (exportName === "default") return path;
			else return path + ":" + exportName;
		} else if (prop === Symbol.toStringTag) return "FunctionReference";
		else return;
	} });
}
const anyApi = createApi();
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/optimistic_updates_impl.js
var __defProp$8 = Object.defineProperty;
var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$8 = (obj, key, value) => __defNormalProp$8(obj, typeof key !== "symbol" ? key + "" : key, value);
var OptimisticLocalStoreImpl = class OptimisticLocalStoreImpl {
	constructor(queryResults) {
		__publicField$8(this, "queryResults");
		__publicField$8(this, "modifiedQueries");
		this.queryResults = queryResults;
		this.modifiedQueries = [];
	}
	getQuery(query, ...args) {
		const queryArgs = parseArgs(args[0]);
		const name = getFunctionName(query);
		const queryResult = this.queryResults.get(serializePathAndArgs(name, queryArgs));
		if (queryResult === void 0) return;
		return OptimisticLocalStoreImpl.queryValue(queryResult.result);
	}
	getAllQueries(query) {
		const queriesWithName = [];
		const name = getFunctionName(query);
		for (const queryResult of this.queryResults.values()) if (queryResult.udfPath === canonicalizeUdfPath(name)) queriesWithName.push({
			args: queryResult.args,
			value: OptimisticLocalStoreImpl.queryValue(queryResult.result)
		});
		return queriesWithName;
	}
	setQuery(queryReference, args, value) {
		const queryArgs = parseArgs(args);
		const name = getFunctionName(queryReference);
		const queryToken = serializePathAndArgs(name, queryArgs);
		let result;
		if (value === void 0) result = void 0;
		else result = {
			success: true,
			value,
			logLines: []
		};
		const query = {
			udfPath: name,
			args: queryArgs,
			result
		};
		this.queryResults.set(queryToken, query);
		this.modifiedQueries.push(queryToken);
	}
	static queryValue(result) {
		if (result === void 0) return;
		else if (result.success) return result.value;
		else return;
	}
};
var OptimisticQueryResults = class {
	constructor() {
		__publicField$8(this, "queryResults");
		__publicField$8(this, "optimisticUpdates");
		this.queryResults = /* @__PURE__ */ new Map();
		this.optimisticUpdates = [];
	}
	/**
	* Apply all optimistic updates on top of server query results
	*/
	ingestQueryResultsFromServer(serverQueryResults, optimisticUpdatesToDrop) {
		this.optimisticUpdates = this.optimisticUpdates.filter((updateAndId) => {
			return !optimisticUpdatesToDrop.has(updateAndId.mutationId);
		});
		const oldQueryResults = this.queryResults;
		this.queryResults = new Map(serverQueryResults);
		const localStore = new OptimisticLocalStoreImpl(this.queryResults);
		for (const updateAndId of this.optimisticUpdates) updateAndId.update(localStore);
		const changedQueries = [];
		for (const [queryToken, query] of this.queryResults) {
			const oldQuery = oldQueryResults.get(queryToken);
			if (oldQuery === void 0 || oldQuery.result !== query.result) changedQueries.push(queryToken);
		}
		return changedQueries;
	}
	applyOptimisticUpdate(update, mutationId) {
		this.optimisticUpdates.push({
			update,
			mutationId
		});
		const localStore = new OptimisticLocalStoreImpl(this.queryResults);
		update(localStore);
		return localStore.modifiedQueries;
	}
	/**
	* "Raw" with respect to errors vs values, but query results still have
	* optimistic updates applied.
	*
	* @internal
	*/
	rawQueryResult(queryToken) {
		const query = this.queryResults.get(queryToken);
		if (query === void 0) return;
		return query.result;
	}
	queryResult(queryToken) {
		const query = this.queryResults.get(queryToken);
		if (query === void 0) return;
		const result = query.result;
		if (result === void 0) return;
		else if (result.success) return result.value;
		else {
			if (result.errorData !== void 0) throw forwardData(result, new ConvexError(createHybridErrorStacktrace("query", query.udfPath, result)));
			throw new Error(createHybridErrorStacktrace("query", query.udfPath, result));
		}
	}
	hasQueryResult(queryToken) {
		return this.queryResults.get(queryToken) !== void 0;
	}
	/**
	* @internal
	*/
	queryLogs(queryToken) {
		return this.queryResults.get(queryToken)?.result?.logLines;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/vendor/long.js
var __defProp$7 = Object.defineProperty;
var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$7 = (obj, key, value) => __defNormalProp$7(obj, typeof key !== "symbol" ? key + "" : key, value);
var Long = class Long {
	constructor(low, high) {
		__publicField$7(this, "low");
		__publicField$7(this, "high");
		__publicField$7(this, "__isUnsignedLong__");
		this.low = low | 0;
		this.high = high | 0;
		this.__isUnsignedLong__ = true;
	}
	static isLong(obj) {
		return (obj && obj.__isUnsignedLong__) === true;
	}
	static fromBytesLE(bytes) {
		return new Long(bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24, bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24);
	}
	toBytesLE() {
		const hi = this.high;
		const lo = this.low;
		return [
			lo & 255,
			lo >>> 8 & 255,
			lo >>> 16 & 255,
			lo >>> 24,
			hi & 255,
			hi >>> 8 & 255,
			hi >>> 16 & 255,
			hi >>> 24
		];
	}
	static fromNumber(value) {
		if (isNaN(value)) return UZERO;
		if (value < 0) return UZERO;
		if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
		return new Long(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0);
	}
	toString() {
		return (BigInt(this.high) * BigInt(TWO_PWR_32_DBL) + BigInt(this.low)).toString();
	}
	equals(other) {
		if (!Long.isLong(other)) other = Long.fromValue(other);
		if (this.high >>> 31 === 1 && other.high >>> 31 === 1) return false;
		return this.high === other.high && this.low === other.low;
	}
	notEquals(other) {
		return !this.equals(other);
	}
	comp(other) {
		if (!Long.isLong(other)) other = Long.fromValue(other);
		if (this.equals(other)) return 0;
		return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
	}
	lessThanOrEqual(other) {
		return this.comp(other) <= 0;
	}
	static fromValue(val) {
		if (typeof val === "number") return Long.fromNumber(val);
		return new Long(val.low, val.high);
	}
};
const UZERO = new Long(0, 0);
const TWO_PWR_16_DBL = 65536;
const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
const TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
const MAX_UNSIGNED_VALUE = new Long(-1, -1);
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/remote_query_set.js
var __defProp$6 = Object.defineProperty;
var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$6 = (obj, key, value) => __defNormalProp$6(obj, typeof key !== "symbol" ? key + "" : key, value);
var RemoteQuerySet = class {
	constructor(queryPath, logger) {
		__publicField$6(this, "version");
		__publicField$6(this, "remoteQuerySet");
		__publicField$6(this, "queryPath");
		__publicField$6(this, "logger");
		this.version = {
			querySet: 0,
			ts: Long.fromNumber(0),
			identity: 0
		};
		this.remoteQuerySet = /* @__PURE__ */ new Map();
		this.queryPath = queryPath;
		this.logger = logger;
	}
	transition(transition) {
		const start = transition.startVersion;
		if (this.version.querySet !== start.querySet || this.version.ts.notEquals(start.ts) || this.version.identity !== start.identity) throw new Error(`Invalid start version: ${start.ts.toString()}:${start.querySet}:${start.identity}, transitioning from ${this.version.ts.toString()}:${this.version.querySet}:${this.version.identity}`);
		for (const modification of transition.modifications) switch (modification.type) {
			case "QueryUpdated": {
				const queryPath = this.queryPath(modification.queryId);
				if (queryPath) for (const line of modification.logLines) logForFunction(this.logger, "info", "query", queryPath, line);
				const value = jsonToConvex(modification.value ?? null);
				this.remoteQuerySet.set(modification.queryId, {
					success: true,
					value,
					logLines: modification.logLines
				});
				break;
			}
			case "QueryFailed": {
				const queryPath = this.queryPath(modification.queryId);
				if (queryPath) for (const line of modification.logLines) logForFunction(this.logger, "info", "query", queryPath, line);
				const { errorData } = modification;
				this.remoteQuerySet.set(modification.queryId, {
					success: false,
					errorMessage: modification.errorMessage,
					errorData: errorData !== void 0 ? jsonToConvex(errorData) : void 0,
					logLines: modification.logLines
				});
				break;
			}
			case "QueryRemoved":
				this.remoteQuerySet.delete(modification.queryId);
				break;
			default: throw new Error(`Invalid modification ${modification.type}`);
		}
		this.version = transition.endVersion;
	}
	remoteQueryResults() {
		return this.remoteQuerySet;
	}
	timestamp() {
		return this.version.ts;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/protocol.js
function u64ToLong(encoded) {
	const integerBytes = toByteArray(encoded);
	return Long.fromBytesLE(Array.from(integerBytes));
}
function longToU64(raw) {
	return fromByteArray(new Uint8Array(raw.toBytesLE()));
}
function parseServerMessage(encoded) {
	switch (encoded.type) {
		case "FatalError":
		case "AuthError":
		case "ActionResponse":
		case "TransitionChunk":
		case "Ping": return { ...encoded };
		case "MutationResponse": if (encoded.success) return {
			...encoded,
			ts: u64ToLong(encoded.ts)
		};
		else return { ...encoded };
		case "Transition": return {
			...encoded,
			startVersion: {
				...encoded.startVersion,
				ts: u64ToLong(encoded.startVersion.ts)
			},
			endVersion: {
				...encoded.endVersion,
				ts: u64ToLong(encoded.endVersion.ts)
			}
		};
		default:
	}
}
function encodeClientMessage(message) {
	switch (message.type) {
		case "Authenticate":
		case "ModifyQuerySet":
		case "Mutation":
		case "Action":
		case "Event": return { ...message };
		case "Connect": if (message.maxObservedTimestamp !== void 0) return {
			...message,
			maxObservedTimestamp: longToU64(message.maxObservedTimestamp)
		};
		else return {
			...message,
			maxObservedTimestamp: void 0
		};
		default:
	}
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/web_socket_manager.js
var __defProp$5 = Object.defineProperty;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$5 = (obj, key, value) => __defNormalProp$5(obj, typeof key !== "symbol" ? key + "" : key, value);
const CLOSE_NORMAL = 1e3;
const CLOSE_GOING_AWAY = 1001;
const CLOSE_NO_STATUS = 1005;
const CLOSE_NOT_FOUND = 4040;
let firstTime;
function monotonicMillis() {
	if (firstTime === void 0) firstTime = Date.now();
	if (typeof performance === "undefined" || !performance.now) return Date.now();
	return Math.round(firstTime + performance.now());
}
function prettyNow() {
	return `t=${Math.round((monotonicMillis() - firstTime) / 100) / 10}s`;
}
const serverDisconnectErrors = {
	InternalServerError: { timeout: 1e3 },
	SubscriptionsWorkerFullError: { timeout: 3e3 },
	TooManyConcurrentRequests: { timeout: 3e3 },
	CommitterFullError: { timeout: 3e3 },
	AwsTooManyRequestsException: { timeout: 3e3 },
	ExecuteFullError: { timeout: 3e3 },
	SystemTimeoutError: { timeout: 3e3 },
	ExpiredInQueue: { timeout: 3e3 },
	VectorIndexesUnavailable: { timeout: 1e3 },
	SearchIndexesUnavailable: { timeout: 1e3 },
	TableSummariesUnavailable: { timeout: 1e3 },
	VectorIndexTooLarge: { timeout: 3e3 },
	SearchIndexTooLarge: { timeout: 3e3 },
	TooManyWritesInTimePeriod: { timeout: 3e3 }
};
function classifyDisconnectError(s) {
	if (s === void 0) return "Unknown";
	for (const prefix of Object.keys(serverDisconnectErrors)) if (s.startsWith(prefix)) return prefix;
	return "Unknown";
}
var WebSocketManager = class {
	constructor(uri, callbacks, webSocketConstructor, logger, markConnectionStateDirty, debug) {
		this.markConnectionStateDirty = markConnectionStateDirty;
		this.debug = debug;
		__publicField$5(this, "socket");
		__publicField$5(this, "connectionCount");
		__publicField$5(this, "_hasEverConnected", false);
		__publicField$5(this, "lastCloseReason");
		__publicField$5(this, "transitionChunkBuffer", null);
		/** Upon HTTPS/WSS failure, the first jittered backoff duration, in ms. */
		__publicField$5(this, "defaultInitialBackoff");
		/** We backoff exponentially, but we need to cap that--this is the jittered max. */
		__publicField$5(this, "maxBackoff");
		/** How many times have we failed consecutively? */
		__publicField$5(this, "retries");
		/** How long before lack of server response causes us to initiate a reconnect,
		* in ms */
		__publicField$5(this, "serverInactivityThreshold");
		__publicField$5(this, "reconnectDueToServerInactivityTimeout");
		/** Scheduled reconnect state: timeout handle and timing info */
		__publicField$5(this, "scheduledReconnect", null);
		__publicField$5(this, "networkOnlineHandler", null);
		/** Pending event to send after reconnecting due to network recovery */
		__publicField$5(this, "pendingNetworkRecoveryInfo", null);
		__publicField$5(this, "uri");
		__publicField$5(this, "onOpen");
		__publicField$5(this, "onResume");
		__publicField$5(this, "onMessage");
		__publicField$5(this, "webSocketConstructor");
		__publicField$5(this, "logger");
		__publicField$5(this, "onServerDisconnectError");
		this.webSocketConstructor = webSocketConstructor;
		this.socket = { state: "disconnected" };
		this.connectionCount = 0;
		this.lastCloseReason = "InitialConnect";
		this.defaultInitialBackoff = 1e3;
		this.maxBackoff = 16e3;
		this.retries = 0;
		this.serverInactivityThreshold = 6e4;
		this.reconnectDueToServerInactivityTimeout = null;
		this.uri = uri;
		this.onOpen = callbacks.onOpen;
		this.onResume = callbacks.onResume;
		this.onMessage = callbacks.onMessage;
		this.onServerDisconnectError = callbacks.onServerDisconnectError;
		this.logger = logger;
		this.setupNetworkListener();
		this.connect();
	}
	setSocketState(state) {
		this.socket = state;
		this._logVerbose(`socket state changed: ${this.socket.state}, paused: ${"paused" in this.socket ? this.socket.paused : void 0}`);
		this.markConnectionStateDirty();
	}
	setupNetworkListener() {
		if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
		if (this.networkOnlineHandler !== null) return;
		this.networkOnlineHandler = () => {
			this._logVerbose("network online event detected");
			this.tryReconnectImmediately();
		};
		window.addEventListener("online", this.networkOnlineHandler);
		this._logVerbose("network online event listener registered");
	}
	cleanupNetworkListener() {
		if (this.networkOnlineHandler && typeof window !== "undefined" && typeof window.removeEventListener === "function") {
			window.removeEventListener("online", this.networkOnlineHandler);
			this.networkOnlineHandler = null;
			this._logVerbose("network online event listener removed");
		}
	}
	assembleTransition(chunk) {
		if (chunk.partNumber < 0 || chunk.partNumber >= chunk.totalParts || chunk.totalParts === 0 || this.transitionChunkBuffer && (this.transitionChunkBuffer.totalParts !== chunk.totalParts || this.transitionChunkBuffer.transitionId !== chunk.transitionId)) {
			this.transitionChunkBuffer = null;
			throw new Error("Invalid TransitionChunk");
		}
		if (this.transitionChunkBuffer === null) this.transitionChunkBuffer = {
			chunks: [],
			totalParts: chunk.totalParts,
			transitionId: chunk.transitionId
		};
		if (chunk.partNumber !== this.transitionChunkBuffer.chunks.length) {
			const expectedLength = this.transitionChunkBuffer.chunks.length;
			this.transitionChunkBuffer = null;
			throw new Error(`TransitionChunk received out of order: expected part ${expectedLength}, got ${chunk.partNumber}`);
		}
		this.transitionChunkBuffer.chunks.push(chunk.chunk);
		if (this.transitionChunkBuffer.chunks.length === chunk.totalParts) {
			const fullJson = this.transitionChunkBuffer.chunks.join("");
			this.transitionChunkBuffer = null;
			const transition = parseServerMessage(JSON.parse(fullJson));
			if (transition.type !== "Transition") throw new Error(`Expected Transition, got ${transition.type} after assembling chunks`);
			return transition;
		}
		return null;
	}
	connect() {
		if (this.socket.state === "terminated") return;
		if (this.socket.state !== "disconnected" && this.socket.state !== "stopped") throw new Error("Didn't start connection from disconnected state: " + this.socket.state);
		const ws = new this.webSocketConstructor(this.uri);
		this._logVerbose("constructed WebSocket");
		this.setSocketState({
			state: "connecting",
			ws,
			paused: "no"
		});
		this.resetServerInactivityTimeout();
		ws.onopen = () => {
			this.logger.logVerbose("begin ws.onopen");
			if (this.socket.state !== "connecting") throw new Error("onopen called with socket not in connecting state");
			this.setSocketState({
				state: "ready",
				ws,
				paused: this.socket.paused === "yes" ? "uninitialized" : "no"
			});
			this.resetServerInactivityTimeout();
			if (this.socket.paused === "no") {
				this._hasEverConnected = true;
				this.onOpen({
					connectionCount: this.connectionCount,
					lastCloseReason: this.lastCloseReason,
					clientTs: monotonicMillis()
				});
			}
			if (this.lastCloseReason !== "InitialConnect") if (this.lastCloseReason) this.logger.log("WebSocket reconnected at", prettyNow(), "after disconnect due to", this.lastCloseReason);
			else this.logger.log("WebSocket reconnected at", prettyNow());
			this.connectionCount += 1;
			this.lastCloseReason = null;
			if (this.pendingNetworkRecoveryInfo !== null) {
				const { timeSavedMs } = this.pendingNetworkRecoveryInfo;
				this.pendingNetworkRecoveryInfo = null;
				this.sendMessage({
					type: "Event",
					eventType: "NetworkRecoveryReconnect",
					event: { timeSavedMs }
				});
				this.logger.log(`Network recovery reconnect saved ~${Math.round(timeSavedMs / 1e3)}s of waiting`);
			}
		};
		ws.onerror = (error) => {
			this.transitionChunkBuffer = null;
			const message = error.message;
			if (message) this.logger.log(`WebSocket error message: ${message}`);
		};
		ws.onmessage = (message) => {
			this.resetServerInactivityTimeout();
			const messageLength = message.data.length;
			let serverMessage = parseServerMessage(JSON.parse(message.data));
			this._logVerbose(`received ws message with type ${serverMessage.type}`);
			if (serverMessage.type === "Ping") return;
			if (serverMessage.type === "TransitionChunk") {
				const transition = this.assembleTransition(serverMessage);
				if (!transition) return;
				serverMessage = transition;
				this._logVerbose(`assembled full ws message of type ${serverMessage.type}`);
			}
			if (this.transitionChunkBuffer !== null) {
				this.transitionChunkBuffer = null;
				this.logger.log(`Received unexpected ${serverMessage.type} while buffering TransitionChunks`);
			}
			if (serverMessage.type === "Transition") this.reportLargeTransition({
				messageLength,
				transition: serverMessage
			});
			if (this.onMessage(serverMessage).hasSyncedPastLastReconnect) {
				this.retries = 0;
				this.markConnectionStateDirty();
			}
		};
		ws.onclose = (event) => {
			this._logVerbose("begin ws.onclose");
			this.transitionChunkBuffer = null;
			if (this.lastCloseReason === null) this.lastCloseReason = event.reason || `closed with code ${event.code}`;
			if (event.code !== CLOSE_NORMAL && event.code !== CLOSE_GOING_AWAY && event.code !== CLOSE_NO_STATUS && event.code !== CLOSE_NOT_FOUND) {
				let msg = `WebSocket closed with code ${event.code}`;
				if (event.reason) msg += `: ${event.reason}`;
				this.logger.log(msg);
				if (this.onServerDisconnectError && event.reason) this.onServerDisconnectError(msg);
			}
			const reason = classifyDisconnectError(event.reason);
			this.scheduleReconnect(reason);
		};
	}
	/**
	* @returns The state of the {@link Socket}.
	*/
	socketState() {
		return this.socket.state;
	}
	/**
	* @param message - A ClientMessage to send.
	* @returns Whether the message (might have been) sent.
	*/
	sendMessage(message) {
		const messageForLog = {
			type: message.type,
			...message.type === "Authenticate" && message.tokenType === "User" ? { value: `...${message.value.slice(-7)}` } : {}
		};
		if (this.socket.state === "ready" && this.socket.paused === "no") {
			const encodedMessage = encodeClientMessage(message);
			const request = JSON.stringify(encodedMessage);
			let sent = false;
			try {
				this.socket.ws.send(request);
				sent = true;
			} catch (error) {
				this.logger.log(`Failed to send message on WebSocket, reconnecting: ${error}`);
				this.closeAndReconnect("FailedToSendMessage");
			}
			this._logVerbose(`${sent ? "sent" : "failed to send"} message with type ${message.type}: ${JSON.stringify(messageForLog)}`);
			return true;
		}
		this._logVerbose(`message not sent (socket state: ${this.socket.state}, paused: ${"paused" in this.socket ? this.socket.paused : void 0}): ${JSON.stringify(messageForLog)}`);
		return false;
	}
	resetServerInactivityTimeout() {
		if (this.socket.state === "terminated") return;
		if (this.reconnectDueToServerInactivityTimeout !== null) {
			clearTimeout(this.reconnectDueToServerInactivityTimeout);
			this.reconnectDueToServerInactivityTimeout = null;
		}
		this.reconnectDueToServerInactivityTimeout = setTimeout(() => {
			this.closeAndReconnect("InactiveServer");
		}, this.serverInactivityThreshold);
	}
	scheduleReconnect(reason) {
		if (this.scheduledReconnect) {
			clearTimeout(this.scheduledReconnect.timeout);
			this.scheduledReconnect = null;
		}
		this.socket = { state: "disconnected" };
		const backoff = this.nextBackoff(reason);
		this.markConnectionStateDirty();
		this.logger.log(`Attempting reconnect in ${Math.round(backoff)}ms`);
		const scheduledAt = monotonicMillis();
		const timeoutId = setTimeout(() => {
			if (this.scheduledReconnect?.timeout === timeoutId) {
				this.scheduledReconnect = null;
				this.connect();
			}
		}, backoff);
		this.scheduledReconnect = {
			timeout: timeoutId,
			scheduledAt,
			backoffMs: backoff
		};
	}
	/**
	* Close the WebSocket and schedule a reconnect.
	*
	* This should be used when we hit an error and would like to restart the session.
	*/
	closeAndReconnect(closeReason) {
		this._logVerbose(`begin closeAndReconnect with reason ${closeReason}`);
		switch (this.socket.state) {
			case "disconnected":
			case "terminated":
			case "stopped": return;
			case "connecting":
			case "ready":
				this.lastCloseReason = closeReason;
				this.close();
				this.scheduleReconnect("client");
				return;
			default: this.socket;
		}
	}
	/**
	* Close the WebSocket, being careful to clear the onclose handler to avoid re-entrant
	* calls. Use this instead of directly calling `ws.close()`
	*
	* It is the callers responsibility to update the state after this method is called so that the
	* closed socket is not accessible or used again after this method is called
	*/
	close() {
		this.transitionChunkBuffer = null;
		switch (this.socket.state) {
			case "disconnected":
			case "terminated":
			case "stopped": return Promise.resolve();
			case "connecting": {
				const ws = this.socket.ws;
				ws.onmessage = (_message) => {
					this._logVerbose("Ignoring message received after close");
				};
				return new Promise((r) => {
					ws.onclose = () => {
						this._logVerbose("Closed after connecting");
						r();
					};
					ws.onopen = () => {
						this._logVerbose("Opened after connecting");
						ws.close();
					};
				});
			}
			case "ready": {
				this._logVerbose("ws.close called");
				const ws = this.socket.ws;
				ws.onmessage = (_message) => {
					this._logVerbose("Ignoring message received after close");
				};
				const result = new Promise((r) => {
					ws.onclose = () => {
						r();
					};
				});
				ws.close();
				return result;
			}
			default:
				this.socket;
				return Promise.resolve();
		}
	}
	/**
	* Close the WebSocket and do not reconnect.
	* @returns A Promise that resolves when the WebSocket `onClose` callback is called.
	*/
	terminate() {
		if (this.reconnectDueToServerInactivityTimeout) clearTimeout(this.reconnectDueToServerInactivityTimeout);
		if (this.scheduledReconnect) {
			clearTimeout(this.scheduledReconnect.timeout);
			this.scheduledReconnect = null;
		}
		this.cleanupNetworkListener();
		switch (this.socket.state) {
			case "terminated":
			case "stopped":
			case "disconnected":
			case "connecting":
			case "ready": {
				const result = this.close();
				this.setSocketState({ state: "terminated" });
				return result;
			}
			default:
				this.socket;
				throw new Error(`Invalid websocket state: ${this.socket.state}`);
		}
	}
	stop() {
		switch (this.socket.state) {
			case "terminated": return Promise.resolve();
			case "connecting":
			case "stopped":
			case "disconnected":
			case "ready": {
				this.cleanupNetworkListener();
				const result = this.close();
				this.socket = { state: "stopped" };
				return result;
			}
			default:
				this.socket;
				return Promise.resolve();
		}
	}
	/**
	* Create a new WebSocket after a previous `stop()`, unless `terminate()` was
	* called before.
	*/
	tryRestart() {
		switch (this.socket.state) {
			case "stopped": break;
			case "terminated":
			case "connecting":
			case "ready":
			case "disconnected":
				this.logger.logVerbose("Restart called without stopping first");
				return;
			default: this.socket;
		}
		this.setupNetworkListener();
		this.connect();
	}
	pause() {
		switch (this.socket.state) {
			case "disconnected":
			case "stopped":
			case "terminated": return;
			case "connecting":
			case "ready":
				this.socket = {
					...this.socket,
					paused: "yes"
				};
				return;
			default:
				this.socket;
				return;
		}
	}
	/**
	* Try to reconnect immediately, canceling any scheduled reconnect.
	* This is useful when detecting network recovery.
	* Only takes action if we're in disconnected state (waiting to reconnect).
	*/
	tryReconnectImmediately() {
		this._logVerbose("tryReconnectImmediately called");
		if (this.socket.state !== "disconnected") {
			this._logVerbose(`tryReconnectImmediately called but socket state is ${this.socket.state}, no action taken`);
			return;
		}
		let timeSavedMs = null;
		if (this.scheduledReconnect) {
			const elapsed = monotonicMillis() - this.scheduledReconnect.scheduledAt;
			timeSavedMs = Math.max(0, this.scheduledReconnect.backoffMs - elapsed);
			this._logVerbose(`would have waited ${Math.round(timeSavedMs)}ms more (backoff was ${Math.round(this.scheduledReconnect.backoffMs)}ms, elapsed ${Math.round(elapsed)}ms)`);
			clearTimeout(this.scheduledReconnect.timeout);
			this.scheduledReconnect = null;
			this._logVerbose("canceled scheduled reconnect");
		}
		this.logger.log("Network recovery detected, reconnecting immediately");
		this.pendingNetworkRecoveryInfo = timeSavedMs !== null ? { timeSavedMs } : null;
		this.connect();
	}
	/**
	* Resume the state machine if previously paused.
	*/
	resume() {
		switch (this.socket.state) {
			case "connecting":
				this.socket = {
					...this.socket,
					paused: "no"
				};
				return;
			case "ready":
				if (this.socket.paused === "uninitialized") {
					this.socket = {
						...this.socket,
						paused: "no"
					};
					this._hasEverConnected = true;
					this.onOpen({
						connectionCount: this.connectionCount,
						lastCloseReason: this.lastCloseReason,
						clientTs: monotonicMillis()
					});
				} else if (this.socket.paused === "yes") {
					this.socket = {
						...this.socket,
						paused: "no"
					};
					this.onResume();
				}
				return;
			case "terminated":
			case "stopped":
			case "disconnected": return;
			default: this.socket;
		}
		this.connect();
	}
	connectionState() {
		return {
			isConnected: this.socket.state === "ready",
			hasEverConnected: this._hasEverConnected,
			connectionCount: this.connectionCount,
			connectionRetries: this.retries
		};
	}
	_logVerbose(message) {
		this.logger.logVerbose(message);
	}
	nextBackoff(reason) {
		const baseBackoff = (reason === "client" ? 100 : reason === "Unknown" ? this.defaultInitialBackoff : serverDisconnectErrors[reason].timeout) * Math.pow(2, this.retries);
		this.retries += 1;
		const actualBackoff = Math.min(baseBackoff, this.maxBackoff);
		return actualBackoff + actualBackoff * (Math.random() - .5);
	}
	reportLargeTransition({ transition, messageLength }) {
		if (transition.clientClockSkew === void 0 || transition.serverTs === void 0) return;
		const transitionTransitTime = monotonicMillis() - transition.clientClockSkew - transition.serverTs / 1e6;
		const prettyTransitionTime = `${Math.round(transitionTransitTime)}ms`;
		const prettyMessageMB = `${Math.round(messageLength / 1e4) / 100}MB`;
		const bytesPerSecond = messageLength / (transitionTransitTime / 1e3);
		const prettyBytesPerSecond = `${Math.round(bytesPerSecond / 1e4) / 100}MB per second`;
		this._logVerbose(`received ${prettyMessageMB} transition in ${prettyTransitionTime} at ${prettyBytesPerSecond}`);
		if (messageLength > 2e7) this.logger.log(`received query results totaling more that 20MB (${prettyMessageMB}) which will take a long time to download on slower connections`);
		else if (transitionTransitTime > 2e4) this.logger.log(`received query results totaling ${prettyMessageMB} which took more than 20s to arrive (${prettyTransitionTime})`);
		if (this.debug) this.sendMessage({
			type: "Event",
			eventType: "ClientReceivedTransition",
			event: {
				transitionTransitTime,
				messageLength
			}
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/session.js
function newSessionId() {
	return uuidv4();
}
function uuidv4() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = Math.random() * 16 | 0;
		return (c === "x" ? r : r & 3 | 8).toString(16);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/vendor/jwt-decode/index.js
var InvalidTokenError = class extends Error {};
InvalidTokenError.prototype.name = "InvalidTokenError";
function b64DecodeUnicode(str) {
	return decodeURIComponent(atob(str).replace(/(.)/g, (_m, p) => {
		let code = p.charCodeAt(0).toString(16).toUpperCase();
		if (code.length < 2) code = "0" + code;
		return "%" + code;
	}));
}
function base64UrlDecode(str) {
	let output = str.replace(/-/g, "+").replace(/_/g, "/");
	switch (output.length % 4) {
		case 0: break;
		case 2:
			output += "==";
			break;
		case 3:
			output += "=";
			break;
		default: throw new Error("base64 string is not of the correct length");
	}
	try {
		return b64DecodeUnicode(output);
	} catch {
		return atob(output);
	}
}
function jwtDecode(token, options) {
	if (typeof token !== "string") throw new InvalidTokenError("Invalid token specified: must be a string");
	options || (options = {});
	const pos = options.header === true ? 0 : 1;
	const part = token.split(".")[pos];
	if (typeof part !== "string") throw new InvalidTokenError(`Invalid token specified: missing part #${pos + 1}`);
	let decoded;
	try {
		decoded = base64UrlDecode(part);
	} catch (e) {
		throw new InvalidTokenError(`Invalid token specified: invalid base64 for part #${pos + 1} (${e.message})`);
	}
	try {
		return JSON.parse(decoded);
	} catch (e) {
		throw new InvalidTokenError(`Invalid token specified: invalid json for part #${pos + 1} (${e.message})`);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/authentication_manager.js
var __defProp$4 = Object.defineProperty;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$4 = (obj, key, value) => __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
const MAXIMUM_REFRESH_DELAY = 480 * 60 * 60 * 1e3;
const MAX_TOKEN_CONFIRMATION_ATTEMPTS = 2;
var AuthenticationManager = class {
	constructor(syncState, callbacks, config) {
		__publicField$4(this, "authState", { state: "noAuth" });
		__publicField$4(this, "configVersion", 0);
		__publicField$4(this, "syncState");
		__publicField$4(this, "authenticate");
		__publicField$4(this, "stopSocket");
		__publicField$4(this, "tryRestartSocket");
		__publicField$4(this, "pauseSocket");
		__publicField$4(this, "resumeSocket");
		__publicField$4(this, "clearAuth");
		__publicField$4(this, "logger");
		__publicField$4(this, "refreshTokenLeewaySeconds");
		__publicField$4(this, "initialAuthTokenReuse");
		__publicField$4(this, "lastRefreshChange");
		__publicField$4(this, "tokenConfirmationAttempts", 0);
		this.syncState = syncState;
		this.authenticate = callbacks.authenticate;
		this.stopSocket = callbacks.stopSocket;
		this.tryRestartSocket = callbacks.tryRestartSocket;
		this.pauseSocket = callbacks.pauseSocket;
		this.resumeSocket = callbacks.resumeSocket;
		this.clearAuth = callbacks.clearAuth;
		this.logger = config.logger;
		this.refreshTokenLeewaySeconds = config.refreshTokenLeewaySeconds;
		this.initialAuthTokenReuse = config.initialAuthTokenReuse;
		this.lastRefreshChange = false;
	}
	notifyRefreshChange(isRefreshing) {
		if (this.authState.state !== "noAuth" && this.authState.state !== "initialRefetch" && this.authState.config.onRefreshChange && this.lastRefreshChange !== isRefreshing) {
			this.lastRefreshChange = isRefreshing;
			this.authState.config.onRefreshChange(isRefreshing);
		}
	}
	async setConfig(fetchToken, onChange, onRefreshChange) {
		this.resetAuthState();
		this._logVerbose("pausing WS for auth token fetch");
		this.pauseSocket();
		const token = await this.fetchTokenAndGuardAgainstRace(fetchToken, { forceRefreshToken: false });
		if (token.isFromOutdatedConfig) return;
		const config = {
			fetchToken,
			onAuthChange: onChange,
			onRefreshChange
		};
		if (token.value) {
			this.setAuthState({
				state: "waitingForServerConfirmationOfCachedToken",
				config,
				hasRetried: false
			});
			this.authenticate(token.value);
		} else {
			this.setAuthState({
				state: "initialRefetch",
				config
			});
			await this.refetchToken();
		}
		this._logVerbose("resuming WS after auth token fetch");
		this.resumeSocket();
	}
	onTransition(serverMessage) {
		if (!this.syncState.isCurrentOrNewerAuthVersion(serverMessage.endVersion.identity)) return;
		if (serverMessage.endVersion.identity <= serverMessage.startVersion.identity) return;
		this._logVerbose(`auth state is ${this.authState.state} when handling transition`);
		this.syncState.markAuthCompletion();
		if (this.authState.state === "waitingForServerConfirmationOfCachedToken") {
			this._logVerbose("server confirmed auth token is valid");
			const cachedToken = this.syncState.getAuth()?.value;
			if (this.initialAuthTokenReuse && cachedToken) this.scheduleTokenRefetch(cachedToken, serverMessage.clientClockSkew);
			else this.refetchToken();
			this.authState.config.onAuthChange(true);
			return;
		}
		if (this.authState.state === "waitingForServerConfirmationOfFreshToken") {
			this._logVerbose("server confirmed new auth token is valid");
			this.notifyRefreshChange(false);
			this.scheduleTokenRefetch(this.authState.token);
			this.tokenConfirmationAttempts = 0;
			if (!this.authState.hadAuth) this.authState.config.onAuthChange(true);
		}
	}
	onAuthError(serverMessage) {
		if (serverMessage.authUpdateAttempted === false && (this.authState.state === "waitingForServerConfirmationOfFreshToken" || this.authState.state === "waitingForServerConfirmationOfCachedToken")) {
			this._logVerbose("ignoring non-auth token expired error");
			return;
		}
		const { baseVersion } = serverMessage;
		if (!this.syncState.isCurrentOrNewerAuthVersion(baseVersion + 1)) {
			this._logVerbose("ignoring auth error for previous auth attempt");
			return;
		}
		this.tryToReauthenticate(serverMessage);
	}
	async tryToReauthenticate(serverMessage) {
		this._logVerbose(`attempting to reauthenticate: ${serverMessage.error}`);
		if (this.authState.state === "noAuth" || this.authState.state === "waitingForServerConfirmationOfFreshToken" && this.tokenConfirmationAttempts >= MAX_TOKEN_CONFIRMATION_ATTEMPTS) {
			this.logger.error(`Failed to authenticate: "${serverMessage.error}", check your server auth config`);
			if (this.syncState.hasAuth()) this.syncState.clearAuth();
			if (this.authState.state !== "noAuth") this.setAndReportAuthFailed(this.authState.config.onAuthChange);
			return;
		}
		if (this.authState.state === "waitingForServerConfirmationOfFreshToken") {
			this.tokenConfirmationAttempts++;
			this._logVerbose(`retrying reauthentication, ${MAX_TOKEN_CONFIRMATION_ATTEMPTS - this.tokenConfirmationAttempts} attempts remaining`);
		}
		this.notifyRefreshChange(true);
		await this.stopSocket();
		if (this.authState.state === "noAuth") return;
		const token = await this.fetchTokenAndGuardAgainstRace(this.authState.config.fetchToken, { forceRefreshToken: true });
		if (token.isFromOutdatedConfig) return;
		if (token.value && this.syncState.isNewAuth(token.value)) {
			this.authenticate(token.value);
			this.setAuthState({
				state: "waitingForServerConfirmationOfFreshToken",
				config: this.authState.config,
				token: token.value,
				hadAuth: this.authState.state === "notRefetching" || this.authState.state === "waitingForScheduledRefetch"
			});
		} else {
			this._logVerbose("reauthentication failed, could not fetch a new token");
			if (this.syncState.hasAuth()) this.syncState.clearAuth();
			this.setAndReportAuthFailed(this.authState.config.onAuthChange);
		}
		this.tryRestartSocket();
	}
	async refetchToken() {
		if (this.authState.state === "noAuth") return;
		this._logVerbose("refetching auth token");
		const token = await this.fetchTokenAndGuardAgainstRace(this.authState.config.fetchToken, { forceRefreshToken: true });
		if (token.isFromOutdatedConfig) return;
		if (token.value) if (this.syncState.isNewAuth(token.value)) {
			this.setAuthState({
				state: "waitingForServerConfirmationOfFreshToken",
				hadAuth: this.syncState.hasAuth(),
				token: token.value,
				config: this.authState.config
			});
			this.authenticate(token.value);
		} else this.setAuthState({
			state: "notRefetching",
			config: this.authState.config
		});
		else {
			this._logVerbose("refetching token failed");
			if (this.syncState.hasAuth()) this.clearAuth();
			this.setAndReportAuthFailed(this.authState.config.onAuthChange);
		}
		this._logVerbose("restarting WS after auth token fetch (if currently stopped)");
		this.tryRestartSocket();
	}
	scheduleTokenRefetch(token, clientClockSkewMs) {
		if (this.authState.state === "noAuth") return;
		const decodedToken = this.decodeToken(token);
		if (!decodedToken) {
			this.logger.error("Auth token is not a valid JWT, cannot refetch the token");
			return;
		}
		const { iat, exp } = decodedToken;
		if (!iat || !exp) {
			this.logger.error("Auth token does not have required fields, cannot refetch the token");
			return;
		}
		const fullLifetimeSeconds = exp - iat;
		if (fullLifetimeSeconds <= 2) {
			this.logger.error("Auth token does not live long enough, cannot refetch the token");
			return;
		}
		let tokenValiditySeconds;
		if (clientClockSkewMs !== void 0) {
			tokenValiditySeconds = exp - (Date.now() - clientClockSkewMs) / 1e3;
			if (tokenValiditySeconds <= 0) tokenValiditySeconds = 0;
		} else tokenValiditySeconds = fullLifetimeSeconds;
		let delay = Math.min(MAXIMUM_REFRESH_DELAY, (tokenValiditySeconds - this.refreshTokenLeewaySeconds) * 1e3);
		if (delay <= 0) {
			this.logger.warn(`Refetching auth token immediately, configured leeway ${this.refreshTokenLeewaySeconds}s is larger than the token's lifetime ${tokenValiditySeconds}s`);
			delay = 0;
		}
		const refetchTokenTimeoutId = setTimeout(() => {
			this._logVerbose("running scheduled token refetch");
			this.refetchToken();
		}, delay);
		this.setAuthState({
			state: "waitingForScheduledRefetch",
			refetchTokenTimeoutId,
			config: this.authState.config
		});
		this._logVerbose(`scheduled preemptive auth token refetching in ${delay}ms`);
	}
	async fetchTokenAndGuardAgainstRace(fetchToken, fetchArgs) {
		const originalConfigVersion = ++this.configVersion;
		this._logVerbose(`fetching token with config version ${originalConfigVersion}`);
		const token = await fetchToken(fetchArgs);
		if (this.configVersion !== originalConfigVersion) {
			this._logVerbose(`stale config version, expected ${originalConfigVersion}, got ${this.configVersion}`);
			return { isFromOutdatedConfig: true };
		}
		return {
			isFromOutdatedConfig: false,
			value: token
		};
	}
	stop() {
		this.resetAuthState();
		this.configVersion++;
		this._logVerbose(`config version bumped to ${this.configVersion}`);
	}
	setAndReportAuthFailed(onAuthChange) {
		onAuthChange(false);
		this.resetAuthState();
	}
	resetAuthState() {
		this.notifyRefreshChange(false);
		this.setAuthState({ state: "noAuth" });
	}
	setAuthState(newAuth) {
		const authStateForLog = newAuth.state === "waitingForServerConfirmationOfFreshToken" ? {
			hadAuth: newAuth.hadAuth,
			state: newAuth.state,
			token: `...${newAuth.token.slice(-7)}`
		} : { state: newAuth.state };
		this._logVerbose(`setting auth state to ${JSON.stringify(authStateForLog)}`);
		switch (newAuth.state) {
			case "waitingForScheduledRefetch":
			case "notRefetching":
			case "noAuth":
				this.tokenConfirmationAttempts = 0;
				break;
			case "waitingForServerConfirmationOfFreshToken":
			case "waitingForServerConfirmationOfCachedToken":
			case "initialRefetch": break;
			default:
		}
		if (this.authState.state === "waitingForScheduledRefetch") clearTimeout(this.authState.refetchTokenTimeoutId);
		this.authState = newAuth;
	}
	decodeToken(token) {
		try {
			return jwtDecode(token);
		} catch (e) {
			this._logVerbose(`Error decoding token: ${e instanceof Error ? e.message : "Unknown error"}`);
			return null;
		}
	}
	_logVerbose(message) {
		this.logger.logVerbose(`${message} [v${this.configVersion}]`);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/metrics.js
const markNames = [
	"convexClientConstructed",
	"convexWebSocketOpen",
	"convexFirstMessageReceived"
];
function mark(name, sessionId) {
	const detail = { sessionId };
	if (typeof performance === "undefined" || !performance.mark) return;
	performance.mark(name, { detail });
}
function performanceMarkToJson(mark2) {
	let name = mark2.name.slice(6);
	name = name.charAt(0).toLowerCase() + name.slice(1);
	return {
		name,
		startTime: mark2.startTime
	};
}
function getMarksReport(sessionId) {
	if (typeof performance === "undefined" || !performance.getEntriesByName) return [];
	const allMarks = [];
	for (const name of markNames) {
		const marks = performance.getEntriesByName(name).filter((entry) => entry.entryType === "mark").filter((mark2) => mark2.detail.sessionId === sessionId);
		allMarks.push(...marks);
	}
	return allMarks.map(performanceMarkToJson);
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/client.js
var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$3 = (obj, key, value) => __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
var BaseConvexClient = class {
	/**
	* @param address - The url of your Convex deployment, often provided
	* by an environment variable. E.g. `https://small-mouse-123.convex.cloud`.
	* @param onTransition - A callback receiving an array of query tokens
	* corresponding to query results that have changed -- additional handlers
	* can be added via `addOnTransitionHandler`.
	* @param options - See {@link BaseConvexClientOptions} for a full description.
	*/
	constructor(address, onTransition, options) {
		__publicField$3(this, "address");
		__publicField$3(this, "state");
		__publicField$3(this, "requestManager");
		__publicField$3(this, "webSocketManager");
		__publicField$3(this, "authenticationManager");
		__publicField$3(this, "remoteQuerySet");
		__publicField$3(this, "optimisticQueryResults");
		__publicField$3(this, "_transitionHandlerCounter", 0);
		__publicField$3(this, "_nextRequestId");
		__publicField$3(this, "_onTransitionFns", /* @__PURE__ */ new Map());
		__publicField$3(this, "_sessionId");
		__publicField$3(this, "firstMessageReceived", false);
		__publicField$3(this, "debug");
		__publicField$3(this, "logger");
		__publicField$3(this, "maxObservedTimestamp");
		__publicField$3(this, "connectionStateSubscribers", /* @__PURE__ */ new Map());
		__publicField$3(this, "nextConnectionStateSubscriberId", 0);
		__publicField$3(this, "_lastPublishedConnectionState");
		/**
		* Call this whenever the connection state may have changed in a way that could
		* require publishing it. Schedules a possibly update.
		*/
		__publicField$3(this, "markConnectionStateDirty", () => {
			Promise.resolve().then(() => {
				const curConnectionState = this.connectionState();
				if (JSON.stringify(curConnectionState) !== JSON.stringify(this._lastPublishedConnectionState)) {
					this._lastPublishedConnectionState = curConnectionState;
					for (const cb of this.connectionStateSubscribers.values()) cb(curConnectionState);
				}
			});
		});
		__publicField$3(this, "mark", (name) => {
			if (this.debug) mark(name, this.sessionId);
		});
		if (typeof address === "object") throw new Error("Passing a ClientConfig object is no longer supported. Pass the URL of the Convex deployment as a string directly.");
		if (options?.skipConvexDeploymentUrlCheck !== true) validateDeploymentUrl(address);
		options = { ...options };
		const authRefreshTokenLeewaySeconds = options.authRefreshTokenLeewaySeconds ?? 10;
		let webSocketConstructor = options.webSocketConstructor;
		if (!webSocketConstructor && typeof WebSocket === "undefined") throw new Error("No WebSocket global variable defined! To use Convex in an environment without WebSocket try the HTTP client: https://docs.convex.dev/api/classes/browser.ConvexHttpClient");
		webSocketConstructor = webSocketConstructor || WebSocket;
		this.debug = options.reportDebugInfoToConvex ?? false;
		this.address = address;
		this.logger = options.logger === false ? instantiateNoopLogger({ verbose: options.verbose ?? false }) : options.logger !== true && options.logger ? options.logger : instantiateDefaultLogger({ verbose: options.verbose ?? false });
		const i = address.search("://");
		if (i === -1) throw new Error("Provided address was not an absolute URL.");
		const origin = address.substring(i + 3);
		const protocol = address.substring(0, i);
		let wsProtocol;
		if (protocol === "http") wsProtocol = "ws";
		else if (protocol === "https") wsProtocol = "wss";
		else throw new Error(`Unknown parent protocol ${protocol}`);
		const wsUri = `${wsProtocol}://${origin}/api/1.42.1/sync`;
		this.state = new LocalSyncState();
		this.remoteQuerySet = new RemoteQuerySet((queryId) => this.state.queryPath(queryId), this.logger);
		this.requestManager = new RequestManager(this.logger, this.markConnectionStateDirty);
		const pauseSocket = () => {
			this.webSocketManager.pause();
			this.state.pause();
		};
		this.authenticationManager = new AuthenticationManager(this.state, {
			authenticate: (token) => {
				const message = this.state.setAuth(token);
				this.webSocketManager.sendMessage(message);
				return message.baseVersion;
			},
			stopSocket: () => this.webSocketManager.stop(),
			tryRestartSocket: () => this.webSocketManager.tryRestart(),
			pauseSocket,
			resumeSocket: () => this.webSocketManager.resume(),
			clearAuth: () => {
				this.clearAuth();
			}
		}, {
			logger: this.logger,
			refreshTokenLeewaySeconds: authRefreshTokenLeewaySeconds,
			initialAuthTokenReuse: options.initialAuthTokenReuse ?? false
		});
		this.optimisticQueryResults = new OptimisticQueryResults();
		this.addOnTransitionHandler((transition) => {
			onTransition(transition.queries.map((q) => q.token));
		});
		this._nextRequestId = 0;
		this._sessionId = newSessionId();
		const { unsavedChangesWarning } = options;
		if (typeof window === "undefined" || typeof window.addEventListener === "undefined") {
			if (unsavedChangesWarning === true) throw new Error("unsavedChangesWarning requested, but window.addEventListener not found! Remove {unsavedChangesWarning: true} from Convex client options.");
		} else if (unsavedChangesWarning !== false) window.addEventListener("beforeunload", (e) => {
			if (this.requestManager.hasIncompleteRequests()) {
				e.preventDefault();
				const confirmationMessage = "Are you sure you want to leave? Your changes may not be saved.";
				(e || window.event).returnValue = confirmationMessage;
				return confirmationMessage;
			}
		});
		this.webSocketManager = new WebSocketManager(wsUri, {
			onOpen: (reconnectMetadata) => {
				this.mark("convexWebSocketOpen");
				this.webSocketManager.sendMessage({
					...reconnectMetadata,
					type: "Connect",
					sessionId: this._sessionId,
					maxObservedTimestamp: this.maxObservedTimestamp
				});
				this.remoteQuerySet = new RemoteQuerySet((queryId) => this.state.queryPath(queryId), this.logger);
				const [querySetModification, authModification] = this.state.restart();
				if (authModification) this.webSocketManager.sendMessage(authModification);
				this.webSocketManager.sendMessage(querySetModification);
				for (const message of this.requestManager.restart()) this.webSocketManager.sendMessage(message);
			},
			onResume: () => {
				const [querySetModification, authModification] = this.state.resume();
				if (authModification) this.webSocketManager.sendMessage(authModification);
				if (querySetModification) this.webSocketManager.sendMessage(querySetModification);
				for (const message of this.requestManager.resume()) this.webSocketManager.sendMessage(message);
			},
			onMessage: (serverMessage) => {
				if (!this.firstMessageReceived) {
					this.firstMessageReceived = true;
					this.mark("convexFirstMessageReceived");
					this.reportMarks();
				}
				switch (serverMessage.type) {
					case "Transition": {
						this.observedTimestamp(serverMessage.endVersion.ts);
						this.authenticationManager.onTransition(serverMessage);
						this.remoteQuerySet.transition(serverMessage);
						this.state.transition(serverMessage);
						const completedRequests = this.requestManager.removeCompleted(this.remoteQuerySet.timestamp());
						this.notifyOnQueryResultChanges(completedRequests);
						break;
					}
					case "MutationResponse": {
						if (serverMessage.success) this.observedTimestamp(serverMessage.ts);
						const completedMutationInfo = this.requestManager.onResponse(serverMessage);
						if (completedMutationInfo !== null) this.notifyOnQueryResultChanges(/* @__PURE__ */ new Map([[completedMutationInfo.requestId, completedMutationInfo.result]]));
						break;
					}
					case "ActionResponse":
						this.requestManager.onResponse(serverMessage);
						break;
					case "AuthError":
						this.authenticationManager.onAuthError(serverMessage);
						break;
					case "FatalError": {
						const error = logFatalError(this.logger, serverMessage.error);
						this.webSocketManager.terminate();
						throw error;
					}
					default:
				}
				return { hasSyncedPastLastReconnect: this.hasSyncedPastLastReconnect() };
			},
			onServerDisconnectError: options.onServerDisconnectError
		}, webSocketConstructor, this.logger, this.markConnectionStateDirty, this.debug);
		this.mark("convexClientConstructed");
		if (options.expectAuth) pauseSocket();
	}
	/**
	* Return true if there is outstanding work from prior to the time of the most recent restart.
	* This indicates that the client has not proven itself to have gotten past the issue that
	* potentially led to the restart. Use this to influence when to reset backoff after a failure.
	*/
	hasSyncedPastLastReconnect() {
		return this.requestManager.hasSyncedPastLastReconnect() && this.state.hasSyncedPastLastReconnect();
	}
	observedTimestamp(observedTs) {
		if (this.maxObservedTimestamp === void 0 || this.maxObservedTimestamp.lessThanOrEqual(observedTs)) this.maxObservedTimestamp = observedTs;
	}
	getMaxObservedTimestamp() {
		return this.maxObservedTimestamp;
	}
	/**
	* Compute the current query results based on the remoteQuerySet and the
	* current optimistic updates and call `onTransition` for all the changed
	* queries.
	*
	* @param completedMutations - A set of mutation IDs whose optimistic updates
	* are no longer needed.
	*/
	notifyOnQueryResultChanges(completedRequests) {
		const remoteQueryResults = this.remoteQuerySet.remoteQueryResults();
		const queryTokenToValue = /* @__PURE__ */ new Map();
		for (const [queryId, result] of remoteQueryResults) {
			const queryToken = this.state.queryToken(queryId);
			if (queryToken !== null) {
				const query = {
					result,
					udfPath: this.state.queryPath(queryId),
					args: this.state.queryArgs(queryId)
				};
				queryTokenToValue.set(queryToken, query);
			}
		}
		const changedQueryTokens = this.optimisticQueryResults.ingestQueryResultsFromServer(queryTokenToValue, new Set(completedRequests.keys()));
		this.handleTransition({
			queries: changedQueryTokens.map((token) => {
				return {
					token,
					modification: {
						kind: "Updated",
						result: this.optimisticQueryResults.rawQueryResult(token)
					}
				};
			}),
			reflectedMutations: Array.from(completedRequests).map(([requestId, result]) => ({
				requestId,
				result
			})),
			timestamp: this.remoteQuerySet.timestamp()
		});
	}
	handleTransition(transition) {
		for (const fn of this._onTransitionFns.values()) fn(transition);
	}
	/**
	* Add a handler that will be called on a transition.
	*
	* Any external side effects (e.g. setting React state) should be handled here.
	*
	* @param fn
	*
	* @returns
	*/
	addOnTransitionHandler(fn) {
		const id = this._transitionHandlerCounter++;
		this._onTransitionFns.set(id, fn);
		return () => this._onTransitionFns.delete(id);
	}
	/**
	* Get the current JWT auth token and decoded claims.
	*/
	getCurrentAuthClaims() {
		const authToken = this.state.getAuth();
		let decoded = {};
		if (authToken && authToken.tokenType === "User") try {
			decoded = authToken ? jwtDecode(authToken.value) : {};
		} catch {
			decoded = {};
		}
		else return;
		return {
			token: authToken.value,
			decoded
		};
	}
	/**
	* Set the authentication token to be used for subsequent queries and mutations.
	* `fetchToken` will be called automatically again if a token expires.
	* `fetchToken` should return `null` if the token cannot be retrieved, for example
	* when the user's rights were permanently revoked.
	* @param fetchToken - an async function returning the JWT-encoded OpenID Connect Identity Token
	* @param onChange - a callback that will be called when the authentication status changes
	* @param onRefreshChange - a callback called with `true` when the socket is paused to fetch a replacement token after a server rejection, and `false` when refresh completes
	*/
	setAuth(fetchToken, onChange, onRefreshChange) {
		this.authenticationManager.setConfig(fetchToken, onChange, onRefreshChange);
	}
	hasAuth() {
		return this.state.hasAuth();
	}
	/** @internal */
	setAdminAuth(value, fakeUserIdentity) {
		const message = this.state.setAdminAuth(value, fakeUserIdentity);
		this.webSocketManager.sendMessage(message);
	}
	clearAuth() {
		const message = this.state.clearAuth();
		this.webSocketManager.sendMessage(message);
	}
	/**
	* Subscribe to a query function.
	*
	* Whenever this query's result changes, the `onTransition` callback
	* passed into the constructor will be called.
	*
	* @param name - The name of the query.
	* @param args - An arguments object for the query. If this is omitted, the
	* arguments will be `{}`.
	* @param options - A {@link SubscribeOptions} options object for this query.
	
	* @returns An object containing a {@link QueryToken} corresponding to this
	* query and an `unsubscribe` callback.
	*/
	subscribe(name, args, options) {
		const argsObject = parseArgs(args);
		const { modification, queryToken, unsubscribe } = this.state.subscribe(name, argsObject, options?.journal, options?.componentPath);
		if (modification !== null) this.webSocketManager.sendMessage(modification);
		return {
			queryToken,
			unsubscribe: () => {
				const modification2 = unsubscribe();
				if (modification2) this.webSocketManager.sendMessage(modification2);
			}
		};
	}
	/**
	* A query result based only on the current, local state.
	*
	* The only way this will return a value is if we're already subscribed to the
	* query or its value has been set optimistically.
	*/
	localQueryResult(udfPath, args) {
		const queryToken = serializePathAndArgs(udfPath, parseArgs(args));
		return this.optimisticQueryResults.queryResult(queryToken);
	}
	/**
	* Get query result by query token based on current, local state
	*
	* The only way this will return a value is if we're already subscribed to the
	* query or its value has been set optimistically.
	*
	* @internal
	*/
	localQueryResultByToken(queryToken) {
		return this.optimisticQueryResults.queryResult(queryToken);
	}
	/**
	* Whether local query result is available for a token.
	*
	* This method does not throw if the result is an error.
	*
	* @internal
	*/
	hasLocalQueryResultByToken(queryToken) {
		return this.optimisticQueryResults.hasQueryResult(queryToken);
	}
	/**
	* @internal
	*/
	localQueryLogs(udfPath, args) {
		const queryToken = serializePathAndArgs(udfPath, parseArgs(args));
		return this.optimisticQueryResults.queryLogs(queryToken);
	}
	/**
	* Retrieve the current {@link QueryJournal} for this query function.
	*
	* If we have not yet received a result for this query, this will be `undefined`.
	*
	* @param name - The name of the query.
	* @param args - The arguments object for this query.
	* @returns The query's {@link QueryJournal} or `undefined`.
	*/
	queryJournal(name, args) {
		const queryToken = serializePathAndArgs(name, parseArgs(args));
		return this.state.queryJournal(queryToken);
	}
	/**
	* Get the current {@link ConnectionState} between the client and the Convex
	* backend.
	*
	* @returns The {@link ConnectionState} with the Convex backend.
	*/
	connectionState() {
		const wsConnectionState = this.webSocketManager.connectionState();
		return {
			hasInflightRequests: this.requestManager.hasInflightRequests(),
			isWebSocketConnected: wsConnectionState.isConnected,
			hasEverConnected: wsConnectionState.hasEverConnected,
			connectionCount: wsConnectionState.connectionCount,
			connectionRetries: wsConnectionState.connectionRetries,
			timeOfOldestInflightRequest: this.requestManager.timeOfOldestInflightRequest(),
			inflightMutations: this.requestManager.inflightMutations(),
			inflightActions: this.requestManager.inflightActions()
		};
	}
	/**
	* Subscribe to the {@link ConnectionState} between the client and the Convex
	* backend, calling a callback each time it changes.
	*
	* Subscribed callbacks will be called when any part of ConnectionState changes.
	* ConnectionState may grow in future versions (e.g. to provide a array of
	* inflight requests) in which case callbacks would be called more frequently.
	*
	* @returns An unsubscribe function to stop listening.
	*/
	subscribeToConnectionState(cb) {
		const id = this.nextConnectionStateSubscriberId++;
		this.connectionStateSubscribers.set(id, cb);
		return () => {
			this.connectionStateSubscribers.delete(id);
		};
	}
	/**
	* Execute a mutation function.
	*
	* @param name - The name of the mutation.
	* @param args - An arguments object for the mutation. If this is omitted,
	* the arguments will be `{}`.
	* @param options - A {@link MutationOptions} options object for this mutation.
	
	* @returns - A promise of the mutation's result.
	*/
	async mutation(name, args, options) {
		const result = await this.mutationInternal(name, args, options);
		if (!result.success) {
			if (result.errorData !== void 0) throw forwardData(result, new ConvexError(createHybridErrorStacktrace("mutation", name, result)));
			throw new Error(createHybridErrorStacktrace("mutation", name, result));
		}
		return result.value;
	}
	/**
	* @internal
	*/
	async mutationInternal(udfPath, args, options, componentPath) {
		const { mutationPromise } = this.enqueueMutation(udfPath, args, options, componentPath);
		return mutationPromise;
	}
	/**
	* @internal
	*/
	enqueueMutation(udfPath, args, options, componentPath) {
		const mutationArgs = parseArgs(args);
		this.tryReportLongDisconnect();
		const requestId = this.nextRequestId;
		this._nextRequestId++;
		if (options !== void 0) {
			const optimisticUpdate = options.optimisticUpdate;
			if (optimisticUpdate !== void 0) {
				const wrappedUpdate = (localQueryStore) => {
					if (optimisticUpdate(localQueryStore, mutationArgs) instanceof Promise) this.logger.warn("Optimistic update handler returned a Promise. Optimistic updates should be synchronous.");
				};
				const changedQueries = this.optimisticQueryResults.applyOptimisticUpdate(wrappedUpdate, requestId).map((token) => {
					const localResult = this.localQueryResultByToken(token);
					return {
						token,
						modification: {
							kind: "Updated",
							result: localResult === void 0 ? void 0 : {
								success: true,
								value: localResult,
								logLines: []
							}
						}
					};
				});
				this.handleTransition({
					queries: changedQueries,
					reflectedMutations: [],
					timestamp: this.remoteQuerySet.timestamp()
				});
			}
		}
		const message = {
			type: "Mutation",
			requestId,
			udfPath,
			componentPath,
			args: [convexToJson(mutationArgs)]
		};
		const mightBeSent = this.webSocketManager.sendMessage(message);
		return {
			requestId,
			mutationPromise: this.requestManager.request(message, mightBeSent)
		};
	}
	/**
	* Execute an action function.
	*
	* @param name - The name of the action.
	* @param args - An arguments object for the action. If this is omitted,
	* the arguments will be `{}`.
	* @returns A promise of the action's result.
	*/
	async action(name, args) {
		const result = await this.actionInternal(name, args);
		if (!result.success) {
			if (result.errorData !== void 0) throw forwardData(result, new ConvexError(createHybridErrorStacktrace("action", name, result)));
			throw new Error(createHybridErrorStacktrace("action", name, result));
		}
		return result.value;
	}
	/**
	* @internal
	*/
	async actionInternal(udfPath, args, componentPath) {
		const actionArgs = parseArgs(args);
		const requestId = this.nextRequestId;
		this._nextRequestId++;
		this.tryReportLongDisconnect();
		const message = {
			type: "Action",
			requestId,
			udfPath,
			componentPath,
			args: [convexToJson(actionArgs)]
		};
		const mightBeSent = this.webSocketManager.sendMessage(message);
		return this.requestManager.request(message, mightBeSent);
	}
	/**
	* Close any network handles associated with this client and stop all subscriptions.
	*
	* Call this method when you're done with an {@link BaseConvexClient} to
	* dispose of its sockets and resources.
	*
	* @returns A `Promise` fulfilled when the connection has been completely closed.
	*/
	async close() {
		this.authenticationManager.stop();
		return this.webSocketManager.terminate();
	}
	/**
	* Return the address for this client, useful for creating a new client.
	*
	* Not guaranteed to match the address with which this client was constructed:
	* it may be canonicalized.
	*/
	get url() {
		return this.address;
	}
	/**
	* @internal
	*/
	get nextRequestId() {
		return this._nextRequestId;
	}
	/**
	* @internal
	*/
	get sessionId() {
		return this._sessionId;
	}
	/**
	* Reports performance marks to the server. This should only be called when
	* we have a functional websocket.
	*/
	reportMarks() {
		if (this.debug) {
			const report = getMarksReport(this.sessionId);
			this.webSocketManager.sendMessage({
				type: "Event",
				eventType: "ClientConnect",
				event: report
			});
		}
	}
	tryReportLongDisconnect() {
		if (!this.debug) return;
		const timeOfOldestRequest = this.connectionState().timeOfOldestInflightRequest;
		if (timeOfOldestRequest === null || Date.now() - timeOfOldestRequest.getTime() <= 60 * 1e3) return;
		const endpoint = `${this.address}/api/debug_event`;
		fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Convex-Client": `npm-1.42.1`
			},
			body: JSON.stringify({ event: "LongWebsocketDisconnect" })
		}).then((response) => {
			if (!response.ok) this.logger.warn("Analytics request failed with response:", response.body);
		}).catch((error) => {
			this.logger.warn("Analytics response failed with error:", error);
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/http_client.js
var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$2 = (obj, key, value) => __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
var ConvexHttpClient = class {
	/**
	* Create a new {@link ConvexHttpClient}.
	*
	* @param address - The url of your Convex deployment, often provided
	* by an environment variable. E.g. `https://small-mouse-123.convex.cloud`.
	* @param options - An object of options.
	* - `skipConvexDeploymentUrlCheck` - Skip validating that the Convex deployment URL looks like
	* `https://happy-animal-123.convex.cloud` or localhost. This can be useful if running a self-hosted
	* Convex backend that uses a different URL.
	* - `logger` - A logger or a boolean. If not provided, logs to the console.
	* You can construct your own logger to customize logging to log elsewhere
	* or not log at all, or use `false` as a shorthand for a no-op logger.
	* A logger is an object with 4 methods: log(), warn(), error(), and logVerbose().
	* These methods can receive multiple arguments of any types, like console.log().
	* - `auth` - A JWT containing identity claims accessible in Convex functions.
	* This identity may expire so it may be necessary to call `setAuth()` later,
	* but for short-lived clients it's convenient to specify this value here.
	* - `fetch` - A custom fetch implementation to use for all HTTP requests made by this client.
	*/
	constructor(address, options) {
		__publicField$2(this, "address");
		__publicField$2(this, "auth");
		__publicField$2(this, "adminAuth");
		__publicField$2(this, "encodedTsPromise");
		__publicField$2(this, "debug");
		__publicField$2(this, "fetchOptions");
		__publicField$2(this, "fetch");
		__publicField$2(this, "logger");
		__publicField$2(this, "mutationQueue", []);
		__publicField$2(this, "isProcessingQueue", false);
		if (typeof options === "boolean") throw new Error("skipConvexDeploymentUrlCheck as the second argument is no longer supported. Please pass an options object, `{ skipConvexDeploymentUrlCheck: true }`.");
		if ((options ?? {}).skipConvexDeploymentUrlCheck !== true) validateDeploymentUrl(address);
		this.logger = options?.logger === false ? instantiateNoopLogger({ verbose: false }) : options?.logger !== true && options?.logger ? options.logger : instantiateDefaultLogger({ verbose: false });
		this.address = address;
		this.debug = true;
		this.auth = void 0;
		this.adminAuth = void 0;
		this.fetch = options?.fetch;
		if (options?.auth) this.setAuth(options.auth);
	}
	/**
	* Obtain the {@link ConvexHttpClient}'s URL to its backend.
	* @deprecated Use url, which returns the url without /api at the end.
	*
	* @returns The URL to the Convex backend, including the client's API version.
	*/
	backendUrl() {
		return `${this.address}/api`;
	}
	/**
	* Return the address for this client, useful for creating a new client.
	*
	* Not guaranteed to match the address with which this client was constructed:
	* it may be canonicalized.
	*/
	get url() {
		return this.address;
	}
	/**
	* Set the authentication token to be used for subsequent queries and mutations.
	*
	* Should be called whenever the token changes (i.e. due to expiration and refresh).
	*
	* @param value - JWT-encoded OpenID Connect identity token.
	*/
	setAuth(value) {
		this.clearAuth();
		this.auth = value;
	}
	/**
	* Set admin auth token to allow calling internal queries, mutations, and actions
	* and acting as an identity.
	*
	* @internal
	*/
	setAdminAuth(token, actingAsIdentity) {
		this.clearAuth();
		if (actingAsIdentity !== void 0) {
			const bytes = new TextEncoder().encode(JSON.stringify(actingAsIdentity));
			const actingAsIdentityEncoded = btoa(String.fromCodePoint(...bytes));
			this.adminAuth = `${token}:${actingAsIdentityEncoded}`;
		} else this.adminAuth = token;
	}
	/**
	* Clear the current authentication token if set.
	*/
	clearAuth() {
		this.auth = void 0;
		this.adminAuth = void 0;
	}
	/**
	* Sets whether the result log lines should be printed on the console or not.
	*
	* @internal
	*/
	setDebug(debug) {
		this.debug = debug;
	}
	/**
	* Used to customize the fetch behavior in some runtimes.
	*
	* @internal
	*/
	setFetchOptions(fetchOptions) {
		this.fetchOptions = fetchOptions;
	}
	/**
	* This API is experimental: it may change or disappear.
	*
	* Execute a Convex query function at the same timestamp as every other
	* consistent query execution run by this HTTP client.
	*
	* This doesn't make sense for long-lived ConvexHttpClients as Convex
	* backends can read a limited amount into the past: beyond 30 seconds
	* in the past may not be available.
	*
	* Create a new client to use a consistent time.
	*
	* @param name - The name of the query.
	* @param args - The arguments object for the query. If this is omitted,
	* the arguments will be `{}`.
	* @returns A promise of the query's result.
	*
	* @deprecated This API is experimental: it may change or disappear.
	*/
	async consistentQuery(query, ...args) {
		const queryArgs = parseArgs(args[0]);
		const timestampPromise = this.getTimestamp();
		return await this.queryInner(query, queryArgs, { timestampPromise });
	}
	async getTimestamp() {
		if (this.encodedTsPromise) return this.encodedTsPromise;
		return this.encodedTsPromise = this.getTimestampInner();
	}
	async getTimestampInner() {
		const localFetch = this.fetch || fetch;
		const headers = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-1.42.1`
		};
		const response = await localFetch(`${this.address}/api/query_ts`, {
			...this.fetchOptions,
			method: "POST",
			headers
		});
		if (!response.ok) throw new Error(await response.text());
		const { ts } = await response.json();
		return ts;
	}
	/**
	* Execute a Convex query function.
	*
	* @param name - The name of the query.
	* @param args - The arguments object for the query. If this is omitted,
	* the arguments will be `{}`.
	* @returns A promise of the query's result.
	*/
	async query(query, ...args) {
		const queryArgs = parseArgs(args[0]);
		return await this.queryInner(query, queryArgs, {});
	}
	async queryInner(query, queryArgs, options) {
		const name = getFunctionName(query);
		const args = [convexToJson(queryArgs)];
		const headers = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-1.42.1`
		};
		if (this.adminAuth) headers["Authorization"] = `Convex ${this.adminAuth}`;
		else if (this.auth) headers["Authorization"] = `Bearer ${this.auth}`;
		const localFetch = this.fetch || fetch;
		const timestamp = options.timestampPromise ? await options.timestampPromise : void 0;
		const body = JSON.stringify({
			path: name,
			format: "convex_encoded_json",
			args,
			...timestamp ? { ts: timestamp } : {}
		});
		const response = await localFetch(timestamp ? `${this.address}/api/query_at_ts` : `${this.address}/api/query`, {
			...this.fetchOptions,
			body,
			method: "POST",
			headers
		});
		if (!response.ok && response.status !== 560) throw new Error(await response.text());
		const respJSON = await response.json();
		if (this.debug) for (const line of respJSON.logLines ?? []) logForFunction(this.logger, "info", "query", name, line);
		switch (respJSON.status) {
			case "success": return jsonToConvex(respJSON.value);
			case "error":
				if (respJSON.errorData !== void 0) throw forwardErrorData(respJSON.errorData, new ConvexError(respJSON.errorMessage));
				throw new Error(respJSON.errorMessage);
			default: throw new Error(`Invalid response: ${JSON.stringify(respJSON)}`);
		}
	}
	async mutationInner(mutation, mutationArgs) {
		const name = getFunctionName(mutation);
		const body = JSON.stringify({
			path: name,
			format: "convex_encoded_json",
			args: [convexToJson(mutationArgs)]
		});
		const headers = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-1.42.1`
		};
		if (this.adminAuth) headers["Authorization"] = `Convex ${this.adminAuth}`;
		else if (this.auth) headers["Authorization"] = `Bearer ${this.auth}`;
		const response = await (this.fetch || fetch)(`${this.address}/api/mutation`, {
			...this.fetchOptions,
			body,
			method: "POST",
			headers
		});
		if (!response.ok && response.status !== 560) throw new Error(await response.text());
		const respJSON = await response.json();
		if (this.debug) for (const line of respJSON.logLines ?? []) logForFunction(this.logger, "info", "mutation", name, line);
		switch (respJSON.status) {
			case "success": return jsonToConvex(respJSON.value);
			case "error":
				if (respJSON.errorData !== void 0) throw forwardErrorData(respJSON.errorData, new ConvexError(respJSON.errorMessage));
				throw new Error(respJSON.errorMessage);
			default: throw new Error(`Invalid response: ${JSON.stringify(respJSON)}`);
		}
	}
	async processMutationQueue() {
		if (this.isProcessingQueue) return;
		this.isProcessingQueue = true;
		while (this.mutationQueue.length > 0) {
			const { mutation, args, resolve, reject } = this.mutationQueue.shift();
			try {
				resolve(await this.mutationInner(mutation, args));
			} catch (error) {
				reject(error);
			}
		}
		this.isProcessingQueue = false;
	}
	enqueueMutation(mutation, args) {
		return new Promise((resolve, reject) => {
			this.mutationQueue.push({
				mutation,
				args,
				resolve,
				reject
			});
			this.processMutationQueue();
		});
	}
	/**
	* Execute a Convex mutation function. Mutations are queued by default.
	*
	* @param name - The name of the mutation.
	* @param args - The arguments object for the mutation. If this is omitted,
	* the arguments will be `{}`.
	* @param options - An optional object containing
	* @returns A promise of the mutation's result.
	*/
	async mutation(mutation, ...args) {
		const [fnArgs, options] = args;
		const mutationArgs = parseArgs(fnArgs);
		if (!options?.skipQueue) return await this.enqueueMutation(mutation, mutationArgs);
		else return await this.mutationInner(mutation, mutationArgs);
	}
	/**
	* Execute a Convex action function. Actions are not queued.
	*
	* @param name - The name of the action.
	* @param args - The arguments object for the action. If this is omitted,
	* the arguments will be `{}`.
	* @returns A promise of the action's result.
	*/
	async action(action, ...args) {
		const actionArgs = parseArgs(args[0]);
		const name = getFunctionName(action);
		const body = JSON.stringify({
			path: name,
			format: "convex_encoded_json",
			args: [convexToJson(actionArgs)]
		});
		const headers = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-1.42.1`
		};
		if (this.adminAuth) headers["Authorization"] = `Convex ${this.adminAuth}`;
		else if (this.auth) headers["Authorization"] = `Bearer ${this.auth}`;
		const response = await (this.fetch || fetch)(`${this.address}/api/action`, {
			...this.fetchOptions,
			body,
			method: "POST",
			headers
		});
		if (!response.ok && response.status !== 560) throw new Error(await response.text());
		const respJSON = await response.json();
		if (this.debug) for (const line of respJSON.logLines ?? []) logForFunction(this.logger, "info", "action", name, line);
		switch (respJSON.status) {
			case "success": return jsonToConvex(respJSON.value);
			case "error":
				if (respJSON.errorData !== void 0) throw forwardErrorData(respJSON.errorData, new ConvexError(respJSON.errorMessage));
				throw new Error(respJSON.errorMessage);
			default: throw new Error(`Invalid response: ${JSON.stringify(respJSON)}`);
		}
	}
	/**
	* Execute a Convex function of an unknown type. These function calls are not queued.
	*
	* @param name - The name of the function.
	* @param args - The arguments object for the function. If this is omitted,
	* the arguments will be `{}`.
	* @returns A promise of the function's result.
	*
	* @internal
	*/
	async function(anyFunction, componentPath, ...args) {
		const functionArgs = parseArgs(args[0]);
		const name = typeof anyFunction === "string" ? anyFunction : getFunctionName(anyFunction);
		const body = JSON.stringify({
			componentPath,
			path: name,
			format: "convex_encoded_json",
			args: convexToJson(functionArgs)
		});
		const headers = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-1.42.1`
		};
		if (this.adminAuth) headers["Authorization"] = `Convex ${this.adminAuth}`;
		else if (this.auth) headers["Authorization"] = `Bearer ${this.auth}`;
		const response = await (this.fetch || fetch)(`${this.address}/api/function`, {
			...this.fetchOptions,
			body,
			method: "POST",
			headers
		});
		if (!response.ok && response.status !== 560) throw new Error(await response.text());
		const respJSON = await response.json();
		if (this.debug) for (const line of respJSON.logLines ?? []) logForFunction(this.logger, "info", "any", name, line);
		switch (respJSON.status) {
			case "success": return jsonToConvex(respJSON.value);
			case "error":
				if (respJSON.errorData !== void 0) throw forwardErrorData(respJSON.errorData, new ConvexError(respJSON.errorMessage));
				throw new Error(respJSON.errorMessage);
			default: throw new Error(`Invalid response: ${JSON.stringify(respJSON)}`);
		}
	}
};
function forwardErrorData(errorData, error) {
	error.data = jsonToConvex(errorData);
	return error;
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/pagination.js
function asPaginationResult(value) {
	if (typeof value !== "object" || value === null || !Array.isArray(value.page) || typeof value.isDone !== "boolean" || typeof value.continueCursor !== "string") throw new Error(`Not a valid paginated query result: ${value?.toString()}`);
	return value;
}
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/sync/paginated_query_client.js
var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
var PaginatedQueryClient = class {
	constructor(client, onTransition) {
		this.client = client;
		this.onTransition = onTransition;
		__publicField$1(this, "paginatedQuerySet", /* @__PURE__ */ new Map());
		__publicField$1(this, "lastTransitionTs");
		this.lastTransitionTs = Long.fromNumber(0);
		this.client.addOnTransitionHandler((transition) => this.onBaseTransition(transition));
	}
	/**
	* Subscribe to a paginated query.
	*
	* @param name - The name of the paginated query function
	* @param args - Arguments for the query (excluding paginationOpts)
	* @param options - Pagination options including initialNumItems
	* @returns Object with paginatedQueryToken and unsubscribe function
	*/
	subscribe(name, args, options) {
		const canonicalizedUdfPath = canonicalizeUdfPath(name);
		const token = serializePaginatedPathAndArgs(canonicalizedUdfPath, args, options);
		const unsubscribe = () => this.removePaginatedQuerySubscriber(token);
		const existingEntry = this.paginatedQuerySet.get(token);
		if (existingEntry) {
			existingEntry.numSubscribers += 1;
			return {
				paginatedQueryToken: token,
				unsubscribe
			};
		}
		this.paginatedQuerySet.set(token, {
			token,
			canonicalizedUdfPath,
			args,
			numSubscribers: 1,
			options: { initialNumItems: options.initialNumItems },
			nextPageKey: 0,
			pageKeys: [],
			pageKeyToQuery: /* @__PURE__ */ new Map(),
			ongoingSplits: /* @__PURE__ */ new Map(),
			skip: false,
			id: options.id
		});
		this.addPageToPaginatedQuery(token, null, options.initialNumItems);
		return {
			paginatedQueryToken: token,
			unsubscribe
		};
	}
	/**
	* Get current results for a paginated query based on local state.
	*
	* Throws an error when one of the pages has errored.
	*/
	localQueryResult(name, args, options) {
		const token = serializePaginatedPathAndArgs(canonicalizeUdfPath(name), args, options);
		return this.localQueryResultByToken(token);
	}
	/**
	* @internal
	*/
	localQueryResultByToken(token) {
		const paginatedQuery = this.paginatedQuerySet.get(token);
		if (!paginatedQuery) return;
		const activePages = this.activePageQueryTokens(paginatedQuery);
		if (activePages.length === 0) return {
			results: [],
			status: "LoadingFirstPage",
			loadMore: (numItems) => {
				return this.loadMoreOfPaginatedQuery(token, numItems);
			}
		};
		let allResults = [];
		let hasUndefined = false;
		let isDone = false;
		for (const pageToken of activePages) {
			const result = this.client.localQueryResultByToken(pageToken);
			if (result === void 0) {
				hasUndefined = true;
				isDone = false;
				continue;
			}
			const paginationResult = asPaginationResult(result);
			allResults = allResults.concat(paginationResult.page);
			isDone = !!paginationResult.isDone;
		}
		let status;
		if (hasUndefined) status = allResults.length === 0 ? "LoadingFirstPage" : "LoadingMore";
		else if (isDone) status = "Exhausted";
		else status = "CanLoadMore";
		return {
			results: allResults,
			status,
			loadMore: (numItems) => {
				return this.loadMoreOfPaginatedQuery(token, numItems);
			}
		};
	}
	onBaseTransition(transition) {
		const changedBaseTokens = transition.queries.map((q) => q.token);
		const changed = this.queriesContainingTokens(changedBaseTokens);
		let paginatedQueries = [];
		if (changed.length > 0) {
			this.processPaginatedQuerySplits(changed, (token) => this.client.localQueryResultByToken(token));
			paginatedQueries = changed.map((token) => ({
				token,
				modification: {
					kind: "Updated",
					result: this.localQueryResultByToken(token)
				}
			}));
		}
		const extendedTransition = {
			...transition,
			paginatedQueries
		};
		this.onTransition(extendedTransition);
	}
	/**
	* Load more items for a paginated query.
	*
	* This *always* causes a transition, the status of the query
	* has probably changed from "CanLoadMore" to "LoadingMore".
	* Data might have changed too: maybe a subscription to this page
	* query already exists (unlikely but possible) or this page query
	* has an optimistic update providing some initial data.
	*
	* @internal
	*/
	loadMoreOfPaginatedQuery(token, numItems) {
		this.mustGetPaginatedQuery(token);
		const lastPageToken = this.queryTokenForLastPageOfPaginatedQuery(token);
		const lastPageResult = this.client.localQueryResultByToken(lastPageToken);
		if (!lastPageResult) return false;
		const paginationResult = asPaginationResult(lastPageResult);
		if (paginationResult.isDone) return false;
		this.addPageToPaginatedQuery(token, paginationResult.continueCursor, numItems);
		const loadMoreTransition = {
			timestamp: this.lastTransitionTs,
			reflectedMutations: [],
			queries: [],
			paginatedQueries: [{
				token,
				modification: {
					kind: "Updated",
					result: this.localQueryResultByToken(token)
				}
			}]
		};
		this.onTransition(loadMoreTransition);
		return true;
	}
	/**
	* @internal
	*/
	queriesContainingTokens(queryTokens) {
		if (queryTokens.length === 0) return [];
		const changed = [];
		const queryTokenSet = new Set(queryTokens);
		for (const [paginatedToken, paginatedQuery] of this.paginatedQuerySet) for (const pageToken of this.allQueryTokens(paginatedQuery)) if (queryTokenSet.has(pageToken)) {
			changed.push(paginatedToken);
			break;
		}
		return changed;
	}
	/**
	* @internal
	*/
	processPaginatedQuerySplits(changed, getResult) {
		for (const paginatedQueryToken of changed) {
			const paginatedQuery = this.mustGetPaginatedQuery(paginatedQueryToken);
			const { ongoingSplits, pageKeyToQuery, pageKeys } = paginatedQuery;
			for (const [pageKey, [splitKey1, splitKey2]] of ongoingSplits) if (getResult(pageKeyToQuery.get(splitKey1).queryToken) !== void 0 && getResult(pageKeyToQuery.get(splitKey2).queryToken) !== void 0) this.completePaginatedQuerySplit(paginatedQuery, pageKey, splitKey1, splitKey2);
			for (const pageKey of pageKeys) {
				if (ongoingSplits.has(pageKey)) continue;
				const pageToken = pageKeyToQuery.get(pageKey).queryToken;
				const pageResult = getResult(pageToken);
				if (!pageResult) continue;
				const result = asPaginationResult(pageResult);
				if (result.splitCursor && (result.pageStatus === "SplitRecommended" || result.pageStatus === "SplitRequired" || result.page.length > paginatedQuery.options.initialNumItems * 2)) this.splitPaginatedQueryPage(paginatedQuery, pageKey, result.splitCursor, result.continueCursor);
			}
		}
	}
	splitPaginatedQueryPage(paginatedQuery, pageKey, splitCursor, continueCursor) {
		const splitKey1 = paginatedQuery.nextPageKey++;
		const splitKey2 = paginatedQuery.nextPageKey++;
		const paginationOpts = {
			cursor: continueCursor,
			numItems: paginatedQuery.options.initialNumItems,
			id: paginatedQuery.id
		};
		const firstSubscription = this.client.subscribe(paginatedQuery.canonicalizedUdfPath, {
			...paginatedQuery.args,
			paginationOpts: {
				...paginationOpts,
				cursor: null,
				endCursor: splitCursor
			}
		});
		paginatedQuery.pageKeyToQuery.set(splitKey1, firstSubscription);
		const secondSubscription = this.client.subscribe(paginatedQuery.canonicalizedUdfPath, {
			...paginatedQuery.args,
			paginationOpts: {
				...paginationOpts,
				cursor: splitCursor,
				endCursor: continueCursor
			}
		});
		paginatedQuery.pageKeyToQuery.set(splitKey2, secondSubscription);
		paginatedQuery.ongoingSplits.set(pageKey, [splitKey1, splitKey2]);
	}
	/**
	* @internal
	*/
	addPageToPaginatedQuery(token, continueCursor, numItems) {
		const paginatedQuery = this.mustGetPaginatedQuery(token);
		const pageKey = paginatedQuery.nextPageKey++;
		const paginationOpts = {
			cursor: continueCursor,
			numItems,
			id: paginatedQuery.id
		};
		const pageArgs = {
			...paginatedQuery.args,
			paginationOpts
		};
		const subscription = this.client.subscribe(paginatedQuery.canonicalizedUdfPath, pageArgs);
		paginatedQuery.pageKeys.push(pageKey);
		paginatedQuery.pageKeyToQuery.set(pageKey, subscription);
		return subscription;
	}
	removePaginatedQuerySubscriber(token) {
		const paginatedQuery = this.paginatedQuerySet.get(token);
		if (!paginatedQuery) return;
		paginatedQuery.numSubscribers -= 1;
		if (paginatedQuery.numSubscribers > 0) return;
		for (const subscription of paginatedQuery.pageKeyToQuery.values()) subscription.unsubscribe();
		this.paginatedQuerySet.delete(token);
	}
	completePaginatedQuerySplit(paginatedQuery, pageKey, splitKey1, splitKey2) {
		const originalQuery = paginatedQuery.pageKeyToQuery.get(pageKey);
		paginatedQuery.pageKeyToQuery.delete(pageKey);
		const pageIndex = paginatedQuery.pageKeys.indexOf(pageKey);
		paginatedQuery.pageKeys.splice(pageIndex, 1, splitKey1, splitKey2);
		paginatedQuery.ongoingSplits.delete(pageKey);
		originalQuery.unsubscribe();
	}
	/** The query tokens for all active pages, in result order */
	activePageQueryTokens(paginatedQuery) {
		return paginatedQuery.pageKeys.map((pageKey) => paginatedQuery.pageKeyToQuery.get(pageKey).queryToken);
	}
	allQueryTokens(paginatedQuery) {
		return Array.from(paginatedQuery.pageKeyToQuery.values()).map((sub) => sub.queryToken);
	}
	queryTokenForLastPageOfPaginatedQuery(token) {
		const paginatedQuery = this.mustGetPaginatedQuery(token);
		const lastPageKey = paginatedQuery.pageKeys[paginatedQuery.pageKeys.length - 1];
		if (lastPageKey === void 0) throw new Error(`No pages for paginated query ${token}`);
		return paginatedQuery.pageKeyToQuery.get(lastPageKey).queryToken;
	}
	mustGetPaginatedQuery(token) {
		const paginatedQuery = this.paginatedQuerySet.get(token);
		if (!paginatedQuery) throw new Error("paginated query no longer exists for token " + token);
		return paginatedQuery;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/convex@1.42.1_react@19.2.7/node_modules/convex/dist/esm/browser/simple_client.js
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var ConvexClient = class {
	/**
	* Construct a client and immediately initiate a WebSocket connection to the passed address.
	*
	* @public
	*/
	constructor(address, options = {}) {
		__publicField(this, "listeners");
		__publicField(this, "_client");
		__publicField(this, "_paginatedClient");
		__publicField(this, "callNewListenersWithCurrentValuesTimer");
		__publicField(this, "_closed");
		__publicField(this, "_disabled");
		if (options.skipConvexDeploymentUrlCheck !== true) validateDeploymentUrl(address);
		const { disabled, ...baseOptions } = options;
		this._closed = false;
		this._disabled = !!disabled;
		if (typeof window === "undefined" && !("unsavedChangesWarning" in baseOptions)) baseOptions.unsavedChangesWarning = false;
		if (!this.disabled) {
			this._client = new BaseConvexClient(address, () => {}, baseOptions);
			this._paginatedClient = new PaginatedQueryClient(this._client, (transition) => this._transition(transition));
		}
		this.listeners = /* @__PURE__ */ new Set();
	}
	/**
	* Once closed no registered callbacks will fire again.
	*/
	get closed() {
		return this._closed;
	}
	get client() {
		if (this._client) return this._client;
		throw new Error("ConvexClient is disabled");
	}
	/**
	* @internal
	*/
	get paginatedClient() {
		if (this._paginatedClient) return this._paginatedClient;
		throw new Error("ConvexClient is disabled");
	}
	get disabled() {
		return this._disabled;
	}
	/**
	* Call a callback whenever a new result for a query is received. The callback
	* will run soon after being registered if a result for the query is already
	* in memory.
	*
	* The return value is an {@link Unsubscribe} object which is both a function
	* an an object with properties. Both of the patterns below work with this object:
	*
	*```ts
	* // call the return value as a function
	* const unsubscribe = client.onUpdate(api.messages.list, {}, (messages) => {
	*   console.log(messages);
	* });
	* unsubscribe();
	*
	* // unpack the return value into its properties
	* const {
	*   getCurrentValue,
	*   unsubscribe,
	* } = client.onUpdate(api.messages.list, {}, (messages) => {
	*   console.log(messages);
	* });
	*```
	*
	* @param query - A {@link server.FunctionReference} for the public query to run.
	* @param args - The arguments to run the query with.
	* @param callback - Function to call when the query result updates.
	* @param onError - Function to call when the query result updates with an error.
	* If not provided, errors will be thrown instead of calling the callback.
	*
	* @return an {@link Unsubscribe} function to stop calling the onUpdate function.
	*/
	onUpdate(query, args, callback, onError) {
		if (this.disabled) return this.createDisabledUnsubscribe();
		const { queryToken, unsubscribe } = this.client.subscribe(getFunctionName(query), args);
		const queryInfo = {
			queryToken,
			callback,
			onError,
			unsubscribe,
			hasEverRun: false,
			query,
			args,
			paginationOptions: void 0
		};
		this.listeners.add(queryInfo);
		if (this.queryResultReady(queryToken) && this.callNewListenersWithCurrentValuesTimer === void 0) this.callNewListenersWithCurrentValuesTimer = setTimeout(() => this.callNewListenersWithCurrentValues(), 0);
		const unsubscribeProps = {
			unsubscribe: () => {
				if (this.closed) return;
				this.listeners.delete(queryInfo);
				unsubscribe();
			},
			getCurrentValue: () => this.client.localQueryResultByToken(queryToken),
			getQueryLogs: () => this.client.localQueryLogs(queryToken)
		};
		const ret = unsubscribeProps.unsubscribe;
		Object.assign(ret, unsubscribeProps);
		return ret;
	}
	/**
	* Call a callback whenever a new result for a paginated query is received.
	*
	* This is an experimental preview: the final API may change.
	* In particular, caching behavior, page splitting, and required paginated query options
	* may change.
	*
	* @param query - A {@link server.FunctionReference} for the public query to run.
	* @param args - The arguments to run the query with.
	* @param options - Options for the paginated query including initialNumItems and id.
	* @param callback - Function to call when the query result updates.
	* @param onError - Function to call when the query result updates with an error.
	*
	* @return an {@link Unsubscribe} function to stop calling the callback.
	*/
	onPaginatedUpdate_experimental(query, args, options, callback, onError) {
		if (this.disabled) return this.createDisabledUnsubscribe();
		const paginationOptions = {
			initialNumItems: options.initialNumItems,
			id: -1
		};
		const { paginatedQueryToken, unsubscribe } = this.paginatedClient.subscribe(getFunctionName(query), args, paginationOptions);
		const queryInfo = {
			queryToken: paginatedQueryToken,
			callback,
			onError,
			unsubscribe,
			hasEverRun: false,
			query,
			args,
			paginationOptions
		};
		this.listeners.add(queryInfo);
		if (!!this.paginatedClient.localQueryResultByToken(paginatedQueryToken) && this.callNewListenersWithCurrentValuesTimer === void 0) this.callNewListenersWithCurrentValuesTimer = setTimeout(() => this.callNewListenersWithCurrentValues(), 0);
		const unsubscribeProps = {
			unsubscribe: () => {
				if (this.closed) return;
				this.listeners.delete(queryInfo);
				unsubscribe();
			},
			getCurrentValue: () => {
				return this.paginatedClient.localQueryResult(getFunctionName(query), args, paginationOptions);
			},
			getQueryLogs: () => []
		};
		const ret = unsubscribeProps.unsubscribe;
		Object.assign(ret, unsubscribeProps);
		return ret;
	}
	callNewListenersWithCurrentValues() {
		this.callNewListenersWithCurrentValuesTimer = void 0;
		this._transition({
			queries: [],
			paginatedQueries: []
		}, true);
	}
	queryResultReady(queryToken) {
		return this.client.hasLocalQueryResultByToken(queryToken);
	}
	createDisabledUnsubscribe() {
		const disabledUnsubscribe = (() => {});
		Object.assign(disabledUnsubscribe, {
			unsubscribe: disabledUnsubscribe,
			getCurrentValue: () => void 0,
			getQueryLogs: () => void 0
		});
		return disabledUnsubscribe;
	}
	async close() {
		if (this.disabled) return;
		this.listeners.clear();
		this._closed = true;
		if (this._paginatedClient) this._paginatedClient = void 0;
		return this.client.close();
	}
	/**
	* Get the current JWT auth token and decoded claims.
	*/
	getAuth() {
		if (this.disabled) return;
		return this.client.getCurrentAuthClaims();
	}
	/**
	* Set the authentication token to be used for subsequent queries and mutations.
	* `fetchToken` will be called automatically again if a token expires.
	* `fetchToken` should return `null` if the token cannot be retrieved, for example
	* when the user's rights were permanently revoked.
	* @param fetchToken - an async function returning the JWT (typically an OpenID Connect Identity Token)
	* @param onChange - a callback that will be called when the authentication status changes
	*/
	setAuth(fetchToken, onChange) {
		if (this.disabled) return;
		this.client.setAuth(fetchToken, onChange ?? (() => {}));
	}
	/**
	* @internal
	*/
	setAdminAuth(token, identity) {
		if (this.closed) throw new Error("ConvexClient has already been closed.");
		if (this.disabled) return;
		this.client.setAdminAuth(token, identity);
	}
	/**
	* @internal
	*/
	_transition({ queries, paginatedQueries }, callNewListeners = false) {
		const updatedQueries = [...queries.map((q) => q.token), ...paginatedQueries.map((q) => q.token)];
		for (const queryInfo of this.listeners) {
			const { callback, queryToken, onError, hasEverRun } = queryInfo;
			const isPaginatedQuery = serializedQueryTokenIsPaginated(queryToken);
			const hasResultReady = isPaginatedQuery ? !!this.paginatedClient.localQueryResultByToken(queryToken) : this.client.hasLocalQueryResultByToken(queryToken);
			if (updatedQueries.includes(queryToken) || callNewListeners && !hasEverRun && hasResultReady) {
				queryInfo.hasEverRun = true;
				let newValue;
				try {
					if (isPaginatedQuery) newValue = this.paginatedClient.localQueryResultByToken(queryToken);
					else newValue = this.client.localQueryResultByToken(queryToken);
				} catch (error) {
					if (!(error instanceof Error)) throw error;
					if (onError) onError(error, "Second argument to onUpdate onError is reserved for later use");
					else Promise.reject(error);
					continue;
				}
				callback(newValue, "Second argument to onUpdate callback is reserved for later use");
			}
		}
	}
	/**
	* Execute a mutation function.
	*
	* @param mutation - A {@link server.FunctionReference} for the public mutation
	* to run.
	* @param args - An arguments object for the mutation.
	* @param options - A {@link MutationOptions} options object for the mutation.
	* @returns A promise of the mutation's result.
	*/
	async mutation(mutation, args, options) {
		if (this.disabled) throw new Error("ConvexClient is disabled");
		return await this.client.mutation(getFunctionName(mutation), args, options);
	}
	/**
	* Execute an action function.
	*
	* @param action - A {@link server.FunctionReference} for the public action
	* to run.
	* @param args - An arguments object for the action.
	* @returns A promise of the action's result.
	*/
	async action(action, args) {
		if (this.disabled) throw new Error("ConvexClient is disabled");
		return await this.client.action(getFunctionName(action), args);
	}
	/**
	* Fetch a query result once.
	*
	* @param query - A {@link server.FunctionReference} for the public query
	* to run.
	* @param args - An arguments object for the query.
	* @returns A promise of the query's result.
	*/
	async query(query, args) {
		if (this.disabled) throw new Error("ConvexClient is disabled");
		const value = this.client.localQueryResult(getFunctionName(query), args);
		if (value !== void 0) return Promise.resolve(value);
		return new Promise((resolve, reject) => {
			const { unsubscribe } = this.onUpdate(query, args, (value2) => {
				unsubscribe();
				resolve(value2);
			}, (e) => {
				unsubscribe();
				reject(e);
			});
		});
	}
	/**
	* Get the current {@link ConnectionState} between the client and the Convex
	* backend.
	*
	* @returns The {@link ConnectionState} with the Convex backend.
	*/
	connectionState() {
		if (this.disabled) throw new Error("ConvexClient is disabled");
		return this.client.connectionState();
	}
	/**
	* Subscribe to the {@link ConnectionState} between the client and the Convex
	* backend, calling a callback each time it changes.
	*
	* Subscribed callbacks will be called when any part of ConnectionState changes.
	* ConnectionState may grow in future versions (e.g. to provide a array of
	* inflight requests) in which case callbacks would be called more frequently.
	*
	* @returns An unsubscribe function to stop listening.
	*/
	subscribeToConnectionState(cb) {
		if (this.disabled) return () => {};
		return this.client.subscribeToConnectionState(cb);
	}
};
//#endregion
export { ConvexError as a, makeFunctionReference as i, ConvexHttpClient as n, anyApi as r, ConvexClient as t };

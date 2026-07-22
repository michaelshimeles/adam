import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { r as __require, t as __commonJSMin } from "../_runtime.mjs";
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/types.js
var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/CronField.js
var require_CronField = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronField = void 0;
	exports.CronField = class CronField {
		#hasLastChar = false;
		#hasQuestionMarkChar = false;
		#wildcard = false;
		#values = [];
		options = { rawValue: "" };
		/**
		* Returns the minimum value allowed for this field.
		*/
		/* istanbul ignore next */ static get min() {
			/* istanbul ignore next */
			throw new Error("min must be overridden");
		}
		/**
		* Returns the maximum value allowed for this field.
		*/
		/* istanbul ignore next */ static get max() {
			/* istanbul ignore next */
			throw new Error("max must be overridden");
		}
		/**
		* Returns the allowed characters for this field.
		*/
		/* istanbul ignore next */ static get chars() {
			/* istanbul ignore next - this is overridden */
			return Object.freeze([]);
		}
		/**
		* Returns the regular expression used to validate this field.
		*/
		static get validChars() {
			return /^[?,*\dH/-]+$|^.*H\(\d+-\d+\)\/\d+.*$|^.*H\(\d+-\d+\).*$|^.*H\/\d+.*$/;
		}
		/**
		* Returns the constraints for this field.
		*/
		static get constraints() {
			return {
				min: this.min,
				max: this.max,
				chars: this.chars,
				validChars: this.validChars
			};
		}
		/**
		* CronField constructor. Initializes the field with the provided values.
		* @param {number[] | string[]} values - Values for this field
		* @param {CronFieldOptions} [options] - Options provided by the parser
		* @throws {TypeError} if the constructor is called directly
		* @throws {Error} if validation fails
		*/
		constructor(values, options = { rawValue: "" }) {
			if (!Array.isArray(values)) throw new Error(`${this.constructor.name} Validation error, values is not an array`);
			if (!(values.length > 0)) throw new Error(`${this.constructor.name} Validation error, values contains no values`);
			/* istanbul ignore next */
			this.options = {
				...options,
				rawValue: options.rawValue ?? ""
			};
			this.#values = values.sort(CronField.sorter);
			this.#wildcard = this.options.wildcard !== void 0 ? this.options.wildcard : this.#isWildcardValue();
			this.#hasLastChar = this.options.rawValue.includes("L") || values.includes("L");
			this.#hasQuestionMarkChar = this.options.rawValue.includes("?") || values.includes("?");
		}
		/**
		* Returns the minimum value allowed for this field.
		* @returns {number}
		*/
		get min() {
			return this.constructor.min;
		}
		/**
		* Returns the maximum value allowed for this field.
		* @returns {number}
		*/
		get max() {
			return this.constructor.max;
		}
		/**
		* Returns an array of allowed special characters for this field.
		* @returns {string[]}
		*/
		get chars() {
			return this.constructor.chars;
		}
		/**
		* Indicates whether this field has a "last" character.
		* @returns {boolean}
		*/
		get hasLastChar() {
			return this.#hasLastChar;
		}
		/**
		* Indicates whether this field has a "question mark" character.
		* @returns {boolean}
		*/
		get hasQuestionMarkChar() {
			return this.#hasQuestionMarkChar;
		}
		/**
		* Indicates whether this field is a wildcard.
		* @returns {boolean}
		*/
		get isWildcard() {
			return this.#wildcard;
		}
		/**
		* Returns an array of allowed values for this field.
		* @returns {CronFieldType}
		*/
		get values() {
			return this.#values;
		}
		/**
		* Helper function to sort values in ascending order.
		* @param {number | string} a - First value to compare
		* @param {number | string} b - Second value to compare
		* @returns {number} - A negative, zero, or positive value, depending on the sort order
		*/
		static sorter(a, b) {
			const aIsNumber = typeof a === "number";
			const bIsNumber = typeof b === "number";
			if (aIsNumber && bIsNumber) return a - b;
			if (!aIsNumber && !bIsNumber) return a.localeCompare(b);
			return aIsNumber ? -1 : 1;
		}
		/**
		* Find the next (or previous when `reverse` is true) numeric value in a sorted list.
		* Returns null if there's no value strictly after/before the current one.
		*
		* @param values - Sorted numeric values
		* @param currentValue - Current value to compare against
		* @param reverse - When true, search in reverse for previous smaller value
		*/
		static findNearestValueInList(values, currentValue, reverse) {
			if (reverse) {
				for (let i = values.length - 1; i >= 0; i--) if (values[i] < currentValue) return values[i];
				return null;
			}
			for (let i = 0; i < values.length; i++) if (values[i] > currentValue) return values[i];
			return null;
		}
		/**
		* Instance helper that operates on this field's numeric `values`.
		*
		* @param currentValue - Current value to compare against
		* @param reverse - When true, search in reverse for previous smaller value
		*/
		findNearestValue(currentValue, reverse) {
			return this.constructor.findNearestValueInList(this.values, currentValue, reverse);
		}
		/**
		* Serializes the field to an object.
		* @returns {SerializedCronField}
		*/
		serialize() {
			return {
				wildcard: this.#wildcard,
				values: this.#values
			};
		}
		/**
		* Validates the field values against the allowed range and special characters.
		* @throws {Error} if validation fails
		*/
		validate() {
			let badValue;
			const charsString = this.chars.length > 0 ? ` or chars ${this.chars.join("")}` : "";
			const charTest = (value) => (char) => new RegExp(`^\\d{0,2}${char}$`).test(value);
			const rangeTest = (value) => {
				badValue = value;
				return typeof value === "number" ? value >= this.min && value <= this.max : this.chars.some(charTest(value));
			};
			if (!this.#values.every(rangeTest)) throw new Error(`${this.constructor.name} Validation error, got value ${badValue} expected range ${this.min}-${this.max}${charsString}`);
			const duplicate = this.#values.find((value, index) => this.#values.indexOf(value) !== index);
			if (duplicate) throw new Error(`${this.constructor.name} Validation error, duplicate values found: ${duplicate}`);
		}
		/**
		* Determines if the field is a wildcard based on the values.
		* When options.rawValue is not empty, it checks if the raw value is a wildcard, otherwise it checks if all values in the range are included.
		* @returns {boolean}
		*/
		#isWildcardValue() {
			if (this.options.rawValue.length > 0) return ["*", "?"].includes(this.options.rawValue);
			return Array.from({ length: this.max - this.min + 1 }, (_, i) => i + this.min).every((value) => this.#values.includes(value));
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/CronDayOfMonth.js
var require_CronDayOfMonth = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronDayOfMonth = void 0;
	const CronField_1 = require_CronField();
	const MIN_DAY = 1;
	const MAX_DAY = 31;
	const DAY_CHARS = Object.freeze(["L"]);
	/**
	* Represents the "day of the month" field within a cron expression.
	* @class CronDayOfMonth
	* @extends CronField
	*/
	var CronDayOfMonth = class extends CronField_1.CronField {
		static get min() {
			return MIN_DAY;
		}
		static get max() {
			return MAX_DAY;
		}
		static get chars() {
			return DAY_CHARS;
		}
		static get validChars() {
			return /^[?,*\dLH/-]+$|^.*H\(\d+-\d+\)\/\d+.*$|^.*H\(\d+-\d+\).*$|^.*H\/\d+.*$/;
		}
		/**
		* CronDayOfMonth constructor. Initializes the "day of the month" field with the provided values.
		* @param {DayOfMonthRange[]} values - Values for the "day of the month" field
		* @param {CronFieldOptions} [options] - Options provided by the parser
		* @throws {Error} if validation fails
		*/
		constructor(values, options) {
			super(values, options);
			this.validate();
		}
		/**
		* Returns an array of allowed values for the "day of the month" field.
		* @returns {DayOfMonthRange[]}
		*/
		get values() {
			return super.values;
		}
	};
	exports.CronDayOfMonth = CronDayOfMonth;
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/CronDayOfWeek.js
var require_CronDayOfWeek = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronDayOfWeek = void 0;
	const CronField_1 = require_CronField();
	const MIN_DAY = 0;
	const MAX_DAY = 7;
	const DAY_CHARS = Object.freeze(["L"]);
	/**
	* Represents the "day of the week" field within a cron expression.
	* @class CronDayOfTheWeek
	* @extends CronField
	*/
	var CronDayOfWeek = class extends CronField_1.CronField {
		static get min() {
			return MIN_DAY;
		}
		static get max() {
			return MAX_DAY;
		}
		static get chars() {
			return DAY_CHARS;
		}
		static get validChars() {
			return /^[?,*\dLH#/-]+$|^.*H\(\d+-\d+\)\/\d+.*$|^.*H\(\d+-\d+\).*$|^.*H\/\d+.*$/;
		}
		/**
		* CronDayOfTheWeek constructor. Initializes the "day of the week" field with the provided values.
		* @param {DayOfWeekRange[]} values - Values for the "day of the week" field
		* @param {CronFieldOptions} [options] - Options provided by the parser
		*/
		constructor(values, options) {
			super(values, options);
			this.validate();
		}
		/**
		* Returns an array of allowed values for the "day of the week" field.
		* @returns {DayOfWeekRange[]}
		*/
		get values() {
			return super.values;
		}
		/**
		* Returns the nth day of the week if specified in the cron expression.
		* This is used for the '#' character in the cron expression.
		* @returns {number} The nth day of the week (1-5) or 0 if not specified.
		*/
		get nthDay() {
			return this.options.nthDayOfWeek ?? 0;
		}
	};
	exports.CronDayOfWeek = CronDayOfWeek;
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/CronHour.js
var require_CronHour = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronHour = void 0;
	const CronField_1 = require_CronField();
	const MIN_HOUR = 0;
	const MAX_HOUR = 23;
	const HOUR_CHARS = Object.freeze([]);
	/**
	* Represents the "hour" field within a cron expression.
	* @class CronHour
	* @extends CronField
	*/
	var CronHour = class extends CronField_1.CronField {
		static get min() {
			return MIN_HOUR;
		}
		static get max() {
			return MAX_HOUR;
		}
		static get chars() {
			return HOUR_CHARS;
		}
		/**
		* CronHour constructor. Initializes the "hour" field with the provided values.
		* @param {HourRange[]} values - Values for the "hour" field
		* @param {CronFieldOptions} [options] - Options provided by the parser
		*/
		constructor(values, options) {
			super(values, options);
			this.validate();
		}
		/**
		* Returns an array of allowed values for the "hour" field.
		* @returns {HourRange[]}
		*/
		get values() {
			return super.values;
		}
	};
	exports.CronHour = CronHour;
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/CronMinute.js
var require_CronMinute = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronMinute = void 0;
	const CronField_1 = require_CronField();
	const MIN_MINUTE = 0;
	const MAX_MINUTE = 59;
	const MINUTE_CHARS = Object.freeze([]);
	/**
	* Represents the "second" field within a cron expression.
	* @class CronSecond
	* @extends CronField
	*/
	var CronMinute = class extends CronField_1.CronField {
		static get min() {
			return MIN_MINUTE;
		}
		static get max() {
			return MAX_MINUTE;
		}
		static get chars() {
			return MINUTE_CHARS;
		}
		/**
		* CronSecond constructor. Initializes the "second" field with the provided values.
		* @param {SixtyRange[]} values - Values for the "second" field
		* @param {CronFieldOptions} [options] - Options provided by the parser
		*/
		constructor(values, options) {
			super(values, options);
			this.validate();
		}
		/**
		* Returns an array of allowed values for the "second" field.
		* @returns {SixtyRange[]}
		*/
		get values() {
			return super.values;
		}
	};
	exports.CronMinute = CronMinute;
}));
//#endregion
//#region ../../node_modules/.pnpm/luxon@3.7.2/node_modules/luxon/build/node/luxon.js
var require_luxon = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	/**
	* @private
	*/
	var LuxonError = class extends Error {};
	/**
	* @private
	*/
	var InvalidDateTimeError = class extends LuxonError {
		constructor(reason) {
			super(`Invalid DateTime: ${reason.toMessage()}`);
		}
	};
	/**
	* @private
	*/
	var InvalidIntervalError = class extends LuxonError {
		constructor(reason) {
			super(`Invalid Interval: ${reason.toMessage()}`);
		}
	};
	/**
	* @private
	*/
	var InvalidDurationError = class extends LuxonError {
		constructor(reason) {
			super(`Invalid Duration: ${reason.toMessage()}`);
		}
	};
	/**
	* @private
	*/
	var ConflictingSpecificationError = class extends LuxonError {};
	/**
	* @private
	*/
	var InvalidUnitError = class extends LuxonError {
		constructor(unit) {
			super(`Invalid unit ${unit}`);
		}
	};
	/**
	* @private
	*/
	var InvalidArgumentError = class extends LuxonError {};
	/**
	* @private
	*/
	var ZoneIsAbstractError = class extends LuxonError {
		constructor() {
			super("Zone is an abstract class");
		}
	};
	/**
	* @private
	*/
	const n = "numeric", s = "short", l = "long";
	const DATE_SHORT = {
		year: n,
		month: n,
		day: n
	};
	const DATE_MED = {
		year: n,
		month: s,
		day: n
	};
	const DATE_MED_WITH_WEEKDAY = {
		year: n,
		month: s,
		day: n,
		weekday: s
	};
	const DATE_FULL = {
		year: n,
		month: l,
		day: n
	};
	const DATE_HUGE = {
		year: n,
		month: l,
		day: n,
		weekday: l
	};
	const TIME_SIMPLE = {
		hour: n,
		minute: n
	};
	const TIME_WITH_SECONDS = {
		hour: n,
		minute: n,
		second: n
	};
	const TIME_WITH_SHORT_OFFSET = {
		hour: n,
		minute: n,
		second: n,
		timeZoneName: s
	};
	const TIME_WITH_LONG_OFFSET = {
		hour: n,
		minute: n,
		second: n,
		timeZoneName: l
	};
	const TIME_24_SIMPLE = {
		hour: n,
		minute: n,
		hourCycle: "h23"
	};
	const TIME_24_WITH_SECONDS = {
		hour: n,
		minute: n,
		second: n,
		hourCycle: "h23"
	};
	const TIME_24_WITH_SHORT_OFFSET = {
		hour: n,
		minute: n,
		second: n,
		hourCycle: "h23",
		timeZoneName: s
	};
	const TIME_24_WITH_LONG_OFFSET = {
		hour: n,
		minute: n,
		second: n,
		hourCycle: "h23",
		timeZoneName: l
	};
	const DATETIME_SHORT = {
		year: n,
		month: n,
		day: n,
		hour: n,
		minute: n
	};
	const DATETIME_SHORT_WITH_SECONDS = {
		year: n,
		month: n,
		day: n,
		hour: n,
		minute: n,
		second: n
	};
	const DATETIME_MED = {
		year: n,
		month: s,
		day: n,
		hour: n,
		minute: n
	};
	const DATETIME_MED_WITH_SECONDS = {
		year: n,
		month: s,
		day: n,
		hour: n,
		minute: n,
		second: n
	};
	const DATETIME_MED_WITH_WEEKDAY = {
		year: n,
		month: s,
		day: n,
		weekday: s,
		hour: n,
		minute: n
	};
	const DATETIME_FULL = {
		year: n,
		month: l,
		day: n,
		hour: n,
		minute: n,
		timeZoneName: s
	};
	const DATETIME_FULL_WITH_SECONDS = {
		year: n,
		month: l,
		day: n,
		hour: n,
		minute: n,
		second: n,
		timeZoneName: s
	};
	const DATETIME_HUGE = {
		year: n,
		month: l,
		day: n,
		weekday: l,
		hour: n,
		minute: n,
		timeZoneName: l
	};
	const DATETIME_HUGE_WITH_SECONDS = {
		year: n,
		month: l,
		day: n,
		weekday: l,
		hour: n,
		minute: n,
		second: n,
		timeZoneName: l
	};
	/**
	* @interface
	*/
	var Zone = class {
		/**
		* The type of zone
		* @abstract
		* @type {string}
		*/
		get type() {
			throw new ZoneIsAbstractError();
		}
		/**
		* The name of this zone.
		* @abstract
		* @type {string}
		*/
		get name() {
			throw new ZoneIsAbstractError();
		}
		/**
		* The IANA name of this zone.
		* Defaults to `name` if not overwritten by a subclass.
		* @abstract
		* @type {string}
		*/
		get ianaName() {
			return this.name;
		}
		/**
		* Returns whether the offset is known to be fixed for the whole year.
		* @abstract
		* @type {boolean}
		*/
		get isUniversal() {
			throw new ZoneIsAbstractError();
		}
		/**
		* Returns the offset's common name (such as EST) at the specified timestamp
		* @abstract
		* @param {number} ts - Epoch milliseconds for which to get the name
		* @param {Object} opts - Options to affect the format
		* @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
		* @param {string} opts.locale - What locale to return the offset name in.
		* @return {string}
		*/
		offsetName(ts, opts) {
			throw new ZoneIsAbstractError();
		}
		/**
		* Returns the offset's value as a string
		* @abstract
		* @param {number} ts - Epoch milliseconds for which to get the offset
		* @param {string} format - What style of offset to return.
		*                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
		* @return {string}
		*/
		formatOffset(ts, format) {
			throw new ZoneIsAbstractError();
		}
		/**
		* Return the offset in minutes for this zone at the specified timestamp.
		* @abstract
		* @param {number} ts - Epoch milliseconds for which to compute the offset
		* @return {number}
		*/
		offset(ts) {
			throw new ZoneIsAbstractError();
		}
		/**
		* Return whether this Zone is equal to another zone
		* @abstract
		* @param {Zone} otherZone - the zone to compare
		* @return {boolean}
		*/
		equals(otherZone) {
			throw new ZoneIsAbstractError();
		}
		/**
		* Return whether this Zone is valid.
		* @abstract
		* @type {boolean}
		*/
		get isValid() {
			throw new ZoneIsAbstractError();
		}
	};
	let singleton$1 = null;
	/**
	* Represents the local zone for this JavaScript environment.
	* @implements {Zone}
	*/
	var SystemZone = class SystemZone extends Zone {
		/**
		* Get a singleton instance of the local zone
		* @return {SystemZone}
		*/
		static get instance() {
			if (singleton$1 === null) singleton$1 = new SystemZone();
			return singleton$1;
		}
		/** @override **/
		get type() {
			return "system";
		}
		/** @override **/
		get name() {
			return new Intl.DateTimeFormat().resolvedOptions().timeZone;
		}
		/** @override **/
		get isUniversal() {
			return false;
		}
		/** @override **/
		offsetName(ts, { format, locale }) {
			return parseZoneInfo(ts, format, locale);
		}
		/** @override **/
		formatOffset(ts, format) {
			return formatOffset(this.offset(ts), format);
		}
		/** @override **/
		offset(ts) {
			return -new Date(ts).getTimezoneOffset();
		}
		/** @override **/
		equals(otherZone) {
			return otherZone.type === "system";
		}
		/** @override **/
		get isValid() {
			return true;
		}
	};
	const dtfCache = /* @__PURE__ */ new Map();
	function makeDTF(zoneName) {
		let dtf = dtfCache.get(zoneName);
		if (dtf === void 0) {
			dtf = new Intl.DateTimeFormat("en-US", {
				hour12: false,
				timeZone: zoneName,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				era: "short"
			});
			dtfCache.set(zoneName, dtf);
		}
		return dtf;
	}
	const typeToPos = {
		year: 0,
		month: 1,
		day: 2,
		era: 3,
		hour: 4,
		minute: 5,
		second: 6
	};
	function hackyOffset(dtf, date) {
		const formatted = dtf.format(date).replace(/\u200E/g, ""), [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted);
		return [
			fYear,
			fMonth,
			fDay,
			fadOrBc,
			fHour,
			fMinute,
			fSecond
		];
	}
	function partsOffset(dtf, date) {
		const formatted = dtf.formatToParts(date);
		const filled = [];
		for (let i = 0; i < formatted.length; i++) {
			const { type, value } = formatted[i];
			const pos = typeToPos[type];
			if (type === "era") filled[pos] = value;
			else if (!isUndefined(pos)) filled[pos] = parseInt(value, 10);
		}
		return filled;
	}
	const ianaZoneCache = /* @__PURE__ */ new Map();
	/**
	* A zone identified by an IANA identifier, like America/New_York
	* @implements {Zone}
	*/
	var IANAZone = class IANAZone extends Zone {
		/**
		* @param {string} name - Zone name
		* @return {IANAZone}
		*/
		static create(name) {
			let zone = ianaZoneCache.get(name);
			if (zone === void 0) ianaZoneCache.set(name, zone = new IANAZone(name));
			return zone;
		}
		/**
		* Reset local caches. Should only be necessary in testing scenarios.
		* @return {void}
		*/
		static resetCache() {
			ianaZoneCache.clear();
			dtfCache.clear();
		}
		/**
		* Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
		* @param {string} s - The string to check validity on
		* @example IANAZone.isValidSpecifier("America/New_York") //=> true
		* @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
		* @deprecated For backward compatibility, this forwards to isValidZone, better use `isValidZone()` directly instead.
		* @return {boolean}
		*/
		static isValidSpecifier(s) {
			return this.isValidZone(s);
		}
		/**
		* Returns whether the provided string identifies a real zone
		* @param {string} zone - The string to check
		* @example IANAZone.isValidZone("America/New_York") //=> true
		* @example IANAZone.isValidZone("Fantasia/Castle") //=> false
		* @example IANAZone.isValidZone("Sport~~blorp") //=> false
		* @return {boolean}
		*/
		static isValidZone(zone) {
			if (!zone) return false;
			try {
				new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
				return true;
			} catch (e) {
				return false;
			}
		}
		constructor(name) {
			super();
			/** @private **/
			this.zoneName = name;
			/** @private **/
			this.valid = IANAZone.isValidZone(name);
		}
		/**
		* The type of zone. `iana` for all instances of `IANAZone`.
		* @override
		* @type {string}
		*/
		get type() {
			return "iana";
		}
		/**
		* The name of this zone (i.e. the IANA zone name).
		* @override
		* @type {string}
		*/
		get name() {
			return this.zoneName;
		}
		/**
		* Returns whether the offset is known to be fixed for the whole year:
		* Always returns false for all IANA zones.
		* @override
		* @type {boolean}
		*/
		get isUniversal() {
			return false;
		}
		/**
		* Returns the offset's common name (such as EST) at the specified timestamp
		* @override
		* @param {number} ts - Epoch milliseconds for which to get the name
		* @param {Object} opts - Options to affect the format
		* @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
		* @param {string} opts.locale - What locale to return the offset name in.
		* @return {string}
		*/
		offsetName(ts, { format, locale }) {
			return parseZoneInfo(ts, format, locale, this.name);
		}
		/**
		* Returns the offset's value as a string
		* @override
		* @param {number} ts - Epoch milliseconds for which to get the offset
		* @param {string} format - What style of offset to return.
		*                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
		* @return {string}
		*/
		formatOffset(ts, format) {
			return formatOffset(this.offset(ts), format);
		}
		/**
		* Return the offset in minutes for this zone at the specified timestamp.
		* @override
		* @param {number} ts - Epoch milliseconds for which to compute the offset
		* @return {number}
		*/
		offset(ts) {
			if (!this.valid) return NaN;
			const date = new Date(ts);
			if (isNaN(date)) return NaN;
			const dtf = makeDTF(this.name);
			let [year, month, day, adOrBc, hour, minute, second] = dtf.formatToParts ? partsOffset(dtf, date) : hackyOffset(dtf, date);
			if (adOrBc === "BC") year = -Math.abs(year) + 1;
			const asUTC = objToLocalTS({
				year,
				month,
				day,
				hour: hour === 24 ? 0 : hour,
				minute,
				second,
				millisecond: 0
			});
			let asTS = +date;
			const over = asTS % 1e3;
			asTS -= over >= 0 ? over : 1e3 + over;
			return (asUTC - asTS) / (60 * 1e3);
		}
		/**
		* Return whether this Zone is equal to another zone
		* @override
		* @param {Zone} otherZone - the zone to compare
		* @return {boolean}
		*/
		equals(otherZone) {
			return otherZone.type === "iana" && otherZone.name === this.name;
		}
		/**
		* Return whether this Zone is valid.
		* @override
		* @type {boolean}
		*/
		get isValid() {
			return this.valid;
		}
	};
	let intlLFCache = {};
	function getCachedLF(locString, opts = {}) {
		const key = JSON.stringify([locString, opts]);
		let dtf = intlLFCache[key];
		if (!dtf) {
			dtf = new Intl.ListFormat(locString, opts);
			intlLFCache[key] = dtf;
		}
		return dtf;
	}
	const intlDTCache = /* @__PURE__ */ new Map();
	function getCachedDTF(locString, opts = {}) {
		const key = JSON.stringify([locString, opts]);
		let dtf = intlDTCache.get(key);
		if (dtf === void 0) {
			dtf = new Intl.DateTimeFormat(locString, opts);
			intlDTCache.set(key, dtf);
		}
		return dtf;
	}
	const intlNumCache = /* @__PURE__ */ new Map();
	function getCachedINF(locString, opts = {}) {
		const key = JSON.stringify([locString, opts]);
		let inf = intlNumCache.get(key);
		if (inf === void 0) {
			inf = new Intl.NumberFormat(locString, opts);
			intlNumCache.set(key, inf);
		}
		return inf;
	}
	const intlRelCache = /* @__PURE__ */ new Map();
	function getCachedRTF(locString, opts = {}) {
		const { base, ...cacheKeyOpts } = opts;
		const key = JSON.stringify([locString, cacheKeyOpts]);
		let inf = intlRelCache.get(key);
		if (inf === void 0) {
			inf = new Intl.RelativeTimeFormat(locString, opts);
			intlRelCache.set(key, inf);
		}
		return inf;
	}
	let sysLocaleCache = null;
	function systemLocale() {
		if (sysLocaleCache) return sysLocaleCache;
		else {
			sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
			return sysLocaleCache;
		}
	}
	const intlResolvedOptionsCache = /* @__PURE__ */ new Map();
	function getCachedIntResolvedOptions(locString) {
		let opts = intlResolvedOptionsCache.get(locString);
		if (opts === void 0) {
			opts = new Intl.DateTimeFormat(locString).resolvedOptions();
			intlResolvedOptionsCache.set(locString, opts);
		}
		return opts;
	}
	const weekInfoCache = /* @__PURE__ */ new Map();
	function getCachedWeekInfo(locString) {
		let data = weekInfoCache.get(locString);
		if (!data) {
			const locale = new Intl.Locale(locString);
			data = "getWeekInfo" in locale ? locale.getWeekInfo() : locale.weekInfo;
			if (!("minimalDays" in data)) data = {
				...fallbackWeekSettings,
				...data
			};
			weekInfoCache.set(locString, data);
		}
		return data;
	}
	function parseLocaleString(localeStr) {
		const xIndex = localeStr.indexOf("-x-");
		if (xIndex !== -1) localeStr = localeStr.substring(0, xIndex);
		const uIndex = localeStr.indexOf("-u-");
		if (uIndex === -1) return [localeStr];
		else {
			let options;
			let selectedStr;
			try {
				options = getCachedDTF(localeStr).resolvedOptions();
				selectedStr = localeStr;
			} catch (e) {
				const smaller = localeStr.substring(0, uIndex);
				options = getCachedDTF(smaller).resolvedOptions();
				selectedStr = smaller;
			}
			const { numberingSystem, calendar } = options;
			return [
				selectedStr,
				numberingSystem,
				calendar
			];
		}
	}
	function intlConfigString(localeStr, numberingSystem, outputCalendar) {
		if (outputCalendar || numberingSystem) {
			if (!localeStr.includes("-u-")) localeStr += "-u";
			if (outputCalendar) localeStr += `-ca-${outputCalendar}`;
			if (numberingSystem) localeStr += `-nu-${numberingSystem}`;
			return localeStr;
		} else return localeStr;
	}
	function mapMonths(f) {
		const ms = [];
		for (let i = 1; i <= 12; i++) {
			const dt = DateTime.utc(2009, i, 1);
			ms.push(f(dt));
		}
		return ms;
	}
	function mapWeekdays(f) {
		const ms = [];
		for (let i = 1; i <= 7; i++) {
			const dt = DateTime.utc(2016, 11, 13 + i);
			ms.push(f(dt));
		}
		return ms;
	}
	function listStuff(loc, length, englishFn, intlFn) {
		const mode = loc.listingMode();
		if (mode === "error") return null;
		else if (mode === "en") return englishFn(length);
		else return intlFn(length);
	}
	function supportsFastNumbers(loc) {
		if (loc.numberingSystem && loc.numberingSystem !== "latn") return false;
		else return loc.numberingSystem === "latn" || !loc.locale || loc.locale.startsWith("en") || getCachedIntResolvedOptions(loc.locale).numberingSystem === "latn";
	}
	/**
	* @private
	*/
	var PolyNumberFormatter = class {
		constructor(intl, forceSimple, opts) {
			this.padTo = opts.padTo || 0;
			this.floor = opts.floor || false;
			const { padTo, floor, ...otherOpts } = opts;
			if (!forceSimple || Object.keys(otherOpts).length > 0) {
				const intlOpts = {
					useGrouping: false,
					...opts
				};
				if (opts.padTo > 0) intlOpts.minimumIntegerDigits = opts.padTo;
				this.inf = getCachedINF(intl, intlOpts);
			}
		}
		format(i) {
			if (this.inf) {
				const fixed = this.floor ? Math.floor(i) : i;
				return this.inf.format(fixed);
			} else return padStart(this.floor ? Math.floor(i) : roundTo(i, 3), this.padTo);
		}
	};
	/**
	* @private
	*/
	var PolyDateFormatter = class {
		constructor(dt, intl, opts) {
			this.opts = opts;
			this.originalZone = void 0;
			let z = void 0;
			if (this.opts.timeZone) this.dt = dt;
			else if (dt.zone.type === "fixed") {
				const gmtOffset = -1 * (dt.offset / 60);
				const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
				if (dt.offset !== 0 && IANAZone.create(offsetZ).valid) {
					z = offsetZ;
					this.dt = dt;
				} else {
					z = "UTC";
					this.dt = dt.offset === 0 ? dt : dt.setZone("UTC").plus({ minutes: dt.offset });
					this.originalZone = dt.zone;
				}
			} else if (dt.zone.type === "system") this.dt = dt;
			else if (dt.zone.type === "iana") {
				this.dt = dt;
				z = dt.zone.name;
			} else {
				z = "UTC";
				this.dt = dt.setZone("UTC").plus({ minutes: dt.offset });
				this.originalZone = dt.zone;
			}
			const intlOpts = { ...this.opts };
			intlOpts.timeZone = intlOpts.timeZone || z;
			this.dtf = getCachedDTF(intl, intlOpts);
		}
		format() {
			if (this.originalZone) return this.formatToParts().map(({ value }) => value).join("");
			return this.dtf.format(this.dt.toJSDate());
		}
		formatToParts() {
			const parts = this.dtf.formatToParts(this.dt.toJSDate());
			if (this.originalZone) return parts.map((part) => {
				if (part.type === "timeZoneName") {
					const offsetName = this.originalZone.offsetName(this.dt.ts, {
						locale: this.dt.locale,
						format: this.opts.timeZoneName
					});
					return {
						...part,
						value: offsetName
					};
				} else return part;
			});
			return parts;
		}
		resolvedOptions() {
			return this.dtf.resolvedOptions();
		}
	};
	/**
	* @private
	*/
	var PolyRelFormatter = class {
		constructor(intl, isEnglish, opts) {
			this.opts = {
				style: "long",
				...opts
			};
			if (!isEnglish && hasRelative()) this.rtf = getCachedRTF(intl, opts);
		}
		format(count, unit) {
			if (this.rtf) return this.rtf.format(count, unit);
			else return formatRelativeTime(unit, count, this.opts.numeric, this.opts.style !== "long");
		}
		formatToParts(count, unit) {
			if (this.rtf) return this.rtf.formatToParts(count, unit);
			else return [];
		}
	};
	const fallbackWeekSettings = {
		firstDay: 1,
		minimalDays: 4,
		weekend: [6, 7]
	};
	/**
	* @private
	*/
	var Locale = class Locale {
		static fromOpts(opts) {
			return Locale.create(opts.locale, opts.numberingSystem, opts.outputCalendar, opts.weekSettings, opts.defaultToEN);
		}
		static create(locale, numberingSystem, outputCalendar, weekSettings, defaultToEN = false) {
			const specifiedLocale = locale || Settings.defaultLocale;
			const localeR = specifiedLocale || (defaultToEN ? "en-US" : systemLocale());
			const numberingSystemR = numberingSystem || Settings.defaultNumberingSystem;
			const outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
			const weekSettingsR = validateWeekSettings(weekSettings) || Settings.defaultWeekSettings;
			return new Locale(localeR, numberingSystemR, outputCalendarR, weekSettingsR, specifiedLocale);
		}
		static resetCache() {
			sysLocaleCache = null;
			intlDTCache.clear();
			intlNumCache.clear();
			intlRelCache.clear();
			intlResolvedOptionsCache.clear();
			weekInfoCache.clear();
		}
		static fromObject({ locale, numberingSystem, outputCalendar, weekSettings } = {}) {
			return Locale.create(locale, numberingSystem, outputCalendar, weekSettings);
		}
		constructor(locale, numbering, outputCalendar, weekSettings, specifiedLocale) {
			const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);
			this.locale = parsedLocale;
			this.numberingSystem = numbering || parsedNumberingSystem || null;
			this.outputCalendar = outputCalendar || parsedOutputCalendar || null;
			this.weekSettings = weekSettings;
			this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);
			this.weekdaysCache = {
				format: {},
				standalone: {}
			};
			this.monthsCache = {
				format: {},
				standalone: {}
			};
			this.meridiemCache = null;
			this.eraCache = {};
			this.specifiedLocale = specifiedLocale;
			this.fastNumbersCached = null;
		}
		get fastNumbers() {
			if (this.fastNumbersCached == null) this.fastNumbersCached = supportsFastNumbers(this);
			return this.fastNumbersCached;
		}
		listingMode() {
			const isActuallyEn = this.isEnglish();
			const hasNoWeirdness = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
			return isActuallyEn && hasNoWeirdness ? "en" : "intl";
		}
		clone(alts) {
			if (!alts || Object.getOwnPropertyNames(alts).length === 0) return this;
			else return Locale.create(alts.locale || this.specifiedLocale, alts.numberingSystem || this.numberingSystem, alts.outputCalendar || this.outputCalendar, validateWeekSettings(alts.weekSettings) || this.weekSettings, alts.defaultToEN || false);
		}
		redefaultToEN(alts = {}) {
			return this.clone({
				...alts,
				defaultToEN: true
			});
		}
		redefaultToSystem(alts = {}) {
			return this.clone({
				...alts,
				defaultToEN: false
			});
		}
		months(length, format = false) {
			return listStuff(this, length, months, () => {
				const monthSpecialCase = this.intl === "ja" || this.intl.startsWith("ja-");
				format &= !monthSpecialCase;
				const intl = format ? {
					month: length,
					day: "numeric"
				} : { month: length }, formatStr = format ? "format" : "standalone";
				if (!this.monthsCache[formatStr][length]) {
					const mapper = !monthSpecialCase ? (dt) => this.extract(dt, intl, "month") : (dt) => this.dtFormatter(dt, intl).format();
					this.monthsCache[formatStr][length] = mapMonths(mapper);
				}
				return this.monthsCache[formatStr][length];
			});
		}
		weekdays(length, format = false) {
			return listStuff(this, length, weekdays, () => {
				const intl = format ? {
					weekday: length,
					year: "numeric",
					month: "long",
					day: "numeric"
				} : { weekday: length }, formatStr = format ? "format" : "standalone";
				if (!this.weekdaysCache[formatStr][length]) this.weekdaysCache[formatStr][length] = mapWeekdays((dt) => this.extract(dt, intl, "weekday"));
				return this.weekdaysCache[formatStr][length];
			});
		}
		meridiems() {
			return listStuff(this, void 0, () => meridiems, () => {
				if (!this.meridiemCache) {
					const intl = {
						hour: "numeric",
						hourCycle: "h12"
					};
					this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map((dt) => this.extract(dt, intl, "dayperiod"));
				}
				return this.meridiemCache;
			});
		}
		eras(length) {
			return listStuff(this, length, eras, () => {
				const intl = { era: length };
				if (!this.eraCache[length]) this.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map((dt) => this.extract(dt, intl, "era"));
				return this.eraCache[length];
			});
		}
		extract(dt, intlOpts, field) {
			const matching = this.dtFormatter(dt, intlOpts).formatToParts().find((m) => m.type.toLowerCase() === field);
			return matching ? matching.value : null;
		}
		numberFormatter(opts = {}) {
			return new PolyNumberFormatter(this.intl, opts.forceSimple || this.fastNumbers, opts);
		}
		dtFormatter(dt, intlOpts = {}) {
			return new PolyDateFormatter(dt, this.intl, intlOpts);
		}
		relFormatter(opts = {}) {
			return new PolyRelFormatter(this.intl, this.isEnglish(), opts);
		}
		listFormatter(opts = {}) {
			return getCachedLF(this.intl, opts);
		}
		isEnglish() {
			return this.locale === "en" || this.locale.toLowerCase() === "en-us" || getCachedIntResolvedOptions(this.intl).locale.startsWith("en-us");
		}
		getWeekSettings() {
			if (this.weekSettings) return this.weekSettings;
			else if (!hasLocaleWeekInfo()) return fallbackWeekSettings;
			else return getCachedWeekInfo(this.locale);
		}
		getStartOfWeek() {
			return this.getWeekSettings().firstDay;
		}
		getMinDaysInFirstWeek() {
			return this.getWeekSettings().minimalDays;
		}
		getWeekendDays() {
			return this.getWeekSettings().weekend;
		}
		equals(other) {
			return this.locale === other.locale && this.numberingSystem === other.numberingSystem && this.outputCalendar === other.outputCalendar;
		}
		toString() {
			return `Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;
		}
	};
	let singleton = null;
	/**
	* A zone with a fixed offset (meaning no DST)
	* @implements {Zone}
	*/
	var FixedOffsetZone = class FixedOffsetZone extends Zone {
		/**
		* Get a singleton instance of UTC
		* @return {FixedOffsetZone}
		*/
		static get utcInstance() {
			if (singleton === null) singleton = new FixedOffsetZone(0);
			return singleton;
		}
		/**
		* Get an instance with a specified offset
		* @param {number} offset - The offset in minutes
		* @return {FixedOffsetZone}
		*/
		static instance(offset) {
			return offset === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset);
		}
		/**
		* Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
		* @param {string} s - The offset string to parse
		* @example FixedOffsetZone.parseSpecifier("UTC+6")
		* @example FixedOffsetZone.parseSpecifier("UTC+06")
		* @example FixedOffsetZone.parseSpecifier("UTC-6:00")
		* @return {FixedOffsetZone}
		*/
		static parseSpecifier(s) {
			if (s) {
				const r = s.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
				if (r) return new FixedOffsetZone(signedOffset(r[1], r[2]));
			}
			return null;
		}
		constructor(offset) {
			super();
			/** @private **/
			this.fixed = offset;
		}
		/**
		* The type of zone. `fixed` for all instances of `FixedOffsetZone`.
		* @override
		* @type {string}
		*/
		get type() {
			return "fixed";
		}
		/**
		* The name of this zone.
		* All fixed zones' names always start with "UTC" (plus optional offset)
		* @override
		* @type {string}
		*/
		get name() {
			return this.fixed === 0 ? "UTC" : `UTC${formatOffset(this.fixed, "narrow")}`;
		}
		/**
		* The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
		*
		* @override
		* @type {string}
		*/
		get ianaName() {
			if (this.fixed === 0) return "Etc/UTC";
			else return `Etc/GMT${formatOffset(-this.fixed, "narrow")}`;
		}
		/**
		* Returns the offset's common name at the specified timestamp.
		*
		* For fixed offset zones this equals to the zone name.
		* @override
		*/
		offsetName() {
			return this.name;
		}
		/**
		* Returns the offset's value as a string
		* @override
		* @param {number} ts - Epoch milliseconds for which to get the offset
		* @param {string} format - What style of offset to return.
		*                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
		* @return {string}
		*/
		formatOffset(ts, format) {
			return formatOffset(this.fixed, format);
		}
		/**
		* Returns whether the offset is known to be fixed for the whole year:
		* Always returns true for all fixed offset zones.
		* @override
		* @type {boolean}
		*/
		get isUniversal() {
			return true;
		}
		/**
		* Return the offset in minutes for this zone at the specified timestamp.
		*
		* For fixed offset zones, this is constant and does not depend on a timestamp.
		* @override
		* @return {number}
		*/
		offset() {
			return this.fixed;
		}
		/**
		* Return whether this Zone is equal to another zone (i.e. also fixed and same offset)
		* @override
		* @param {Zone} otherZone - the zone to compare
		* @return {boolean}
		*/
		equals(otherZone) {
			return otherZone.type === "fixed" && otherZone.fixed === this.fixed;
		}
		/**
		* Return whether this Zone is valid:
		* All fixed offset zones are valid.
		* @override
		* @type {boolean}
		*/
		get isValid() {
			return true;
		}
	};
	/**
	* A zone that failed to parse. You should never need to instantiate this.
	* @implements {Zone}
	*/
	var InvalidZone = class extends Zone {
		constructor(zoneName) {
			super();
			/**  @private */
			this.zoneName = zoneName;
		}
		/** @override **/
		get type() {
			return "invalid";
		}
		/** @override **/
		get name() {
			return this.zoneName;
		}
		/** @override **/
		get isUniversal() {
			return false;
		}
		/** @override **/
		offsetName() {
			return null;
		}
		/** @override **/
		formatOffset() {
			return "";
		}
		/** @override **/
		offset() {
			return NaN;
		}
		/** @override **/
		equals() {
			return false;
		}
		/** @override **/
		get isValid() {
			return false;
		}
	};
	/**
	* @private
	*/
	function normalizeZone(input, defaultZone) {
		if (isUndefined(input) || input === null) return defaultZone;
		else if (input instanceof Zone) return input;
		else if (isString(input)) {
			const lowered = input.toLowerCase();
			if (lowered === "default") return defaultZone;
			else if (lowered === "local" || lowered === "system") return SystemZone.instance;
			else if (lowered === "utc" || lowered === "gmt") return FixedOffsetZone.utcInstance;
			else return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
		} else if (isNumber(input)) return FixedOffsetZone.instance(input);
		else if (typeof input === "object" && "offset" in input && typeof input.offset === "function") return input;
		else return new InvalidZone(input);
	}
	const numberingSystems = {
		arab: "[٠-٩]",
		arabext: "[۰-۹]",
		bali: "[᭐-᭙]",
		beng: "[০-৯]",
		deva: "[०-९]",
		fullwide: "[０-９]",
		gujr: "[૦-૯]",
		hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
		khmr: "[០-៩]",
		knda: "[೦-೯]",
		laoo: "[໐-໙]",
		limb: "[᥆-᥏]",
		mlym: "[൦-൯]",
		mong: "[᠐-᠙]",
		mymr: "[၀-၉]",
		orya: "[୦-୯]",
		tamldec: "[௦-௯]",
		telu: "[౦-౯]",
		thai: "[๐-๙]",
		tibt: "[༠-༩]",
		latn: "\\d"
	};
	const numberingSystemsUTF16 = {
		arab: [1632, 1641],
		arabext: [1776, 1785],
		bali: [6992, 7001],
		beng: [2534, 2543],
		deva: [2406, 2415],
		fullwide: [65296, 65303],
		gujr: [2790, 2799],
		khmr: [6112, 6121],
		knda: [3302, 3311],
		laoo: [3792, 3801],
		limb: [6470, 6479],
		mlym: [3430, 3439],
		mong: [6160, 6169],
		mymr: [4160, 4169],
		orya: [2918, 2927],
		tamldec: [3046, 3055],
		telu: [3174, 3183],
		thai: [3664, 3673],
		tibt: [3872, 3881]
	};
	const hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");
	function parseDigits(str) {
		let value = parseInt(str, 10);
		if (isNaN(value)) {
			value = "";
			for (let i = 0; i < str.length; i++) {
				const code = str.charCodeAt(i);
				if (str[i].search(numberingSystems.hanidec) !== -1) value += hanidecChars.indexOf(str[i]);
				else for (const key in numberingSystemsUTF16) {
					const [min, max] = numberingSystemsUTF16[key];
					if (code >= min && code <= max) value += code - min;
				}
			}
			return parseInt(value, 10);
		} else return value;
	}
	const digitRegexCache = /* @__PURE__ */ new Map();
	function resetDigitRegexCache() {
		digitRegexCache.clear();
	}
	function digitRegex({ numberingSystem }, append = "") {
		const ns = numberingSystem || "latn";
		let appendCache = digitRegexCache.get(ns);
		if (appendCache === void 0) {
			appendCache = /* @__PURE__ */ new Map();
			digitRegexCache.set(ns, appendCache);
		}
		let regex = appendCache.get(append);
		if (regex === void 0) {
			regex = new RegExp(`${numberingSystems[ns]}${append}`);
			appendCache.set(append, regex);
		}
		return regex;
	}
	let now = () => Date.now(), defaultZone = "system", defaultLocale = null, defaultNumberingSystem = null, defaultOutputCalendar = null, twoDigitCutoffYear = 60, throwOnInvalid, defaultWeekSettings = null;
	/**
	* Settings contains static getters and setters that control Luxon's overall behavior. Luxon is a simple library with few options, but the ones it does have live here.
	*/
	var Settings = class {
		/**
		* Get the callback for returning the current timestamp.
		* @type {function}
		*/
		static get now() {
			return now;
		}
		/**
		* Set the callback for returning the current timestamp.
		* The function should return a number, which will be interpreted as an Epoch millisecond count
		* @type {function}
		* @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
		* @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
		*/
		static set now(n) {
			now = n;
		}
		/**
		* Set the default time zone to create DateTimes in. Does not affect existing instances.
		* Use the value "system" to reset this value to the system's time zone.
		* @type {string}
		*/
		static set defaultZone(zone) {
			defaultZone = zone;
		}
		/**
		* Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
		* The default value is the system's time zone (the one set on the machine that runs this code).
		* @type {Zone}
		*/
		static get defaultZone() {
			return normalizeZone(defaultZone, SystemZone.instance);
		}
		/**
		* Get the default locale to create DateTimes with. Does not affect existing instances.
		* @type {string}
		*/
		static get defaultLocale() {
			return defaultLocale;
		}
		/**
		* Set the default locale to create DateTimes with. Does not affect existing instances.
		* @type {string}
		*/
		static set defaultLocale(locale) {
			defaultLocale = locale;
		}
		/**
		* Get the default numbering system to create DateTimes with. Does not affect existing instances.
		* @type {string}
		*/
		static get defaultNumberingSystem() {
			return defaultNumberingSystem;
		}
		/**
		* Set the default numbering system to create DateTimes with. Does not affect existing instances.
		* @type {string}
		*/
		static set defaultNumberingSystem(numberingSystem) {
			defaultNumberingSystem = numberingSystem;
		}
		/**
		* Get the default output calendar to create DateTimes with. Does not affect existing instances.
		* @type {string}
		*/
		static get defaultOutputCalendar() {
			return defaultOutputCalendar;
		}
		/**
		* Set the default output calendar to create DateTimes with. Does not affect existing instances.
		* @type {string}
		*/
		static set defaultOutputCalendar(outputCalendar) {
			defaultOutputCalendar = outputCalendar;
		}
		/**
		* @typedef {Object} WeekSettings
		* @property {number} firstDay
		* @property {number} minimalDays
		* @property {number[]} weekend
		*/
		/**
		* @return {WeekSettings|null}
		*/
		static get defaultWeekSettings() {
			return defaultWeekSettings;
		}
		/**
		* Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
		* how many days are required in the first week of a year.
		* Does not affect existing instances.
		*
		* @param {WeekSettings|null} weekSettings
		*/
		static set defaultWeekSettings(weekSettings) {
			defaultWeekSettings = validateWeekSettings(weekSettings);
		}
		/**
		* Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
		* @type {number}
		*/
		static get twoDigitCutoffYear() {
			return twoDigitCutoffYear;
		}
		/**
		* Set the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
		* @type {number}
		* @example Settings.twoDigitCutoffYear = 0 // all 'yy' are interpreted as 20th century
		* @example Settings.twoDigitCutoffYear = 99 // all 'yy' are interpreted as 21st century
		* @example Settings.twoDigitCutoffYear = 50 // '49' -> 2049; '50' -> 1950
		* @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
		* @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
		*/
		static set twoDigitCutoffYear(cutoffYear) {
			twoDigitCutoffYear = cutoffYear % 100;
		}
		/**
		* Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
		* @type {boolean}
		*/
		static get throwOnInvalid() {
			return throwOnInvalid;
		}
		/**
		* Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
		* @type {boolean}
		*/
		static set throwOnInvalid(t) {
			throwOnInvalid = t;
		}
		/**
		* Reset Luxon's global caches. Should only be necessary in testing scenarios.
		* @return {void}
		*/
		static resetCaches() {
			Locale.resetCache();
			IANAZone.resetCache();
			DateTime.resetCache();
			resetDigitRegexCache();
		}
	};
	var Invalid = class {
		constructor(reason, explanation) {
			this.reason = reason;
			this.explanation = explanation;
		}
		toMessage() {
			if (this.explanation) return `${this.reason}: ${this.explanation}`;
			else return this.reason;
		}
	};
	const nonLeapLadder = [
		0,
		31,
		59,
		90,
		120,
		151,
		181,
		212,
		243,
		273,
		304,
		334
	], leapLadder = [
		0,
		31,
		60,
		91,
		121,
		152,
		182,
		213,
		244,
		274,
		305,
		335
	];
	function unitOutOfRange(unit, value) {
		return new Invalid("unit out of range", `you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`);
	}
	function dayOfWeek(year, month, day) {
		const d = new Date(Date.UTC(year, month - 1, day));
		if (year < 100 && year >= 0) d.setUTCFullYear(d.getUTCFullYear() - 1900);
		const js = d.getUTCDay();
		return js === 0 ? 7 : js;
	}
	function computeOrdinal(year, month, day) {
		return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
	}
	function uncomputeOrdinal(year, ordinal) {
		const table = isLeapYear(year) ? leapLadder : nonLeapLadder, month0 = table.findIndex((i) => i < ordinal), day = ordinal - table[month0];
		return {
			month: month0 + 1,
			day
		};
	}
	function isoWeekdayToLocal(isoWeekday, startOfWeek) {
		return (isoWeekday - startOfWeek + 7) % 7 + 1;
	}
	/**
	* @private
	*/
	function gregorianToWeek(gregObj, minDaysInFirstWeek = 4, startOfWeek = 1) {
		const { year, month, day } = gregObj, ordinal = computeOrdinal(year, month, day), weekday = isoWeekdayToLocal(dayOfWeek(year, month, day), startOfWeek);
		let weekNumber = Math.floor((ordinal - weekday + 14 - minDaysInFirstWeek) / 7), weekYear;
		if (weekNumber < 1) {
			weekYear = year - 1;
			weekNumber = weeksInWeekYear(weekYear, minDaysInFirstWeek, startOfWeek);
		} else if (weekNumber > weeksInWeekYear(year, minDaysInFirstWeek, startOfWeek)) {
			weekYear = year + 1;
			weekNumber = 1;
		} else weekYear = year;
		return {
			weekYear,
			weekNumber,
			weekday,
			...timeObject(gregObj)
		};
	}
	function weekToGregorian(weekData, minDaysInFirstWeek = 4, startOfWeek = 1) {
		const { weekYear, weekNumber, weekday } = weekData, weekdayOfJan4 = isoWeekdayToLocal(dayOfWeek(weekYear, 1, minDaysInFirstWeek), startOfWeek), yearInDays = daysInYear(weekYear);
		let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 7 + minDaysInFirstWeek, year;
		if (ordinal < 1) {
			year = weekYear - 1;
			ordinal += daysInYear(year);
		} else if (ordinal > yearInDays) {
			year = weekYear + 1;
			ordinal -= daysInYear(weekYear);
		} else year = weekYear;
		const { month, day } = uncomputeOrdinal(year, ordinal);
		return {
			year,
			month,
			day,
			...timeObject(weekData)
		};
	}
	function gregorianToOrdinal(gregData) {
		const { year, month, day } = gregData;
		return {
			year,
			ordinal: computeOrdinal(year, month, day),
			...timeObject(gregData)
		};
	}
	function ordinalToGregorian(ordinalData) {
		const { year, ordinal } = ordinalData;
		const { month, day } = uncomputeOrdinal(year, ordinal);
		return {
			year,
			month,
			day,
			...timeObject(ordinalData)
		};
	}
	/**
	* Check if local week units like localWeekday are used in obj.
	* If so, validates that they are not mixed with ISO week units and then copies them to the normal week unit properties.
	* Modifies obj in-place!
	* @param obj the object values
	*/
	function usesLocalWeekValues(obj, loc) {
		if (!isUndefined(obj.localWeekday) || !isUndefined(obj.localWeekNumber) || !isUndefined(obj.localWeekYear)) {
			if (!isUndefined(obj.weekday) || !isUndefined(obj.weekNumber) || !isUndefined(obj.weekYear)) throw new ConflictingSpecificationError("Cannot mix locale-based week fields with ISO-based week fields");
			if (!isUndefined(obj.localWeekday)) obj.weekday = obj.localWeekday;
			if (!isUndefined(obj.localWeekNumber)) obj.weekNumber = obj.localWeekNumber;
			if (!isUndefined(obj.localWeekYear)) obj.weekYear = obj.localWeekYear;
			delete obj.localWeekday;
			delete obj.localWeekNumber;
			delete obj.localWeekYear;
			return {
				minDaysInFirstWeek: loc.getMinDaysInFirstWeek(),
				startOfWeek: loc.getStartOfWeek()
			};
		} else return {
			minDaysInFirstWeek: 4,
			startOfWeek: 1
		};
	}
	function hasInvalidWeekData(obj, minDaysInFirstWeek = 4, startOfWeek = 1) {
		const validYear = isInteger(obj.weekYear), validWeek = integerBetween(obj.weekNumber, 1, weeksInWeekYear(obj.weekYear, minDaysInFirstWeek, startOfWeek)), validWeekday = integerBetween(obj.weekday, 1, 7);
		if (!validYear) return unitOutOfRange("weekYear", obj.weekYear);
		else if (!validWeek) return unitOutOfRange("week", obj.weekNumber);
		else if (!validWeekday) return unitOutOfRange("weekday", obj.weekday);
		else return false;
	}
	function hasInvalidOrdinalData(obj) {
		const validYear = isInteger(obj.year), validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));
		if (!validYear) return unitOutOfRange("year", obj.year);
		else if (!validOrdinal) return unitOutOfRange("ordinal", obj.ordinal);
		else return false;
	}
	function hasInvalidGregorianData(obj) {
		const validYear = isInteger(obj.year), validMonth = integerBetween(obj.month, 1, 12), validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));
		if (!validYear) return unitOutOfRange("year", obj.year);
		else if (!validMonth) return unitOutOfRange("month", obj.month);
		else if (!validDay) return unitOutOfRange("day", obj.day);
		else return false;
	}
	function hasInvalidTimeData(obj) {
		const { hour, minute, second, millisecond } = obj;
		const validHour = integerBetween(hour, 0, 23) || hour === 24 && minute === 0 && second === 0 && millisecond === 0, validMinute = integerBetween(minute, 0, 59), validSecond = integerBetween(second, 0, 59), validMillisecond = integerBetween(millisecond, 0, 999);
		if (!validHour) return unitOutOfRange("hour", hour);
		else if (!validMinute) return unitOutOfRange("minute", minute);
		else if (!validSecond) return unitOutOfRange("second", second);
		else if (!validMillisecond) return unitOutOfRange("millisecond", millisecond);
		else return false;
	}
	/**
	* @private
	*/
	function isUndefined(o) {
		return typeof o === "undefined";
	}
	function isNumber(o) {
		return typeof o === "number";
	}
	function isInteger(o) {
		return typeof o === "number" && o % 1 === 0;
	}
	function isString(o) {
		return typeof o === "string";
	}
	function isDate(o) {
		return Object.prototype.toString.call(o) === "[object Date]";
	}
	function hasRelative() {
		try {
			return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
		} catch (e) {
			return false;
		}
	}
	function hasLocaleWeekInfo() {
		try {
			return typeof Intl !== "undefined" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
		} catch (e) {
			return false;
		}
	}
	function maybeArray(thing) {
		return Array.isArray(thing) ? thing : [thing];
	}
	function bestBy(arr, by, compare) {
		if (arr.length === 0) return;
		return arr.reduce((best, next) => {
			const pair = [by(next), next];
			if (!best) return pair;
			else if (compare(best[0], pair[0]) === best[0]) return best;
			else return pair;
		}, null)[1];
	}
	function pick(obj, keys) {
		return keys.reduce((a, k) => {
			a[k] = obj[k];
			return a;
		}, {});
	}
	function hasOwnProperty(obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	function validateWeekSettings(settings) {
		if (settings == null) return null;
		else if (typeof settings !== "object") throw new InvalidArgumentError("Week settings must be an object");
		else {
			if (!integerBetween(settings.firstDay, 1, 7) || !integerBetween(settings.minimalDays, 1, 7) || !Array.isArray(settings.weekend) || settings.weekend.some((v) => !integerBetween(v, 1, 7))) throw new InvalidArgumentError("Invalid week settings");
			return {
				firstDay: settings.firstDay,
				minimalDays: settings.minimalDays,
				weekend: Array.from(settings.weekend)
			};
		}
	}
	function integerBetween(thing, bottom, top) {
		return isInteger(thing) && thing >= bottom && thing <= top;
	}
	function floorMod(x, n) {
		return x - n * Math.floor(x / n);
	}
	function padStart(input, n = 2) {
		const isNeg = input < 0;
		let padded;
		if (isNeg) padded = "-" + ("" + -input).padStart(n, "0");
		else padded = ("" + input).padStart(n, "0");
		return padded;
	}
	function parseInteger(string) {
		if (isUndefined(string) || string === null || string === "") return;
		else return parseInt(string, 10);
	}
	function parseFloating(string) {
		if (isUndefined(string) || string === null || string === "") return;
		else return parseFloat(string);
	}
	function parseMillis(fraction) {
		if (isUndefined(fraction) || fraction === null || fraction === "") return;
		else {
			const f = parseFloat("0." + fraction) * 1e3;
			return Math.floor(f);
		}
	}
	function roundTo(number, digits, rounding = "round") {
		const factor = 10 ** digits;
		switch (rounding) {
			case "expand": return number > 0 ? Math.ceil(number * factor) / factor : Math.floor(number * factor) / factor;
			case "trunc": return Math.trunc(number * factor) / factor;
			case "round": return Math.round(number * factor) / factor;
			case "floor": return Math.floor(number * factor) / factor;
			case "ceil": return Math.ceil(number * factor) / factor;
			default: throw new RangeError(`Value rounding ${rounding} is out of range`);
		}
	}
	function isLeapYear(year) {
		return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	}
	function daysInYear(year) {
		return isLeapYear(year) ? 366 : 365;
	}
	function daysInMonth(year, month) {
		const modMonth = floorMod(month - 1, 12) + 1, modYear = year + (month - modMonth) / 12;
		if (modMonth === 2) return isLeapYear(modYear) ? 29 : 28;
		else return [
			31,
			null,
			31,
			30,
			31,
			30,
			31,
			31,
			30,
			31,
			30,
			31
		][modMonth - 1];
	}
	function objToLocalTS(obj) {
		let d = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond);
		if (obj.year < 100 && obj.year >= 0) {
			d = new Date(d);
			d.setUTCFullYear(obj.year, obj.month - 1, obj.day);
		}
		return +d;
	}
	function firstWeekOffset(year, minDaysInFirstWeek, startOfWeek) {
		return -isoWeekdayToLocal(dayOfWeek(year, 1, minDaysInFirstWeek), startOfWeek) + minDaysInFirstWeek - 1;
	}
	function weeksInWeekYear(weekYear, minDaysInFirstWeek = 4, startOfWeek = 1) {
		const weekOffset = firstWeekOffset(weekYear, minDaysInFirstWeek, startOfWeek);
		const weekOffsetNext = firstWeekOffset(weekYear + 1, minDaysInFirstWeek, startOfWeek);
		return (daysInYear(weekYear) - weekOffset + weekOffsetNext) / 7;
	}
	function untruncateYear(year) {
		if (year > 99) return year;
		else return year > Settings.twoDigitCutoffYear ? 1900 + year : 2e3 + year;
	}
	function parseZoneInfo(ts, offsetFormat, locale, timeZone = null) {
		const date = new Date(ts), intlOpts = {
			hourCycle: "h23",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		};
		if (timeZone) intlOpts.timeZone = timeZone;
		const modified = {
			timeZoneName: offsetFormat,
			...intlOpts
		};
		const parsed = new Intl.DateTimeFormat(locale, modified).formatToParts(date).find((m) => m.type.toLowerCase() === "timezonename");
		return parsed ? parsed.value : null;
	}
	function signedOffset(offHourStr, offMinuteStr) {
		let offHour = parseInt(offHourStr, 10);
		if (Number.isNaN(offHour)) offHour = 0;
		const offMin = parseInt(offMinuteStr, 10) || 0, offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
		return offHour * 60 + offMinSigned;
	}
	function asNumber(value) {
		const numericValue = Number(value);
		if (typeof value === "boolean" || value === "" || !Number.isFinite(numericValue)) throw new InvalidArgumentError(`Invalid unit value ${value}`);
		return numericValue;
	}
	function normalizeObject(obj, normalizer) {
		const normalized = {};
		for (const u in obj) if (hasOwnProperty(obj, u)) {
			const v = obj[u];
			if (v === void 0 || v === null) continue;
			normalized[normalizer(u)] = asNumber(v);
		}
		return normalized;
	}
	/**
	* Returns the offset's value as a string
	* @param {number} ts - Epoch milliseconds for which to get the offset
	* @param {string} format - What style of offset to return.
	*                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
	* @return {string}
	*/
	function formatOffset(offset, format) {
		const hours = Math.trunc(Math.abs(offset / 60)), minutes = Math.trunc(Math.abs(offset % 60)), sign = offset >= 0 ? "+" : "-";
		switch (format) {
			case "short": return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
			case "narrow": return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
			case "techie": return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
			default: throw new RangeError(`Value format ${format} is out of range for property format`);
		}
	}
	function timeObject(obj) {
		return pick(obj, [
			"hour",
			"minute",
			"second",
			"millisecond"
		]);
	}
	/**
	* @private
	*/
	const monthsLong = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];
	const monthsShort = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	];
	const monthsNarrow = [
		"J",
		"F",
		"M",
		"A",
		"M",
		"J",
		"J",
		"A",
		"S",
		"O",
		"N",
		"D"
	];
	function months(length) {
		switch (length) {
			case "narrow": return [...monthsNarrow];
			case "short": return [...monthsShort];
			case "long": return [...monthsLong];
			case "numeric": return [
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				"10",
				"11",
				"12"
			];
			case "2-digit": return [
				"01",
				"02",
				"03",
				"04",
				"05",
				"06",
				"07",
				"08",
				"09",
				"10",
				"11",
				"12"
			];
			default: return null;
		}
	}
	const weekdaysLong = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday"
	];
	const weekdaysShort = [
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat",
		"Sun"
	];
	const weekdaysNarrow = [
		"M",
		"T",
		"W",
		"T",
		"F",
		"S",
		"S"
	];
	function weekdays(length) {
		switch (length) {
			case "narrow": return [...weekdaysNarrow];
			case "short": return [...weekdaysShort];
			case "long": return [...weekdaysLong];
			case "numeric": return [
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7"
			];
			default: return null;
		}
	}
	const meridiems = ["AM", "PM"];
	const erasLong = ["Before Christ", "Anno Domini"];
	const erasShort = ["BC", "AD"];
	const erasNarrow = ["B", "A"];
	function eras(length) {
		switch (length) {
			case "narrow": return [...erasNarrow];
			case "short": return [...erasShort];
			case "long": return [...erasLong];
			default: return null;
		}
	}
	function meridiemForDateTime(dt) {
		return meridiems[dt.hour < 12 ? 0 : 1];
	}
	function weekdayForDateTime(dt, length) {
		return weekdays(length)[dt.weekday - 1];
	}
	function monthForDateTime(dt, length) {
		return months(length)[dt.month - 1];
	}
	function eraForDateTime(dt, length) {
		return eras(length)[dt.year < 0 ? 0 : 1];
	}
	function formatRelativeTime(unit, count, numeric = "always", narrow = false) {
		const units = {
			years: ["year", "yr."],
			quarters: ["quarter", "qtr."],
			months: ["month", "mo."],
			weeks: ["week", "wk."],
			days: [
				"day",
				"day",
				"days"
			],
			hours: ["hour", "hr."],
			minutes: ["minute", "min."],
			seconds: ["second", "sec."]
		};
		const lastable = [
			"hours",
			"minutes",
			"seconds"
		].indexOf(unit) === -1;
		if (numeric === "auto" && lastable) {
			const isDay = unit === "days";
			switch (count) {
				case 1: return isDay ? "tomorrow" : `next ${units[unit][0]}`;
				case -1: return isDay ? "yesterday" : `last ${units[unit][0]}`;
				case 0: return isDay ? "today" : `this ${units[unit][0]}`;
			}
		}
		const isInPast = Object.is(count, -0) || count < 0, fmtValue = Math.abs(count), singular = fmtValue === 1, lilUnits = units[unit], fmtUnit = narrow ? singular ? lilUnits[1] : lilUnits[2] || lilUnits[1] : singular ? units[unit][0] : unit;
		return isInPast ? `${fmtValue} ${fmtUnit} ago` : `in ${fmtValue} ${fmtUnit}`;
	}
	function stringifyTokens(splits, tokenToString) {
		let s = "";
		for (const token of splits) if (token.literal) s += token.val;
		else s += tokenToString(token.val);
		return s;
	}
	const macroTokenToFormatOpts = {
		D: DATE_SHORT,
		DD: DATE_MED,
		DDD: DATE_FULL,
		DDDD: DATE_HUGE,
		t: TIME_SIMPLE,
		tt: TIME_WITH_SECONDS,
		ttt: TIME_WITH_SHORT_OFFSET,
		tttt: TIME_WITH_LONG_OFFSET,
		T: TIME_24_SIMPLE,
		TT: TIME_24_WITH_SECONDS,
		TTT: TIME_24_WITH_SHORT_OFFSET,
		TTTT: TIME_24_WITH_LONG_OFFSET,
		f: DATETIME_SHORT,
		ff: DATETIME_MED,
		fff: DATETIME_FULL,
		ffff: DATETIME_HUGE,
		F: DATETIME_SHORT_WITH_SECONDS,
		FF: DATETIME_MED_WITH_SECONDS,
		FFF: DATETIME_FULL_WITH_SECONDS,
		FFFF: DATETIME_HUGE_WITH_SECONDS
	};
	/**
	* @private
	*/
	var Formatter = class Formatter {
		static create(locale, opts = {}) {
			return new Formatter(locale, opts);
		}
		static parseFormat(fmt) {
			let current = null, currentFull = "", bracketed = false;
			const splits = [];
			for (let i = 0; i < fmt.length; i++) {
				const c = fmt.charAt(i);
				if (c === "'") {
					if (currentFull.length > 0 || bracketed) splits.push({
						literal: bracketed || /^\s+$/.test(currentFull),
						val: currentFull === "" ? "'" : currentFull
					});
					current = null;
					currentFull = "";
					bracketed = !bracketed;
				} else if (bracketed) currentFull += c;
				else if (c === current) currentFull += c;
				else {
					if (currentFull.length > 0) splits.push({
						literal: /^\s+$/.test(currentFull),
						val: currentFull
					});
					currentFull = c;
					current = c;
				}
			}
			if (currentFull.length > 0) splits.push({
				literal: bracketed || /^\s+$/.test(currentFull),
				val: currentFull
			});
			return splits;
		}
		static macroTokenToFormatOpts(token) {
			return macroTokenToFormatOpts[token];
		}
		constructor(locale, formatOpts) {
			this.opts = formatOpts;
			this.loc = locale;
			this.systemLoc = null;
		}
		formatWithSystemDefault(dt, opts) {
			if (this.systemLoc === null) this.systemLoc = this.loc.redefaultToSystem();
			return this.systemLoc.dtFormatter(dt, {
				...this.opts,
				...opts
			}).format();
		}
		dtFormatter(dt, opts = {}) {
			return this.loc.dtFormatter(dt, {
				...this.opts,
				...opts
			});
		}
		formatDateTime(dt, opts) {
			return this.dtFormatter(dt, opts).format();
		}
		formatDateTimeParts(dt, opts) {
			return this.dtFormatter(dt, opts).formatToParts();
		}
		formatInterval(interval, opts) {
			return this.dtFormatter(interval.start, opts).dtf.formatRange(interval.start.toJSDate(), interval.end.toJSDate());
		}
		resolvedOptions(dt, opts) {
			return this.dtFormatter(dt, opts).resolvedOptions();
		}
		num(n, p = 0, signDisplay = void 0) {
			if (this.opts.forceSimple) return padStart(n, p);
			const opts = { ...this.opts };
			if (p > 0) opts.padTo = p;
			if (signDisplay) opts.signDisplay = signDisplay;
			return this.loc.numberFormatter(opts).format(n);
		}
		formatDateTimeFromString(dt, fmt) {
			const knownEnglish = this.loc.listingMode() === "en", useDateTimeFormatter = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", string = (opts, extract) => this.loc.extract(dt, opts, extract), formatOffset = (opts) => {
				if (dt.isOffsetFixed && dt.offset === 0 && opts.allowZ) return "Z";
				return dt.isValid ? dt.zone.formatOffset(dt.ts, opts.format) : "";
			}, meridiem = () => knownEnglish ? meridiemForDateTime(dt) : string({
				hour: "numeric",
				hourCycle: "h12"
			}, "dayperiod"), month = (length, standalone) => knownEnglish ? monthForDateTime(dt, length) : string(standalone ? { month: length } : {
				month: length,
				day: "numeric"
			}, "month"), weekday = (length, standalone) => knownEnglish ? weekdayForDateTime(dt, length) : string(standalone ? { weekday: length } : {
				weekday: length,
				month: "long",
				day: "numeric"
			}, "weekday"), maybeMacro = (token) => {
				const formatOpts = Formatter.macroTokenToFormatOpts(token);
				if (formatOpts) return this.formatWithSystemDefault(dt, formatOpts);
				else return token;
			}, era = (length) => knownEnglish ? eraForDateTime(dt, length) : string({ era: length }, "era"), tokenToString = (token) => {
				switch (token) {
					case "S": return this.num(dt.millisecond);
					case "u":
					case "SSS": return this.num(dt.millisecond, 3);
					case "s": return this.num(dt.second);
					case "ss": return this.num(dt.second, 2);
					case "uu": return this.num(Math.floor(dt.millisecond / 10), 2);
					case "uuu": return this.num(Math.floor(dt.millisecond / 100));
					case "m": return this.num(dt.minute);
					case "mm": return this.num(dt.minute, 2);
					case "h": return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
					case "hh": return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
					case "H": return this.num(dt.hour);
					case "HH": return this.num(dt.hour, 2);
					case "Z": return formatOffset({
						format: "narrow",
						allowZ: this.opts.allowZ
					});
					case "ZZ": return formatOffset({
						format: "short",
						allowZ: this.opts.allowZ
					});
					case "ZZZ": return formatOffset({
						format: "techie",
						allowZ: this.opts.allowZ
					});
					case "ZZZZ": return dt.zone.offsetName(dt.ts, {
						format: "short",
						locale: this.loc.locale
					});
					case "ZZZZZ": return dt.zone.offsetName(dt.ts, {
						format: "long",
						locale: this.loc.locale
					});
					case "z": return dt.zoneName;
					case "a": return meridiem();
					case "d": return useDateTimeFormatter ? string({ day: "numeric" }, "day") : this.num(dt.day);
					case "dd": return useDateTimeFormatter ? string({ day: "2-digit" }, "day") : this.num(dt.day, 2);
					case "c": return this.num(dt.weekday);
					case "ccc": return weekday("short", true);
					case "cccc": return weekday("long", true);
					case "ccccc": return weekday("narrow", true);
					case "E": return this.num(dt.weekday);
					case "EEE": return weekday("short", false);
					case "EEEE": return weekday("long", false);
					case "EEEEE": return weekday("narrow", false);
					case "L": return useDateTimeFormatter ? string({
						month: "numeric",
						day: "numeric"
					}, "month") : this.num(dt.month);
					case "LL": return useDateTimeFormatter ? string({
						month: "2-digit",
						day: "numeric"
					}, "month") : this.num(dt.month, 2);
					case "LLL": return month("short", true);
					case "LLLL": return month("long", true);
					case "LLLLL": return month("narrow", true);
					case "M": return useDateTimeFormatter ? string({ month: "numeric" }, "month") : this.num(dt.month);
					case "MM": return useDateTimeFormatter ? string({ month: "2-digit" }, "month") : this.num(dt.month, 2);
					case "MMM": return month("short", false);
					case "MMMM": return month("long", false);
					case "MMMMM": return month("narrow", false);
					case "y": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year);
					case "yy": return useDateTimeFormatter ? string({ year: "2-digit" }, "year") : this.num(dt.year.toString().slice(-2), 2);
					case "yyyy": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year, 4);
					case "yyyyyy": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year, 6);
					case "G": return era("short");
					case "GG": return era("long");
					case "GGGGG": return era("narrow");
					case "kk": return this.num(dt.weekYear.toString().slice(-2), 2);
					case "kkkk": return this.num(dt.weekYear, 4);
					case "W": return this.num(dt.weekNumber);
					case "WW": return this.num(dt.weekNumber, 2);
					case "n": return this.num(dt.localWeekNumber);
					case "nn": return this.num(dt.localWeekNumber, 2);
					case "ii": return this.num(dt.localWeekYear.toString().slice(-2), 2);
					case "iiii": return this.num(dt.localWeekYear, 4);
					case "o": return this.num(dt.ordinal);
					case "ooo": return this.num(dt.ordinal, 3);
					case "q": return this.num(dt.quarter);
					case "qq": return this.num(dt.quarter, 2);
					case "X": return this.num(Math.floor(dt.ts / 1e3));
					case "x": return this.num(dt.ts);
					default: return maybeMacro(token);
				}
			};
			return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
		}
		formatDurationFromString(dur, fmt) {
			const invertLargest = this.opts.signMode === "negativeLargestOnly" ? -1 : 1;
			const tokenToField = (token) => {
				switch (token[0]) {
					case "S": return "milliseconds";
					case "s": return "seconds";
					case "m": return "minutes";
					case "h": return "hours";
					case "d": return "days";
					case "w": return "weeks";
					case "M": return "months";
					case "y": return "years";
					default: return null;
				}
			}, tokenToString = (lildur, info) => (token) => {
				const mapped = tokenToField(token);
				if (mapped) {
					const inversionFactor = info.isNegativeDuration && mapped !== info.largestUnit ? invertLargest : 1;
					let signDisplay;
					if (this.opts.signMode === "negativeLargestOnly" && mapped !== info.largestUnit) signDisplay = "never";
					else if (this.opts.signMode === "all") signDisplay = "always";
					else signDisplay = "auto";
					return this.num(lildur.get(mapped) * inversionFactor, token.length, signDisplay);
				} else return token;
			}, tokens = Formatter.parseFormat(fmt), realTokens = tokens.reduce((found, { literal, val }) => literal ? found : found.concat(val), []), collapsed = dur.shiftTo(...realTokens.map(tokenToField).filter((t) => t));
			return stringifyTokens(tokens, tokenToString(collapsed, {
				isNegativeDuration: collapsed < 0,
				largestUnit: Object.keys(collapsed.values)[0]
			}));
		}
	};
	const ianaRegex = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
	function combineRegexes(...regexes) {
		const full = regexes.reduce((f, r) => f + r.source, "");
		return RegExp(`^${full}$`);
	}
	function combineExtractors(...extractors) {
		return (m) => extractors.reduce(([mergedVals, mergedZone, cursor], ex) => {
			const [val, zone, next] = ex(m, cursor);
			return [
				{
					...mergedVals,
					...val
				},
				zone || mergedZone,
				next
			];
		}, [
			{},
			null,
			1
		]).slice(0, 2);
	}
	function parse(s, ...patterns) {
		if (s == null) return [null, null];
		for (const [regex, extractor] of patterns) {
			const m = regex.exec(s);
			if (m) return extractor(m);
		}
		return [null, null];
	}
	function simpleParse(...keys) {
		return (match, cursor) => {
			const ret = {};
			let i;
			for (i = 0; i < keys.length; i++) ret[keys[i]] = parseInteger(match[cursor + i]);
			return [
				ret,
				null,
				cursor + i
			];
		};
	}
	const offsetRegex = /(?:([Zz])|([+-]\d\d)(?::?(\d\d))?)/;
	const isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;
	const isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
	const isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
	const isoTimeExtensionRegex = RegExp(`(?:[Tt]${isoTimeRegex.source})?`);
	const isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
	const isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
	const isoOrdinalRegex = /(\d{4})-?(\d{3})/;
	const extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekDay");
	const extractISOOrdinalData = simpleParse("year", "ordinal");
	const sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/;
	const sqlTimeRegex = RegExp(`${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`);
	const sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);
	function int(match, pos, fallback) {
		const m = match[pos];
		return isUndefined(m) ? fallback : parseInteger(m);
	}
	function extractISOYmd(match, cursor) {
		return [
			{
				year: int(match, cursor),
				month: int(match, cursor + 1, 1),
				day: int(match, cursor + 2, 1)
			},
			null,
			cursor + 3
		];
	}
	function extractISOTime(match, cursor) {
		return [
			{
				hours: int(match, cursor, 0),
				minutes: int(match, cursor + 1, 0),
				seconds: int(match, cursor + 2, 0),
				milliseconds: parseMillis(match[cursor + 3])
			},
			null,
			cursor + 4
		];
	}
	function extractISOOffset(match, cursor) {
		const local = !match[cursor] && !match[cursor + 1], fullOffset = signedOffset(match[cursor + 1], match[cursor + 2]);
		return [
			{},
			local ? null : FixedOffsetZone.instance(fullOffset),
			cursor + 3
		];
	}
	function extractIANAZone(match, cursor) {
		return [
			{},
			match[cursor] ? IANAZone.create(match[cursor]) : null,
			cursor + 1
		];
	}
	const isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);
	const isoDuration = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
	function extractISODuration(match) {
		const [s, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] = match;
		const hasNegativePrefix = s[0] === "-";
		const negativeSeconds = secondStr && secondStr[0] === "-";
		const maybeNegate = (num, force = false) => num !== void 0 && (force || num && hasNegativePrefix) ? -num : num;
		return [{
			years: maybeNegate(parseFloating(yearStr)),
			months: maybeNegate(parseFloating(monthStr)),
			weeks: maybeNegate(parseFloating(weekStr)),
			days: maybeNegate(parseFloating(dayStr)),
			hours: maybeNegate(parseFloating(hourStr)),
			minutes: maybeNegate(parseFloating(minuteStr)),
			seconds: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
			milliseconds: maybeNegate(parseMillis(millisecondsStr), negativeSeconds)
		}];
	}
	const obsOffsets = {
		GMT: 0,
		EDT: -240,
		EST: -300,
		CDT: -300,
		CST: -360,
		MDT: -360,
		MST: -420,
		PDT: -420,
		PST: -480
	};
	function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
		const result = {
			year: yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr),
			month: monthsShort.indexOf(monthStr) + 1,
			day: parseInteger(dayStr),
			hour: parseInteger(hourStr),
			minute: parseInteger(minuteStr)
		};
		if (secondStr) result.second = parseInteger(secondStr);
		if (weekdayStr) result.weekday = weekdayStr.length > 3 ? weekdaysLong.indexOf(weekdayStr) + 1 : weekdaysShort.indexOf(weekdayStr) + 1;
		return result;
	}
	const rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
	function extractRFC2822(match) {
		const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr, obsOffset, milOffset, offHourStr, offMinuteStr] = match, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
		let offset;
		if (obsOffset) offset = obsOffsets[obsOffset];
		else if (milOffset) offset = 0;
		else offset = signedOffset(offHourStr, offMinuteStr);
		return [result, new FixedOffsetZone(offset)];
	}
	function preprocessRFC2822(s) {
		return s.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
	}
	const rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, rfc850 = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
	function extractRFC1123Or850(match) {
		const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match;
		return [fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr), FixedOffsetZone.utcInstance];
	}
	function extractASCII(match) {
		const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match;
		return [fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr), FixedOffsetZone.utcInstance];
	}
	const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
	const isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
	const isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
	const isoTimeCombinedRegex = combineRegexes(isoTimeRegex);
	const extractISOYmdTimeAndOffset = combineExtractors(extractISOYmd, extractISOTime, extractISOOffset, extractIANAZone);
	const extractISOWeekTimeAndOffset = combineExtractors(extractISOWeekData, extractISOTime, extractISOOffset, extractIANAZone);
	const extractISOOrdinalDateAndTime = combineExtractors(extractISOOrdinalData, extractISOTime, extractISOOffset, extractIANAZone);
	const extractISOTimeAndOffset = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
	function parseISODate(s) {
		return parse(s, [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset], [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime], [isoTimeCombinedRegex, extractISOTimeAndOffset]);
	}
	function parseRFC2822Date(s) {
		return parse(preprocessRFC2822(s), [rfc2822, extractRFC2822]);
	}
	function parseHTTPDate(s) {
		return parse(s, [rfc1123, extractRFC1123Or850], [rfc850, extractRFC1123Or850], [ascii, extractASCII]);
	}
	function parseISODuration(s) {
		return parse(s, [isoDuration, extractISODuration]);
	}
	const extractISOTimeOnly = combineExtractors(extractISOTime);
	function parseISOTimeOnly(s) {
		return parse(s, [isoTimeOnly, extractISOTimeOnly]);
	}
	const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
	const sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);
	const extractISOTimeOffsetAndIANAZone = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
	function parseSQL(s) {
		return parse(s, [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]);
	}
	const INVALID$2 = "Invalid Duration";
	const lowOrderMatrix = {
		weeks: {
			days: 7,
			hours: 168,
			minutes: 10080,
			seconds: 10080 * 60,
			milliseconds: 10080 * 60 * 1e3
		},
		days: {
			hours: 24,
			minutes: 1440,
			seconds: 1440 * 60,
			milliseconds: 1440 * 60 * 1e3
		},
		hours: {
			minutes: 60,
			seconds: 3600,
			milliseconds: 3600 * 1e3
		},
		minutes: {
			seconds: 60,
			milliseconds: 60 * 1e3
		},
		seconds: { milliseconds: 1e3 }
	}, casualMatrix = {
		years: {
			quarters: 4,
			months: 12,
			weeks: 52,
			days: 365,
			hours: 365 * 24,
			minutes: 365 * 24 * 60,
			seconds: 365 * 24 * 60 * 60,
			milliseconds: 365 * 24 * 60 * 60 * 1e3
		},
		quarters: {
			months: 3,
			weeks: 13,
			days: 91,
			hours: 2184,
			minutes: 2184 * 60,
			seconds: 2184 * 60 * 60,
			milliseconds: 2184 * 60 * 60 * 1e3
		},
		months: {
			weeks: 4,
			days: 30,
			hours: 720,
			minutes: 720 * 60,
			seconds: 720 * 60 * 60,
			milliseconds: 720 * 60 * 60 * 1e3
		},
		...lowOrderMatrix
	}, daysInYearAccurate = 146097 / 400, daysInMonthAccurate = 146097 / 4800, accurateMatrix = {
		years: {
			quarters: 4,
			months: 12,
			weeks: daysInYearAccurate / 7,
			days: daysInYearAccurate,
			hours: daysInYearAccurate * 24,
			minutes: daysInYearAccurate * 24 * 60,
			seconds: daysInYearAccurate * 24 * 60 * 60,
			milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3
		},
		quarters: {
			months: 3,
			weeks: daysInYearAccurate / 28,
			days: daysInYearAccurate / 4,
			hours: daysInYearAccurate * 24 / 4,
			minutes: daysInYearAccurate * 24 * 60 / 4,
			seconds: daysInYearAccurate * 24 * 60 * 60 / 4,
			milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3 / 4
		},
		months: {
			weeks: daysInMonthAccurate / 7,
			days: daysInMonthAccurate,
			hours: daysInMonthAccurate * 24,
			minutes: daysInMonthAccurate * 24 * 60,
			seconds: daysInMonthAccurate * 24 * 60 * 60,
			milliseconds: daysInMonthAccurate * 24 * 60 * 60 * 1e3
		},
		...lowOrderMatrix
	};
	const orderedUnits$1 = [
		"years",
		"quarters",
		"months",
		"weeks",
		"days",
		"hours",
		"minutes",
		"seconds",
		"milliseconds"
	];
	const reverseUnits = orderedUnits$1.slice(0).reverse();
	function clone$1(dur, alts, clear = false) {
		return new Duration({
			values: clear ? alts.values : {
				...dur.values,
				...alts.values || {}
			},
			loc: dur.loc.clone(alts.loc),
			conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
			matrix: alts.matrix || dur.matrix
		});
	}
	function durationToMillis(matrix, vals) {
		var _vals$milliseconds;
		let sum = (_vals$milliseconds = vals.milliseconds) != null ? _vals$milliseconds : 0;
		for (const unit of reverseUnits.slice(1)) if (vals[unit]) sum += vals[unit] * matrix[unit]["milliseconds"];
		return sum;
	}
	function normalizeValues(matrix, vals) {
		const factor = durationToMillis(matrix, vals) < 0 ? -1 : 1;
		orderedUnits$1.reduceRight((previous, current) => {
			if (!isUndefined(vals[current])) {
				if (previous) {
					const previousVal = vals[previous] * factor;
					const conv = matrix[current][previous];
					const rollUp = Math.floor(previousVal / conv);
					vals[current] += rollUp * factor;
					vals[previous] -= rollUp * conv * factor;
				}
				return current;
			} else return previous;
		}, null);
		orderedUnits$1.reduce((previous, current) => {
			if (!isUndefined(vals[current])) {
				if (previous) {
					const fraction = vals[previous] % 1;
					vals[previous] -= fraction;
					vals[current] += fraction * matrix[previous][current];
				}
				return current;
			} else return previous;
		}, null);
	}
	function removeZeroes(vals) {
		const newVals = {};
		for (const [key, value] of Object.entries(vals)) if (value !== 0) newVals[key] = value;
		return newVals;
	}
	/**
	* A Duration object represents a period of time, like "2 months" or "1 day, 1 hour". Conceptually, it's just a map of units to their quantities, accompanied by some additional configuration and methods for creating, parsing, interrogating, transforming, and formatting them. They can be used on their own or in conjunction with other Luxon types; for example, you can use {@link DateTime#plus} to add a Duration object to a DateTime, producing another DateTime.
	*
	* Here is a brief overview of commonly used methods and getters in Duration:
	*
	* * **Creation** To create a Duration, use {@link Duration.fromMillis}, {@link Duration.fromObject}, or {@link Duration.fromISO}.
	* * **Unit values** See the {@link Duration#years}, {@link Duration#months}, {@link Duration#weeks}, {@link Duration#days}, {@link Duration#hours}, {@link Duration#minutes}, {@link Duration#seconds}, {@link Duration#milliseconds} accessors.
	* * **Configuration** See  {@link Duration#locale} and {@link Duration#numberingSystem} accessors.
	* * **Transformation** To create new Durations out of old ones use {@link Duration#plus}, {@link Duration#minus}, {@link Duration#normalize}, {@link Duration#set}, {@link Duration#reconfigure}, {@link Duration#shiftTo}, and {@link Duration#negate}.
	* * **Output** To convert the Duration into other representations, see {@link Duration#as}, {@link Duration#toISO}, {@link Duration#toFormat}, and {@link Duration#toJSON}
	*
	* There's are more methods documented below. In addition, for more information on subtler topics like internationalization and validity, see the external documentation.
	*/
	var Duration = class Duration {
		/**
		* @private
		*/
		constructor(config) {
			const accurate = config.conversionAccuracy === "longterm" || false;
			let matrix = accurate ? accurateMatrix : casualMatrix;
			if (config.matrix) matrix = config.matrix;
			/**
			* @access private
			*/
			this.values = config.values;
			/**
			* @access private
			*/
			this.loc = config.loc || Locale.create();
			/**
			* @access private
			*/
			this.conversionAccuracy = accurate ? "longterm" : "casual";
			/**
			* @access private
			*/
			this.invalid = config.invalid || null;
			/**
			* @access private
			*/
			this.matrix = matrix;
			/**
			* @access private
			*/
			this.isLuxonDuration = true;
		}
		/**
		* Create Duration from a number of milliseconds.
		* @param {number} count of milliseconds
		* @param {Object} opts - options for parsing
		* @param {string} [opts.locale='en-US'] - the locale to use
		* @param {string} opts.numberingSystem - the numbering system to use
		* @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
		* @return {Duration}
		*/
		static fromMillis(count, opts) {
			return Duration.fromObject({ milliseconds: count }, opts);
		}
		/**
		* Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
		* If this object is empty then a zero milliseconds duration is returned.
		* @param {Object} obj - the object to create the DateTime from
		* @param {number} obj.years
		* @param {number} obj.quarters
		* @param {number} obj.months
		* @param {number} obj.weeks
		* @param {number} obj.days
		* @param {number} obj.hours
		* @param {number} obj.minutes
		* @param {number} obj.seconds
		* @param {number} obj.milliseconds
		* @param {Object} [opts=[]] - options for creating this Duration
		* @param {string} [opts.locale='en-US'] - the locale to use
		* @param {string} opts.numberingSystem - the numbering system to use
		* @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
		* @param {string} [opts.matrix=Object] - the custom conversion system to use
		* @return {Duration}
		*/
		static fromObject(obj, opts = {}) {
			if (obj == null || typeof obj !== "object") throw new InvalidArgumentError(`Duration.fromObject: argument expected to be an object, got ${obj === null ? "null" : typeof obj}`);
			return new Duration({
				values: normalizeObject(obj, Duration.normalizeUnit),
				loc: Locale.fromObject(opts),
				conversionAccuracy: opts.conversionAccuracy,
				matrix: opts.matrix
			});
		}
		/**
		* Create a Duration from DurationLike.
		*
		* @param {Object | number | Duration} durationLike
		* One of:
		* - object with keys like 'years' and 'hours'.
		* - number representing milliseconds
		* - Duration instance
		* @return {Duration}
		*/
		static fromDurationLike(durationLike) {
			if (isNumber(durationLike)) return Duration.fromMillis(durationLike);
			else if (Duration.isDuration(durationLike)) return durationLike;
			else if (typeof durationLike === "object") return Duration.fromObject(durationLike);
			else throw new InvalidArgumentError(`Unknown duration argument ${durationLike} of type ${typeof durationLike}`);
		}
		/**
		* Create a Duration from an ISO 8601 duration string.
		* @param {string} text - text to parse
		* @param {Object} opts - options for parsing
		* @param {string} [opts.locale='en-US'] - the locale to use
		* @param {string} opts.numberingSystem - the numbering system to use
		* @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
		* @param {string} [opts.matrix=Object] - the preset conversion system to use
		* @see https://en.wikipedia.org/wiki/ISO_8601#Durations
		* @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
		* @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
		* @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
		* @return {Duration}
		*/
		static fromISO(text, opts) {
			const [parsed] = parseISODuration(text);
			if (parsed) return Duration.fromObject(parsed, opts);
			else return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
		}
		/**
		* Create a Duration from an ISO 8601 time string.
		* @param {string} text - text to parse
		* @param {Object} opts - options for parsing
		* @param {string} [opts.locale='en-US'] - the locale to use
		* @param {string} opts.numberingSystem - the numbering system to use
		* @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
		* @param {string} [opts.matrix=Object] - the conversion system to use
		* @see https://en.wikipedia.org/wiki/ISO_8601#Times
		* @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
		* @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
		* @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
		* @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
		* @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
		* @return {Duration}
		*/
		static fromISOTime(text, opts) {
			const [parsed] = parseISOTimeOnly(text);
			if (parsed) return Duration.fromObject(parsed, opts);
			else return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
		}
		/**
		* Create an invalid Duration.
		* @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
		* @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
		* @return {Duration}
		*/
		static invalid(reason, explanation = null) {
			if (!reason) throw new InvalidArgumentError("need to specify a reason the Duration is invalid");
			const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
			if (Settings.throwOnInvalid) throw new InvalidDurationError(invalid);
			else return new Duration({ invalid });
		}
		/**
		* @private
		*/
		static normalizeUnit(unit) {
			const normalized = {
				year: "years",
				years: "years",
				quarter: "quarters",
				quarters: "quarters",
				month: "months",
				months: "months",
				week: "weeks",
				weeks: "weeks",
				day: "days",
				days: "days",
				hour: "hours",
				hours: "hours",
				minute: "minutes",
				minutes: "minutes",
				second: "seconds",
				seconds: "seconds",
				millisecond: "milliseconds",
				milliseconds: "milliseconds"
			}[unit ? unit.toLowerCase() : unit];
			if (!normalized) throw new InvalidUnitError(unit);
			return normalized;
		}
		/**
		* Check if an object is a Duration. Works across context boundaries
		* @param {object} o
		* @return {boolean}
		*/
		static isDuration(o) {
			return o && o.isLuxonDuration || false;
		}
		/**
		* Get  the locale of a Duration, such 'en-GB'
		* @type {string}
		*/
		get locale() {
			return this.isValid ? this.loc.locale : null;
		}
		/**
		* Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
		*
		* @type {string}
		*/
		get numberingSystem() {
			return this.isValid ? this.loc.numberingSystem : null;
		}
		/**
		* Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
		* * `S` for milliseconds
		* * `s` for seconds
		* * `m` for minutes
		* * `h` for hours
		* * `d` for days
		* * `w` for weeks
		* * `M` for months
		* * `y` for years
		* Notes:
		* * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
		* * Tokens can be escaped by wrapping with single quotes.
		* * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations's conversion accuracy setting.
		* @param {string} fmt - the format string
		* @param {Object} opts - options
		* @param {boolean} [opts.floor=true] - floor numerical values
		* @param {'negative'|'all'|'negativeLargestOnly'} [opts.signMode=negative] - How to handle signs
		* @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
		* @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
		* @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
		* @example Duration.fromObject({ days: 6, seconds: 2 }).toFormat("d s", { signMode: "all" }) //=> "+6 +2"
		* @example Duration.fromObject({ days: -6, seconds: -2 }).toFormat("d s", { signMode: "all" }) //=> "-6 -2"
		* @example Duration.fromObject({ days: -6, seconds: -2 }).toFormat("d s", { signMode: "negativeLargestOnly" }) //=> "-6 2"
		* @return {string}
		*/
		toFormat(fmt, opts = {}) {
			const fmtOpts = {
				...opts,
				floor: opts.round !== false && opts.floor !== false
			};
			return this.isValid ? Formatter.create(this.loc, fmtOpts).formatDurationFromString(this, fmt) : INVALID$2;
		}
		/**
		* Returns a string representation of a Duration with all units included.
		* To modify its behavior, use `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
		* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
		* @param {Object} opts - Formatting options. Accepts the same keys as the options parameter of the native `Intl.NumberFormat` constructor, as well as `listStyle`.
		* @param {string} [opts.listStyle='narrow'] - How to format the merged list. Corresponds to the `style` property of the options parameter of the native `Intl.ListFormat` constructor.
		* @param {boolean} [opts.showZeros=true] - Show all units previously used by the duration even if they are zero
		* @example
		* ```js
		* var dur = Duration.fromObject({ months: 1, weeks: 0, hours: 5, minutes: 6 })
		* dur.toHuman() //=> '1 month, 0 weeks, 5 hours, 6 minutes'
		* dur.toHuman({ listStyle: "long" }) //=> '1 month, 0 weeks, 5 hours, and 6 minutes'
		* dur.toHuman({ unitDisplay: "short" }) //=> '1 mth, 0 wks, 5 hr, 6 min'
		* dur.toHuman({ showZeros: false }) //=> '1 month, 5 hours, 6 minutes'
		* ```
		*/
		toHuman(opts = {}) {
			if (!this.isValid) return INVALID$2;
			const showZeros = opts.showZeros !== false;
			const l = orderedUnits$1.map((unit) => {
				const val = this.values[unit];
				if (isUndefined(val) || val === 0 && !showZeros) return null;
				return this.loc.numberFormatter({
					style: "unit",
					unitDisplay: "long",
					...opts,
					unit: unit.slice(0, -1)
				}).format(val);
			}).filter((n) => n);
			return this.loc.listFormatter({
				type: "conjunction",
				style: opts.listStyle || "narrow",
				...opts
			}).format(l);
		}
		/**
		* Returns a JavaScript object with this Duration's values.
		* @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
		* @return {Object}
		*/
		toObject() {
			if (!this.isValid) return {};
			return { ...this.values };
		}
		/**
		* Returns an ISO 8601-compliant string representation of this Duration.
		* @see https://en.wikipedia.org/wiki/ISO_8601#Durations
		* @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
		* @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
		* @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
		* @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
		* @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
		* @return {string}
		*/
		toISO() {
			if (!this.isValid) return null;
			let s = "P";
			if (this.years !== 0) s += this.years + "Y";
			if (this.months !== 0 || this.quarters !== 0) s += this.months + this.quarters * 3 + "M";
			if (this.weeks !== 0) s += this.weeks + "W";
			if (this.days !== 0) s += this.days + "D";
			if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) s += "T";
			if (this.hours !== 0) s += this.hours + "H";
			if (this.minutes !== 0) s += this.minutes + "M";
			if (this.seconds !== 0 || this.milliseconds !== 0) s += roundTo(this.seconds + this.milliseconds / 1e3, 3) + "S";
			if (s === "P") s += "T0S";
			return s;
		}
		/**
		* Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
		* Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
		* @see https://en.wikipedia.org/wiki/ISO_8601#Times
		* @param {Object} opts - options
		* @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
		* @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
		* @param {boolean} [opts.includePrefix=false] - include the `T` prefix
		* @param {string} [opts.format='extended'] - choose between the basic and extended format
		* @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
		* @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
		* @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
		* @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
		* @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
		* @return {string}
		*/
		toISOTime(opts = {}) {
			if (!this.isValid) return null;
			const millis = this.toMillis();
			if (millis < 0 || millis >= 864e5) return null;
			opts = {
				suppressMilliseconds: false,
				suppressSeconds: false,
				includePrefix: false,
				format: "extended",
				...opts,
				includeOffset: false
			};
			return DateTime.fromMillis(millis, { zone: "UTC" }).toISOTime(opts);
		}
		/**
		* Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
		* @return {string}
		*/
		toJSON() {
			return this.toISO();
		}
		/**
		* Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
		* @return {string}
		*/
		toString() {
			return this.toISO();
		}
		/**
		* Returns a string representation of this Duration appropriate for the REPL.
		* @return {string}
		*/
		[Symbol.for("nodejs.util.inspect.custom")]() {
			if (this.isValid) return `Duration { values: ${JSON.stringify(this.values)} }`;
			else return `Duration { Invalid, reason: ${this.invalidReason} }`;
		}
		/**
		* Returns an milliseconds value of this Duration.
		* @return {number}
		*/
		toMillis() {
			if (!this.isValid) return NaN;
			return durationToMillis(this.matrix, this.values);
		}
		/**
		* Returns an milliseconds value of this Duration. Alias of {@link toMillis}
		* @return {number}
		*/
		valueOf() {
			return this.toMillis();
		}
		/**
		* Make this Duration longer by the specified amount. Return a newly-constructed Duration.
		* @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
		* @return {Duration}
		*/
		plus(duration) {
			if (!this.isValid) return this;
			const dur = Duration.fromDurationLike(duration), result = {};
			for (const k of orderedUnits$1) if (hasOwnProperty(dur.values, k) || hasOwnProperty(this.values, k)) result[k] = dur.get(k) + this.get(k);
			return clone$1(this, { values: result }, true);
		}
		/**
		* Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
		* @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
		* @return {Duration}
		*/
		minus(duration) {
			if (!this.isValid) return this;
			const dur = Duration.fromDurationLike(duration);
			return this.plus(dur.negate());
		}
		/**
		* Scale this Duration by the specified amount. Return a newly-constructed Duration.
		* @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
		* @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
		* @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
		* @return {Duration}
		*/
		mapUnits(fn) {
			if (!this.isValid) return this;
			const result = {};
			for (const k of Object.keys(this.values)) result[k] = asNumber(fn(this.values[k], k));
			return clone$1(this, { values: result }, true);
		}
		/**
		* Get the value of unit.
		* @param {string} unit - a unit such as 'minute' or 'day'
		* @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
		* @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
		* @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
		* @return {number}
		*/
		get(unit) {
			return this[Duration.normalizeUnit(unit)];
		}
		/**
		* "Set" the values of specified units. Return a newly-constructed Duration.
		* @param {Object} values - a mapping of units to numbers
		* @example dur.set({ years: 2017 })
		* @example dur.set({ hours: 8, minutes: 30 })
		* @return {Duration}
		*/
		set(values) {
			if (!this.isValid) return this;
			const mixed = {
				...this.values,
				...normalizeObject(values, Duration.normalizeUnit)
			};
			return clone$1(this, { values: mixed });
		}
		/**
		* "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
		* @example dur.reconfigure({ locale: 'en-GB' })
		* @return {Duration}
		*/
		reconfigure({ locale, numberingSystem, conversionAccuracy, matrix } = {}) {
			const opts = {
				loc: this.loc.clone({
					locale,
					numberingSystem
				}),
				matrix,
				conversionAccuracy
			};
			return clone$1(this, opts);
		}
		/**
		* Return the length of the duration in the specified unit.
		* @param {string} unit - a unit such as 'minutes' or 'days'
		* @example Duration.fromObject({years: 1}).as('days') //=> 365
		* @example Duration.fromObject({years: 1}).as('months') //=> 12
		* @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
		* @return {number}
		*/
		as(unit) {
			return this.isValid ? this.shiftTo(unit).get(unit) : NaN;
		}
		/**
		* Reduce this Duration to its canonical representation in its current units.
		* Assuming the overall value of the Duration is positive, this means:
		* - excessive values for lower-order units are converted to higher-order units (if possible, see first and second example)
		* - negative lower-order units are converted to higher order units (there must be such a higher order unit, otherwise
		*   the overall value would be negative, see third example)
		* - fractional values for higher-order units are converted to lower-order units (if possible, see fourth example)
		*
		* If the overall value is negative, the result of this method is equivalent to `this.negate().normalize().negate()`.
		* @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
		* @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
		* @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
		* @example Duration.fromObject({ years: 2.5, days: 0, hours: 0 }).normalize().toObject() //=> { years: 2, days: 182, hours: 12 }
		* @return {Duration}
		*/
		normalize() {
			if (!this.isValid) return this;
			const vals = this.toObject();
			normalizeValues(this.matrix, vals);
			return clone$1(this, { values: vals }, true);
		}
		/**
		* Rescale units to its largest representation
		* @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
		* @return {Duration}
		*/
		rescale() {
			if (!this.isValid) return this;
			const vals = removeZeroes(this.normalize().shiftToAll().toObject());
			return clone$1(this, { values: vals }, true);
		}
		/**
		* Convert this Duration into its representation in a different set of units.
		* @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
		* @return {Duration}
		*/
		shiftTo(...units) {
			if (!this.isValid) return this;
			if (units.length === 0) return this;
			units = units.map((u) => Duration.normalizeUnit(u));
			const built = {}, accumulated = {}, vals = this.toObject();
			let lastUnit;
			for (const k of orderedUnits$1) if (units.indexOf(k) >= 0) {
				lastUnit = k;
				let own = 0;
				for (const ak in accumulated) {
					own += this.matrix[ak][k] * accumulated[ak];
					accumulated[ak] = 0;
				}
				if (isNumber(vals[k])) own += vals[k];
				const i = Math.trunc(own);
				built[k] = i;
				accumulated[k] = (own * 1e3 - i * 1e3) / 1e3;
			} else if (isNumber(vals[k])) accumulated[k] = vals[k];
			for (const key in accumulated) if (accumulated[key] !== 0) built[lastUnit] += key === lastUnit ? accumulated[key] : accumulated[key] / this.matrix[lastUnit][key];
			normalizeValues(this.matrix, built);
			return clone$1(this, { values: built }, true);
		}
		/**
		* Shift this Duration to all available units.
		* Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
		* @return {Duration}
		*/
		shiftToAll() {
			if (!this.isValid) return this;
			return this.shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds");
		}
		/**
		* Return the negative of this Duration.
		* @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
		* @return {Duration}
		*/
		negate() {
			if (!this.isValid) return this;
			const negated = {};
			for (const k of Object.keys(this.values)) negated[k] = this.values[k] === 0 ? 0 : -this.values[k];
			return clone$1(this, { values: negated }, true);
		}
		/**
		* Removes all units with values equal to 0 from this Duration.
		* @example Duration.fromObject({ years: 2, days: 0, hours: 0, minutes: 0 }).removeZeros().toObject() //=> { years: 2 }
		* @return {Duration}
		*/
		removeZeros() {
			if (!this.isValid) return this;
			const vals = removeZeroes(this.values);
			return clone$1(this, { values: vals }, true);
		}
		/**
		* Get the years.
		* @type {number}
		*/
		get years() {
			return this.isValid ? this.values.years || 0 : NaN;
		}
		/**
		* Get the quarters.
		* @type {number}
		*/
		get quarters() {
			return this.isValid ? this.values.quarters || 0 : NaN;
		}
		/**
		* Get the months.
		* @type {number}
		*/
		get months() {
			return this.isValid ? this.values.months || 0 : NaN;
		}
		/**
		* Get the weeks
		* @type {number}
		*/
		get weeks() {
			return this.isValid ? this.values.weeks || 0 : NaN;
		}
		/**
		* Get the days.
		* @type {number}
		*/
		get days() {
			return this.isValid ? this.values.days || 0 : NaN;
		}
		/**
		* Get the hours.
		* @type {number}
		*/
		get hours() {
			return this.isValid ? this.values.hours || 0 : NaN;
		}
		/**
		* Get the minutes.
		* @type {number}
		*/
		get minutes() {
			return this.isValid ? this.values.minutes || 0 : NaN;
		}
		/**
		* Get the seconds.
		* @return {number}
		*/
		get seconds() {
			return this.isValid ? this.values.seconds || 0 : NaN;
		}
		/**
		* Get the milliseconds.
		* @return {number}
		*/
		get milliseconds() {
			return this.isValid ? this.values.milliseconds || 0 : NaN;
		}
		/**
		* Returns whether the Duration is invalid. Invalid durations are returned by diff operations
		* on invalid DateTimes or Intervals.
		* @return {boolean}
		*/
		get isValid() {
			return this.invalid === null;
		}
		/**
		* Returns an error code if this Duration became invalid, or null if the Duration is valid
		* @return {string}
		*/
		get invalidReason() {
			return this.invalid ? this.invalid.reason : null;
		}
		/**
		* Returns an explanation of why this Duration became invalid, or null if the Duration is valid
		* @type {string}
		*/
		get invalidExplanation() {
			return this.invalid ? this.invalid.explanation : null;
		}
		/**
		* Equality check
		* Two Durations are equal iff they have the same units and the same values for each unit.
		* @param {Duration} other
		* @return {boolean}
		*/
		equals(other) {
			if (!this.isValid || !other.isValid) return false;
			if (!this.loc.equals(other.loc)) return false;
			function eq(v1, v2) {
				if (v1 === void 0 || v1 === 0) return v2 === void 0 || v2 === 0;
				return v1 === v2;
			}
			for (const u of orderedUnits$1) if (!eq(this.values[u], other.values[u])) return false;
			return true;
		}
	};
	const INVALID$1 = "Invalid Interval";
	function validateStartEnd(start, end) {
		if (!start || !start.isValid) return Interval.invalid("missing or invalid start");
		else if (!end || !end.isValid) return Interval.invalid("missing or invalid end");
		else if (end < start) return Interval.invalid("end before start", `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`);
		else return null;
	}
	/**
	* An Interval object represents a half-open interval of time, where each endpoint is a {@link DateTime}. Conceptually, it's a container for those two endpoints, accompanied by methods for creating, parsing, interrogating, comparing, transforming, and formatting them.
	*
	* Here is a brief overview of the most commonly used methods and getters in Interval:
	*
	* * **Creation** To create an Interval, use {@link Interval.fromDateTimes}, {@link Interval.after}, {@link Interval.before}, or {@link Interval.fromISO}.
	* * **Accessors** Use {@link Interval#start} and {@link Interval#end} to get the start and end.
	* * **Interrogation** To analyze the Interval, use {@link Interval#count}, {@link Interval#length}, {@link Interval#hasSame}, {@link Interval#contains}, {@link Interval#isAfter}, or {@link Interval#isBefore}.
	* * **Transformation** To create other Intervals out of this one, use {@link Interval#set}, {@link Interval#splitAt}, {@link Interval#splitBy}, {@link Interval#divideEqually}, {@link Interval.merge}, {@link Interval.xor}, {@link Interval#union}, {@link Interval#intersection}, or {@link Interval#difference}.
	* * **Comparison** To compare this Interval to another one, use {@link Interval#equals}, {@link Interval#overlaps}, {@link Interval#abutsStart}, {@link Interval#abutsEnd}, {@link Interval#engulfs}
	* * **Output** To convert the Interval into other representations, see {@link Interval#toString}, {@link Interval#toLocaleString}, {@link Interval#toISO}, {@link Interval#toISODate}, {@link Interval#toISOTime}, {@link Interval#toFormat}, and {@link Interval#toDuration}.
	*/
	var Interval = class Interval {
		/**
		* @private
		*/
		constructor(config) {
			/**
			* @access private
			*/
			this.s = config.start;
			/**
			* @access private
			*/
			this.e = config.end;
			/**
			* @access private
			*/
			this.invalid = config.invalid || null;
			/**
			* @access private
			*/
			this.isLuxonInterval = true;
		}
		/**
		* Create an invalid Interval.
		* @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
		* @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
		* @return {Interval}
		*/
		static invalid(reason, explanation = null) {
			if (!reason) throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
			const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
			if (Settings.throwOnInvalid) throw new InvalidIntervalError(invalid);
			else return new Interval({ invalid });
		}
		/**
		* Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
		* @param {DateTime|Date|Object} start
		* @param {DateTime|Date|Object} end
		* @return {Interval}
		*/
		static fromDateTimes(start, end) {
			const builtStart = friendlyDateTime(start), builtEnd = friendlyDateTime(end);
			const validateError = validateStartEnd(builtStart, builtEnd);
			if (validateError == null) return new Interval({
				start: builtStart,
				end: builtEnd
			});
			else return validateError;
		}
		/**
		* Create an Interval from a start DateTime and a Duration to extend to.
		* @param {DateTime|Date|Object} start
		* @param {Duration|Object|number} duration - the length of the Interval.
		* @return {Interval}
		*/
		static after(start, duration) {
			const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(start);
			return Interval.fromDateTimes(dt, dt.plus(dur));
		}
		/**
		* Create an Interval from an end DateTime and a Duration to extend backwards to.
		* @param {DateTime|Date|Object} end
		* @param {Duration|Object|number} duration - the length of the Interval.
		* @return {Interval}
		*/
		static before(end, duration) {
			const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(end);
			return Interval.fromDateTimes(dt.minus(dur), dt);
		}
		/**
		* Create an Interval from an ISO 8601 string.
		* Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
		* @param {string} text - the ISO string to parse
		* @param {Object} [opts] - options to pass {@link DateTime#fromISO} and optionally {@link Duration#fromISO}
		* @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
		* @return {Interval}
		*/
		static fromISO(text, opts) {
			const [s, e] = (text || "").split("/", 2);
			if (s && e) {
				let start, startIsValid;
				try {
					start = DateTime.fromISO(s, opts);
					startIsValid = start.isValid;
				} catch (e) {
					startIsValid = false;
				}
				let end, endIsValid;
				try {
					end = DateTime.fromISO(e, opts);
					endIsValid = end.isValid;
				} catch (e) {
					endIsValid = false;
				}
				if (startIsValid && endIsValid) return Interval.fromDateTimes(start, end);
				if (startIsValid) {
					const dur = Duration.fromISO(e, opts);
					if (dur.isValid) return Interval.after(start, dur);
				} else if (endIsValid) {
					const dur = Duration.fromISO(s, opts);
					if (dur.isValid) return Interval.before(end, dur);
				}
			}
			return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
		}
		/**
		* Check if an object is an Interval. Works across context boundaries
		* @param {object} o
		* @return {boolean}
		*/
		static isInterval(o) {
			return o && o.isLuxonInterval || false;
		}
		/**
		* Returns the start of the Interval
		* @type {DateTime}
		*/
		get start() {
			return this.isValid ? this.s : null;
		}
		/**
		* Returns the end of the Interval. This is the first instant which is not part of the interval
		* (Interval is half-open).
		* @type {DateTime}
		*/
		get end() {
			return this.isValid ? this.e : null;
		}
		/**
		* Returns the last DateTime included in the interval (since end is not part of the interval)
		* @type {DateTime}
		*/
		get lastDateTime() {
			return this.isValid ? this.e ? this.e.minus(1) : null : null;
		}
		/**
		* Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
		* @type {boolean}
		*/
		get isValid() {
			return this.invalidReason === null;
		}
		/**
		* Returns an error code if this Interval is invalid, or null if the Interval is valid
		* @type {string}
		*/
		get invalidReason() {
			return this.invalid ? this.invalid.reason : null;
		}
		/**
		* Returns an explanation of why this Interval became invalid, or null if the Interval is valid
		* @type {string}
		*/
		get invalidExplanation() {
			return this.invalid ? this.invalid.explanation : null;
		}
		/**
		* Returns the length of the Interval in the specified unit.
		* @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
		* @return {number}
		*/
		length(unit = "milliseconds") {
			return this.isValid ? this.toDuration(...[unit]).get(unit) : NaN;
		}
		/**
		* Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
		* Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
		* asks 'what dates are included in this interval?', not 'how many days long is this interval?'
		* @param {string} [unit='milliseconds'] - the unit of time to count.
		* @param {Object} opts - options
		* @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; this operation will always use the locale of the start DateTime
		* @return {number}
		*/
		count(unit = "milliseconds", opts) {
			if (!this.isValid) return NaN;
			const start = this.start.startOf(unit, opts);
			let end;
			if (opts != null && opts.useLocaleWeeks) end = this.end.reconfigure({ locale: start.locale });
			else end = this.end;
			end = end.startOf(unit, opts);
			return Math.floor(end.diff(start, unit).get(unit)) + (end.valueOf() !== this.end.valueOf());
		}
		/**
		* Returns whether this Interval's start and end are both in the same unit of time
		* @param {string} unit - the unit of time to check sameness on
		* @return {boolean}
		*/
		hasSame(unit) {
			return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, unit) : false;
		}
		/**
		* Return whether this Interval has the same start and end DateTimes.
		* @return {boolean}
		*/
		isEmpty() {
			return this.s.valueOf() === this.e.valueOf();
		}
		/**
		* Return whether this Interval's start is after the specified DateTime.
		* @param {DateTime} dateTime
		* @return {boolean}
		*/
		isAfter(dateTime) {
			if (!this.isValid) return false;
			return this.s > dateTime;
		}
		/**
		* Return whether this Interval's end is before the specified DateTime.
		* @param {DateTime} dateTime
		* @return {boolean}
		*/
		isBefore(dateTime) {
			if (!this.isValid) return false;
			return this.e <= dateTime;
		}
		/**
		* Return whether this Interval contains the specified DateTime.
		* @param {DateTime} dateTime
		* @return {boolean}
		*/
		contains(dateTime) {
			if (!this.isValid) return false;
			return this.s <= dateTime && this.e > dateTime;
		}
		/**
		* "Sets" the start and/or end dates. Returns a newly-constructed Interval.
		* @param {Object} values - the values to set
		* @param {DateTime} values.start - the starting DateTime
		* @param {DateTime} values.end - the ending DateTime
		* @return {Interval}
		*/
		set({ start, end } = {}) {
			if (!this.isValid) return this;
			return Interval.fromDateTimes(start || this.s, end || this.e);
		}
		/**
		* Split this Interval at each of the specified DateTimes
		* @param {...DateTime} dateTimes - the unit of time to count.
		* @return {Array}
		*/
		splitAt(...dateTimes) {
			if (!this.isValid) return [];
			const sorted = dateTimes.map(friendlyDateTime).filter((d) => this.contains(d)).sort((a, b) => a.toMillis() - b.toMillis()), results = [];
			let { s } = this, i = 0;
			while (s < this.e) {
				const added = sorted[i] || this.e, next = +added > +this.e ? this.e : added;
				results.push(Interval.fromDateTimes(s, next));
				s = next;
				i += 1;
			}
			return results;
		}
		/**
		* Split this Interval into smaller Intervals, each of the specified length.
		* Left over time is grouped into a smaller interval
		* @param {Duration|Object|number} duration - The length of each resulting interval.
		* @return {Array}
		*/
		splitBy(duration) {
			const dur = Duration.fromDurationLike(duration);
			if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) return [];
			let { s } = this, idx = 1, next;
			const results = [];
			while (s < this.e) {
				const added = this.start.plus(dur.mapUnits((x) => x * idx));
				next = +added > +this.e ? this.e : added;
				results.push(Interval.fromDateTimes(s, next));
				s = next;
				idx += 1;
			}
			return results;
		}
		/**
		* Split this Interval into the specified number of smaller intervals.
		* @param {number} numberOfParts - The number of Intervals to divide the Interval into.
		* @return {Array}
		*/
		divideEqually(numberOfParts) {
			if (!this.isValid) return [];
			return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
		}
		/**
		* Return whether this Interval overlaps with the specified Interval
		* @param {Interval} other
		* @return {boolean}
		*/
		overlaps(other) {
			return this.e > other.s && this.s < other.e;
		}
		/**
		* Return whether this Interval's end is adjacent to the specified Interval's start.
		* @param {Interval} other
		* @return {boolean}
		*/
		abutsStart(other) {
			if (!this.isValid) return false;
			return +this.e === +other.s;
		}
		/**
		* Return whether this Interval's start is adjacent to the specified Interval's end.
		* @param {Interval} other
		* @return {boolean}
		*/
		abutsEnd(other) {
			if (!this.isValid) return false;
			return +other.e === +this.s;
		}
		/**
		* Returns true if this Interval fully contains the specified Interval, specifically if the intersect (of this Interval and the other Interval) is equal to the other Interval; false otherwise.
		* @param {Interval} other
		* @return {boolean}
		*/
		engulfs(other) {
			if (!this.isValid) return false;
			return this.s <= other.s && this.e >= other.e;
		}
		/**
		* Return whether this Interval has the same start and end as the specified Interval.
		* @param {Interval} other
		* @return {boolean}
		*/
		equals(other) {
			if (!this.isValid || !other.isValid) return false;
			return this.s.equals(other.s) && this.e.equals(other.e);
		}
		/**
		* Return an Interval representing the intersection of this Interval and the specified Interval.
		* Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
		* Returns null if the intersection is empty, meaning, the intervals don't intersect.
		* @param {Interval} other
		* @return {Interval}
		*/
		intersection(other) {
			if (!this.isValid) return this;
			const s = this.s > other.s ? this.s : other.s, e = this.e < other.e ? this.e : other.e;
			if (s >= e) return null;
			else return Interval.fromDateTimes(s, e);
		}
		/**
		* Return an Interval representing the union of this Interval and the specified Interval.
		* Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
		* @param {Interval} other
		* @return {Interval}
		*/
		union(other) {
			if (!this.isValid) return this;
			const s = this.s < other.s ? this.s : other.s, e = this.e > other.e ? this.e : other.e;
			return Interval.fromDateTimes(s, e);
		}
		/**
		* Merge an array of Intervals into an equivalent minimal set of Intervals.
		* Combines overlapping and adjacent Intervals.
		* The resulting array will contain the Intervals in ascending order, that is, starting with the earliest Interval
		* and ending with the latest.
		*
		* @param {Array} intervals
		* @return {Array}
		*/
		static merge(intervals) {
			const [found, final] = intervals.sort((a, b) => a.s - b.s).reduce(([sofar, current], item) => {
				if (!current) return [sofar, item];
				else if (current.overlaps(item) || current.abutsStart(item)) return [sofar, current.union(item)];
				else return [sofar.concat([current]), item];
			}, [[], null]);
			if (final) found.push(final);
			return found;
		}
		/**
		* Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
		* @param {Array} intervals
		* @return {Array}
		*/
		static xor(intervals) {
			let start = null, currentCount = 0;
			const results = [], ends = intervals.map((i) => [{
				time: i.s,
				type: "s"
			}, {
				time: i.e,
				type: "e"
			}]), arr = Array.prototype.concat(...ends).sort((a, b) => a.time - b.time);
			for (const i of arr) {
				currentCount += i.type === "s" ? 1 : -1;
				if (currentCount === 1) start = i.time;
				else {
					if (start && +start !== +i.time) results.push(Interval.fromDateTimes(start, i.time));
					start = null;
				}
			}
			return Interval.merge(results);
		}
		/**
		* Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
		* @param {...Interval} intervals
		* @return {Array}
		*/
		difference(...intervals) {
			return Interval.xor([this].concat(intervals)).map((i) => this.intersection(i)).filter((i) => i && !i.isEmpty());
		}
		/**
		* Returns a string representation of this Interval appropriate for debugging.
		* @return {string}
		*/
		toString() {
			if (!this.isValid) return INVALID$1;
			return `[${this.s.toISO()} – ${this.e.toISO()})`;
		}
		/**
		* Returns a string representation of this Interval appropriate for the REPL.
		* @return {string}
		*/
		[Symbol.for("nodejs.util.inspect.custom")]() {
			if (this.isValid) return `Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`;
			else return `Interval { Invalid, reason: ${this.invalidReason} }`;
		}
		/**
		* Returns a localized string representing this Interval. Accepts the same options as the
		* Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
		* {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
		* is browser-specific, but in general it will return an appropriate representation of the
		* Interval in the assigned locale. Defaults to the system's locale if no locale has been
		* specified.
		* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
		* @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
		* Intl.DateTimeFormat constructor options.
		* @param {Object} opts - Options to override the configuration of the start DateTime.
		* @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
		* @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
		* @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
		* @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
		* @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
		* @return {string}
		*/
		toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
			return this.isValid ? Formatter.create(this.s.loc.clone(opts), formatOpts).formatInterval(this) : INVALID$1;
		}
		/**
		* Returns an ISO 8601-compliant string representation of this Interval.
		* @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
		* @param {Object} opts - The same options as {@link DateTime#toISO}
		* @return {string}
		*/
		toISO(opts) {
			if (!this.isValid) return INVALID$1;
			return `${this.s.toISO(opts)}/${this.e.toISO(opts)}`;
		}
		/**
		* Returns an ISO 8601-compliant string representation of date of this Interval.
		* The time components are ignored.
		* @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
		* @return {string}
		*/
		toISODate() {
			if (!this.isValid) return INVALID$1;
			return `${this.s.toISODate()}/${this.e.toISODate()}`;
		}
		/**
		* Returns an ISO 8601-compliant string representation of time of this Interval.
		* The date components are ignored.
		* @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
		* @param {Object} opts - The same options as {@link DateTime#toISO}
		* @return {string}
		*/
		toISOTime(opts) {
			if (!this.isValid) return INVALID$1;
			return `${this.s.toISOTime(opts)}/${this.e.toISOTime(opts)}`;
		}
		/**
		* Returns a string representation of this Interval formatted according to the specified format
		* string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
		* formatting tool.
		* @param {string} dateFormat - The format string. This string formats the start and end time.
		* See {@link DateTime#toFormat} for details.
		* @param {Object} opts - Options.
		* @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
		* representations.
		* @return {string}
		*/
		toFormat(dateFormat, { separator = " – " } = {}) {
			if (!this.isValid) return INVALID$1;
			return `${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;
		}
		/**
		* Return a Duration representing the time spanned by this interval.
		* @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
		* @param {Object} opts - options that affect the creation of the Duration
		* @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
		* @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
		* @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
		* @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
		* @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
		* @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
		* @return {Duration}
		*/
		toDuration(unit, opts) {
			if (!this.isValid) return Duration.invalid(this.invalidReason);
			return this.e.diff(this.s, unit, opts);
		}
		/**
		* Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
		* @param {function} mapFn
		* @return {Interval}
		* @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
		* @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
		*/
		mapEndpoints(mapFn) {
			return Interval.fromDateTimes(mapFn(this.s), mapFn(this.e));
		}
	};
	/**
	* The Info class contains static methods for retrieving general time and date related data. For example, it has methods for finding out if a time zone has a DST, for listing the months in any supported locale, and for discovering which of Luxon features are available in the current environment.
	*/
	var Info = class {
		/**
		* Return whether the specified zone contains a DST.
		* @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
		* @return {boolean}
		*/
		static hasDST(zone = Settings.defaultZone) {
			const proto = DateTime.now().setZone(zone).set({ month: 12 });
			return !zone.isUniversal && proto.offset !== proto.set({ month: 6 }).offset;
		}
		/**
		* Return whether the specified zone is a valid IANA specifier.
		* @param {string} zone - Zone to check
		* @return {boolean}
		*/
		static isValidIANAZone(zone) {
			return IANAZone.isValidZone(zone);
		}
		/**
		* Converts the input into a {@link Zone} instance.
		*
		* * If `input` is already a Zone instance, it is returned unchanged.
		* * If `input` is a string containing a valid time zone name, a Zone instance
		*   with that name is returned.
		* * If `input` is a string that doesn't refer to a known time zone, a Zone
		*   instance with {@link Zone#isValid} == false is returned.
		* * If `input is a number, a Zone instance with the specified fixed offset
		*   in minutes is returned.
		* * If `input` is `null` or `undefined`, the default zone is returned.
		* @param {string|Zone|number} [input] - the value to be converted
		* @return {Zone}
		*/
		static normalizeZone(input) {
			return normalizeZone(input, Settings.defaultZone);
		}
		/**
		* Get the weekday on which the week starts according to the given locale.
		* @param {Object} opts - options
		* @param {string} [opts.locale] - the locale code
		* @param {string} [opts.locObj=null] - an existing locale object to use
		* @returns {number} the start of the week, 1 for Monday through 7 for Sunday
		*/
		static getStartOfWeek({ locale = null, locObj = null } = {}) {
			return (locObj || Locale.create(locale)).getStartOfWeek();
		}
		/**
		* Get the minimum number of days necessary in a week before it is considered part of the next year according
		* to the given locale.
		* @param {Object} opts - options
		* @param {string} [opts.locale] - the locale code
		* @param {string} [opts.locObj=null] - an existing locale object to use
		* @returns {number}
		*/
		static getMinimumDaysInFirstWeek({ locale = null, locObj = null } = {}) {
			return (locObj || Locale.create(locale)).getMinDaysInFirstWeek();
		}
		/**
		* Get the weekdays, which are considered the weekend according to the given locale
		* @param {Object} opts - options
		* @param {string} [opts.locale] - the locale code
		* @param {string} [opts.locObj=null] - an existing locale object to use
		* @returns {number[]} an array of weekdays, 1 for Monday through 7 for Sunday
		*/
		static getWeekendWeekdays({ locale = null, locObj = null } = {}) {
			return (locObj || Locale.create(locale)).getWeekendDays().slice();
		}
		/**
		* Return an array of standalone month names.
		* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
		* @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
		* @param {Object} opts - options
		* @param {string} [opts.locale] - the locale code
		* @param {string} [opts.numberingSystem=null] - the numbering system
		* @param {string} [opts.locObj=null] - an existing locale object to use
		* @param {string} [opts.outputCalendar='gregory'] - the calendar
		* @example Info.months()[0] //=> 'January'
		* @example Info.months('short')[0] //=> 'Jan'
		* @example Info.months('numeric')[0] //=> '1'
		* @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
		* @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
		* @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
		* @return {Array}
		*/
		static months(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
			return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length);
		}
		/**
		* Return an array of format month names.
		* Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
		* changes the string.
		* See {@link Info#months}
		* @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
		* @param {Object} opts - options
		* @param {string} [opts.locale] - the locale code
		* @param {string} [opts.numberingSystem=null] - the numbering system
		* @param {string} [opts.locObj=null] - an existing locale object to use
		* @param {string} [opts.outputCalendar='gregory'] - the calendar
		* @return {Array}
		*/
		static monthsFormat(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
			return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length, true);
		}
		/**
		* Return an array of standalone week names.
		* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
		* @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
		* @param {Object} opts - options
		* @param {string} [opts.locale] - the locale code
		* @param {string} [opts.numberingSystem=null] - the numbering system
		* @param {string} [opts.locObj=null] - an existing locale object to use
		* @example Info.weekdays()[0] //=> 'Monday'
		* @example Info.weekdays('short')[0] //=> 'Mon'
		* @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
		* @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
		* @return {Array}
		*/
		static weekdays(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
			return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length);
		}
		/**
		* Return an array of format week names.
		* Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
		* changes the string.
		* See {@link Info#weekdays}
		* @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
		* @param {Object} opts - options
		* @param {string} [opts.locale=null] - the locale code
		* @param {string} [opts.numberingSystem=null] - the numbering system
		* @param {string} [opts.locObj=null] - an existing locale object to use
		* @return {Array}
		*/
		static weekdaysFormat(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
			return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length, true);
		}
		/**
		* Return an array of meridiems.
		* @param {Object} opts - options
		* @param {string} [opts.locale] - the locale code
		* @example Info.meridiems() //=> [ 'AM', 'PM' ]
		* @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
		* @return {Array}
		*/
		static meridiems({ locale = null } = {}) {
			return Locale.create(locale).meridiems();
		}
		/**
		* Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
		* @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
		* @param {Object} opts - options
		* @param {string} [opts.locale] - the locale code
		* @example Info.eras() //=> [ 'BC', 'AD' ]
		* @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
		* @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
		* @return {Array}
		*/
		static eras(length = "short", { locale = null } = {}) {
			return Locale.create(locale, null, "gregory").eras(length);
		}
		/**
		* Return the set of available features in this environment.
		* Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
		* Keys:
		* * `relative`: whether this environment supports relative time formatting
		* * `localeWeek`: whether this environment supports different weekdays for the start of the week based on the locale
		* @example Info.features() //=> { relative: false, localeWeek: true }
		* @return {Object}
		*/
		static features() {
			return {
				relative: hasRelative(),
				localeWeek: hasLocaleWeekInfo()
			};
		}
	};
	function dayDiff(earlier, later) {
		const utcDayStart = (dt) => dt.toUTC(0, { keepLocalTime: true }).startOf("day").valueOf(), ms = utcDayStart(later) - utcDayStart(earlier);
		return Math.floor(Duration.fromMillis(ms).as("days"));
	}
	function highOrderDiffs(cursor, later, units) {
		const differs = [
			["years", (a, b) => b.year - a.year],
			["quarters", (a, b) => b.quarter - a.quarter + (b.year - a.year) * 4],
			["months", (a, b) => b.month - a.month + (b.year - a.year) * 12],
			["weeks", (a, b) => {
				const days = dayDiff(a, b);
				return (days - days % 7) / 7;
			}],
			["days", dayDiff]
		];
		const results = {};
		const earlier = cursor;
		let lowestOrder, highWater;
		for (const [unit, differ] of differs) if (units.indexOf(unit) >= 0) {
			lowestOrder = unit;
			results[unit] = differ(cursor, later);
			highWater = earlier.plus(results);
			if (highWater > later) {
				results[unit]--;
				cursor = earlier.plus(results);
				if (cursor > later) {
					highWater = cursor;
					results[unit]--;
					cursor = earlier.plus(results);
				}
			} else cursor = highWater;
		}
		return [
			cursor,
			results,
			highWater,
			lowestOrder
		];
	}
	function diff(earlier, later, units, opts) {
		let [cursor, results, highWater, lowestOrder] = highOrderDiffs(earlier, later, units);
		const remainingMillis = later - cursor;
		const lowerOrderUnits = units.filter((u) => [
			"hours",
			"minutes",
			"seconds",
			"milliseconds"
		].indexOf(u) >= 0);
		if (lowerOrderUnits.length === 0) {
			if (highWater < later) highWater = cursor.plus({ [lowestOrder]: 1 });
			if (highWater !== cursor) results[lowestOrder] = (results[lowestOrder] || 0) + remainingMillis / (highWater - cursor);
		}
		const duration = Duration.fromObject(results, opts);
		if (lowerOrderUnits.length > 0) return Duration.fromMillis(remainingMillis, opts).shiftTo(...lowerOrderUnits).plus(duration);
		else return duration;
	}
	const MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";
	function intUnit(regex, post = (i) => i) {
		return {
			regex,
			deser: ([s]) => post(parseDigits(s))
		};
	}
	const spaceOrNBSP = `[ ${String.fromCharCode(160)}]`;
	const spaceOrNBSPRegExp = new RegExp(spaceOrNBSP, "g");
	function fixListRegex(s) {
		return s.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSP);
	}
	function stripInsensitivities(s) {
		return s.replace(/\./g, "").replace(spaceOrNBSPRegExp, " ").toLowerCase();
	}
	function oneOf(strings, startIndex) {
		if (strings === null) return null;
		else return {
			regex: RegExp(strings.map(fixListRegex).join("|")),
			deser: ([s]) => strings.findIndex((i) => stripInsensitivities(s) === stripInsensitivities(i)) + startIndex
		};
	}
	function offset(regex, groups) {
		return {
			regex,
			deser: ([, h, m]) => signedOffset(h, m),
			groups
		};
	}
	function simple(regex) {
		return {
			regex,
			deser: ([s]) => s
		};
	}
	function escapeToken(value) {
		return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
	}
	/**
	* @param token
	* @param {Locale} loc
	*/
	function unitForToken(token, loc) {
		const one = digitRegex(loc), two = digitRegex(loc, "{2}"), three = digitRegex(loc, "{3}"), four = digitRegex(loc, "{4}"), six = digitRegex(loc, "{6}"), oneOrTwo = digitRegex(loc, "{1,2}"), oneToThree = digitRegex(loc, "{1,3}"), oneToSix = digitRegex(loc, "{1,6}"), oneToNine = digitRegex(loc, "{1,9}"), twoToFour = digitRegex(loc, "{2,4}"), fourToSix = digitRegex(loc, "{4,6}"), literal = (t) => ({
			regex: RegExp(escapeToken(t.val)),
			deser: ([s]) => s,
			literal: true
		}), unitate = (t) => {
			if (token.literal) return literal(t);
			switch (t.val) {
				case "G": return oneOf(loc.eras("short"), 0);
				case "GG": return oneOf(loc.eras("long"), 0);
				case "y": return intUnit(oneToSix);
				case "yy": return intUnit(twoToFour, untruncateYear);
				case "yyyy": return intUnit(four);
				case "yyyyy": return intUnit(fourToSix);
				case "yyyyyy": return intUnit(six);
				case "M": return intUnit(oneOrTwo);
				case "MM": return intUnit(two);
				case "MMM": return oneOf(loc.months("short", true), 1);
				case "MMMM": return oneOf(loc.months("long", true), 1);
				case "L": return intUnit(oneOrTwo);
				case "LL": return intUnit(two);
				case "LLL": return oneOf(loc.months("short", false), 1);
				case "LLLL": return oneOf(loc.months("long", false), 1);
				case "d": return intUnit(oneOrTwo);
				case "dd": return intUnit(two);
				case "o": return intUnit(oneToThree);
				case "ooo": return intUnit(three);
				case "HH": return intUnit(two);
				case "H": return intUnit(oneOrTwo);
				case "hh": return intUnit(two);
				case "h": return intUnit(oneOrTwo);
				case "mm": return intUnit(two);
				case "m": return intUnit(oneOrTwo);
				case "q": return intUnit(oneOrTwo);
				case "qq": return intUnit(two);
				case "s": return intUnit(oneOrTwo);
				case "ss": return intUnit(two);
				case "S": return intUnit(oneToThree);
				case "SSS": return intUnit(three);
				case "u": return simple(oneToNine);
				case "uu": return simple(oneOrTwo);
				case "uuu": return intUnit(one);
				case "a": return oneOf(loc.meridiems(), 0);
				case "kkkk": return intUnit(four);
				case "kk": return intUnit(twoToFour, untruncateYear);
				case "W": return intUnit(oneOrTwo);
				case "WW": return intUnit(two);
				case "E":
				case "c": return intUnit(one);
				case "EEE": return oneOf(loc.weekdays("short", false), 1);
				case "EEEE": return oneOf(loc.weekdays("long", false), 1);
				case "ccc": return oneOf(loc.weekdays("short", true), 1);
				case "cccc": return oneOf(loc.weekdays("long", true), 1);
				case "Z":
				case "ZZ": return offset(new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`), 2);
				case "ZZZ": return offset(new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`), 2);
				case "z": return simple(/[a-z_+-/]{1,256}?/i);
				case " ": return simple(/[^\S\n\r]/);
				default: return literal(t);
			}
		};
		const unit = unitate(token) || { invalidReason: MISSING_FTP };
		unit.token = token;
		return unit;
	}
	const partTypeStyleToTokenVal = {
		year: {
			"2-digit": "yy",
			numeric: "yyyyy"
		},
		month: {
			numeric: "M",
			"2-digit": "MM",
			short: "MMM",
			long: "MMMM"
		},
		day: {
			numeric: "d",
			"2-digit": "dd"
		},
		weekday: {
			short: "EEE",
			long: "EEEE"
		},
		dayperiod: "a",
		dayPeriod: "a",
		hour12: {
			numeric: "h",
			"2-digit": "hh"
		},
		hour24: {
			numeric: "H",
			"2-digit": "HH"
		},
		minute: {
			numeric: "m",
			"2-digit": "mm"
		},
		second: {
			numeric: "s",
			"2-digit": "ss"
		},
		timeZoneName: {
			long: "ZZZZZ",
			short: "ZZZ"
		}
	};
	function tokenForPart(part, formatOpts, resolvedOpts) {
		const { type, value } = part;
		if (type === "literal") {
			const isSpace = /^\s+$/.test(value);
			return {
				literal: !isSpace,
				val: isSpace ? " " : value
			};
		}
		const style = formatOpts[type];
		let actualType = type;
		if (type === "hour") if (formatOpts.hour12 != null) actualType = formatOpts.hour12 ? "hour12" : "hour24";
		else if (formatOpts.hourCycle != null) if (formatOpts.hourCycle === "h11" || formatOpts.hourCycle === "h12") actualType = "hour12";
		else actualType = "hour24";
		else actualType = resolvedOpts.hour12 ? "hour12" : "hour24";
		let val = partTypeStyleToTokenVal[actualType];
		if (typeof val === "object") val = val[style];
		if (val) return {
			literal: false,
			val
		};
	}
	function buildRegex(units) {
		return [`^${units.map((u) => u.regex).reduce((f, r) => `${f}(${r.source})`, "")}$`, units];
	}
	function match(input, regex, handlers) {
		const matches = input.match(regex);
		if (matches) {
			const all = {};
			let matchIndex = 1;
			for (const i in handlers) if (hasOwnProperty(handlers, i)) {
				const h = handlers[i], groups = h.groups ? h.groups + 1 : 1;
				if (!h.literal && h.token) all[h.token.val[0]] = h.deser(matches.slice(matchIndex, matchIndex + groups));
				matchIndex += groups;
			}
			return [matches, all];
		} else return [matches, {}];
	}
	function dateTimeFromMatches(matches) {
		const toField = (token) => {
			switch (token) {
				case "S": return "millisecond";
				case "s": return "second";
				case "m": return "minute";
				case "h":
				case "H": return "hour";
				case "d": return "day";
				case "o": return "ordinal";
				case "L":
				case "M": return "month";
				case "y": return "year";
				case "E":
				case "c": return "weekday";
				case "W": return "weekNumber";
				case "k": return "weekYear";
				case "q": return "quarter";
				default: return null;
			}
		};
		let zone = null;
		let specificOffset;
		if (!isUndefined(matches.z)) zone = IANAZone.create(matches.z);
		if (!isUndefined(matches.Z)) {
			if (!zone) zone = new FixedOffsetZone(matches.Z);
			specificOffset = matches.Z;
		}
		if (!isUndefined(matches.q)) matches.M = (matches.q - 1) * 3 + 1;
		if (!isUndefined(matches.h)) {
			if (matches.h < 12 && matches.a === 1) matches.h += 12;
			else if (matches.h === 12 && matches.a === 0) matches.h = 0;
		}
		if (matches.G === 0 && matches.y) matches.y = -matches.y;
		if (!isUndefined(matches.u)) matches.S = parseMillis(matches.u);
		return [
			Object.keys(matches).reduce((r, k) => {
				const f = toField(k);
				if (f) r[f] = matches[k];
				return r;
			}, {}),
			zone,
			specificOffset
		];
	}
	let dummyDateTimeCache = null;
	function getDummyDateTime() {
		if (!dummyDateTimeCache) dummyDateTimeCache = DateTime.fromMillis(1555555555555);
		return dummyDateTimeCache;
	}
	function maybeExpandMacroToken(token, locale) {
		if (token.literal) return token;
		const tokens = formatOptsToTokens(Formatter.macroTokenToFormatOpts(token.val), locale);
		if (tokens == null || tokens.includes(void 0)) return token;
		return tokens;
	}
	function expandMacroTokens(tokens, locale) {
		return Array.prototype.concat(...tokens.map((t) => maybeExpandMacroToken(t, locale)));
	}
	/**
	* @private
	*/
	var TokenParser = class {
		constructor(locale, format) {
			this.locale = locale;
			this.format = format;
			this.tokens = expandMacroTokens(Formatter.parseFormat(format), locale);
			this.units = this.tokens.map((t) => unitForToken(t, locale));
			this.disqualifyingUnit = this.units.find((t) => t.invalidReason);
			if (!this.disqualifyingUnit) {
				const [regexString, handlers] = buildRegex(this.units);
				this.regex = RegExp(regexString, "i");
				this.handlers = handlers;
			}
		}
		explainFromTokens(input) {
			if (!this.isValid) return {
				input,
				tokens: this.tokens,
				invalidReason: this.invalidReason
			};
			else {
				const [rawMatches, matches] = match(input, this.regex, this.handlers), [result, zone, specificOffset] = matches ? dateTimeFromMatches(matches) : [
					null,
					null,
					void 0
				];
				if (hasOwnProperty(matches, "a") && hasOwnProperty(matches, "H")) throw new ConflictingSpecificationError("Can't include meridiem when specifying 24-hour format");
				return {
					input,
					tokens: this.tokens,
					regex: this.regex,
					rawMatches,
					matches,
					result,
					zone,
					specificOffset
				};
			}
		}
		get isValid() {
			return !this.disqualifyingUnit;
		}
		get invalidReason() {
			return this.disqualifyingUnit ? this.disqualifyingUnit.invalidReason : null;
		}
	};
	function explainFromTokens(locale, input, format) {
		return new TokenParser(locale, format).explainFromTokens(input);
	}
	function parseFromTokens(locale, input, format) {
		const { result, zone, specificOffset, invalidReason } = explainFromTokens(locale, input, format);
		return [
			result,
			zone,
			specificOffset,
			invalidReason
		];
	}
	function formatOptsToTokens(formatOpts, locale) {
		if (!formatOpts) return null;
		const df = Formatter.create(locale, formatOpts).dtFormatter(getDummyDateTime());
		const parts = df.formatToParts();
		const resolvedOpts = df.resolvedOptions();
		return parts.map((p) => tokenForPart(p, formatOpts, resolvedOpts));
	}
	const INVALID = "Invalid DateTime";
	const MAX_DATE = 864e13;
	function unsupportedZone(zone) {
		return new Invalid("unsupported zone", `the zone "${zone.name}" is not supported`);
	}
	/**
	* @param {DateTime} dt
	*/
	function possiblyCachedWeekData(dt) {
		if (dt.weekData === null) dt.weekData = gregorianToWeek(dt.c);
		return dt.weekData;
	}
	/**
	* @param {DateTime} dt
	*/
	function possiblyCachedLocalWeekData(dt) {
		if (dt.localWeekData === null) dt.localWeekData = gregorianToWeek(dt.c, dt.loc.getMinDaysInFirstWeek(), dt.loc.getStartOfWeek());
		return dt.localWeekData;
	}
	function clone(inst, alts) {
		const current = {
			ts: inst.ts,
			zone: inst.zone,
			c: inst.c,
			o: inst.o,
			loc: inst.loc,
			invalid: inst.invalid
		};
		return new DateTime({
			...current,
			...alts,
			old: current
		});
	}
	function fixOffset(localTS, o, tz) {
		let utcGuess = localTS - o * 60 * 1e3;
		const o2 = tz.offset(utcGuess);
		if (o === o2) return [utcGuess, o];
		utcGuess -= (o2 - o) * 60 * 1e3;
		const o3 = tz.offset(utcGuess);
		if (o2 === o3) return [utcGuess, o2];
		return [localTS - Math.min(o2, o3) * 60 * 1e3, Math.max(o2, o3)];
	}
	function tsToObj(ts, offset) {
		ts += offset * 60 * 1e3;
		const d = new Date(ts);
		return {
			year: d.getUTCFullYear(),
			month: d.getUTCMonth() + 1,
			day: d.getUTCDate(),
			hour: d.getUTCHours(),
			minute: d.getUTCMinutes(),
			second: d.getUTCSeconds(),
			millisecond: d.getUTCMilliseconds()
		};
	}
	function objToTS(obj, offset, zone) {
		return fixOffset(objToLocalTS(obj), offset, zone);
	}
	function adjustTime(inst, dur) {
		const oPre = inst.o, year = inst.c.year + Math.trunc(dur.years), month = inst.c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3, c = {
			...inst.c,
			year,
			month,
			day: Math.min(inst.c.day, daysInMonth(year, month)) + Math.trunc(dur.days) + Math.trunc(dur.weeks) * 7
		}, millisToAdd = Duration.fromObject({
			years: dur.years - Math.trunc(dur.years),
			quarters: dur.quarters - Math.trunc(dur.quarters),
			months: dur.months - Math.trunc(dur.months),
			weeks: dur.weeks - Math.trunc(dur.weeks),
			days: dur.days - Math.trunc(dur.days),
			hours: dur.hours,
			minutes: dur.minutes,
			seconds: dur.seconds,
			milliseconds: dur.milliseconds
		}).as("milliseconds");
		let [ts, o] = fixOffset(objToLocalTS(c), oPre, inst.zone);
		if (millisToAdd !== 0) {
			ts += millisToAdd;
			o = inst.zone.offset(ts);
		}
		return {
			ts,
			o
		};
	}
	function parseDataToDateTime(parsed, parsedZone, opts, format, text, specificOffset) {
		const { setZone, zone } = opts;
		if (parsed && Object.keys(parsed).length !== 0 || parsedZone) {
			const interpretationZone = parsedZone || zone, inst = DateTime.fromObject(parsed, {
				...opts,
				zone: interpretationZone,
				specificOffset
			});
			return setZone ? inst : inst.setZone(zone);
		} else return DateTime.invalid(new Invalid("unparsable", `the input "${text}" can't be parsed as ${format}`));
	}
	function toTechFormat(dt, format, allowZ = true) {
		return dt.isValid ? Formatter.create(Locale.create("en-US"), {
			allowZ,
			forceSimple: true
		}).formatDateTimeFromString(dt, format) : null;
	}
	function toISODate(o, extended, precision) {
		const longFormat = o.c.year > 9999 || o.c.year < 0;
		let c = "";
		if (longFormat && o.c.year >= 0) c += "+";
		c += padStart(o.c.year, longFormat ? 6 : 4);
		if (precision === "year") return c;
		if (extended) {
			c += "-";
			c += padStart(o.c.month);
			if (precision === "month") return c;
			c += "-";
		} else {
			c += padStart(o.c.month);
			if (precision === "month") return c;
		}
		c += padStart(o.c.day);
		return c;
	}
	function toISOTime(o, extended, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone, precision) {
		let showSeconds = !suppressSeconds || o.c.millisecond !== 0 || o.c.second !== 0, c = "";
		switch (precision) {
			case "day":
			case "month":
			case "year": break;
			default:
				c += padStart(o.c.hour);
				if (precision === "hour") break;
				if (extended) {
					c += ":";
					c += padStart(o.c.minute);
					if (precision === "minute") break;
					if (showSeconds) {
						c += ":";
						c += padStart(o.c.second);
					}
				} else {
					c += padStart(o.c.minute);
					if (precision === "minute") break;
					if (showSeconds) c += padStart(o.c.second);
				}
				if (precision === "second") break;
				if (showSeconds && (!suppressMilliseconds || o.c.millisecond !== 0)) {
					c += ".";
					c += padStart(o.c.millisecond, 3);
				}
		}
		if (includeOffset) if (o.isOffsetFixed && o.offset === 0 && !extendedZone) c += "Z";
		else if (o.o < 0) {
			c += "-";
			c += padStart(Math.trunc(-o.o / 60));
			c += ":";
			c += padStart(Math.trunc(-o.o % 60));
		} else {
			c += "+";
			c += padStart(Math.trunc(o.o / 60));
			c += ":";
			c += padStart(Math.trunc(o.o % 60));
		}
		if (extendedZone) c += "[" + o.zone.ianaName + "]";
		return c;
	}
	const defaultUnitValues = {
		month: 1,
		day: 1,
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	}, defaultWeekUnitValues = {
		weekNumber: 1,
		weekday: 1,
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	}, defaultOrdinalUnitValues = {
		ordinal: 1,
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	};
	const orderedUnits = [
		"year",
		"month",
		"day",
		"hour",
		"minute",
		"second",
		"millisecond"
	], orderedWeekUnits = [
		"weekYear",
		"weekNumber",
		"weekday",
		"hour",
		"minute",
		"second",
		"millisecond"
	], orderedOrdinalUnits = [
		"year",
		"ordinal",
		"hour",
		"minute",
		"second",
		"millisecond"
	];
	function normalizeUnit(unit) {
		const normalized = {
			year: "year",
			years: "year",
			month: "month",
			months: "month",
			day: "day",
			days: "day",
			hour: "hour",
			hours: "hour",
			minute: "minute",
			minutes: "minute",
			quarter: "quarter",
			quarters: "quarter",
			second: "second",
			seconds: "second",
			millisecond: "millisecond",
			milliseconds: "millisecond",
			weekday: "weekday",
			weekdays: "weekday",
			weeknumber: "weekNumber",
			weeksnumber: "weekNumber",
			weeknumbers: "weekNumber",
			weekyear: "weekYear",
			weekyears: "weekYear",
			ordinal: "ordinal"
		}[unit.toLowerCase()];
		if (!normalized) throw new InvalidUnitError(unit);
		return normalized;
	}
	function normalizeUnitWithLocalWeeks(unit) {
		switch (unit.toLowerCase()) {
			case "localweekday":
			case "localweekdays": return "localWeekday";
			case "localweeknumber":
			case "localweeknumbers": return "localWeekNumber";
			case "localweekyear":
			case "localweekyears": return "localWeekYear";
			default: return normalizeUnit(unit);
		}
	}
	/**
	* @param {Zone} zone
	* @return {number}
	*/
	function guessOffsetForZone(zone) {
		if (zoneOffsetTs === void 0) zoneOffsetTs = Settings.now();
		if (zone.type !== "iana") return zone.offset(zoneOffsetTs);
		const zoneName = zone.name;
		let offsetGuess = zoneOffsetGuessCache.get(zoneName);
		if (offsetGuess === void 0) {
			offsetGuess = zone.offset(zoneOffsetTs);
			zoneOffsetGuessCache.set(zoneName, offsetGuess);
		}
		return offsetGuess;
	}
	function quickDT(obj, opts) {
		const zone = normalizeZone(opts.zone, Settings.defaultZone);
		if (!zone.isValid) return DateTime.invalid(unsupportedZone(zone));
		const loc = Locale.fromObject(opts);
		let ts, o;
		if (!isUndefined(obj.year)) {
			for (const u of orderedUnits) if (isUndefined(obj[u])) obj[u] = defaultUnitValues[u];
			const invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
			if (invalid) return DateTime.invalid(invalid);
			const offsetProvis = guessOffsetForZone(zone);
			[ts, o] = objToTS(obj, offsetProvis, zone);
		} else ts = Settings.now();
		return new DateTime({
			ts,
			zone,
			loc,
			o
		});
	}
	function diffRelative(start, end, opts) {
		const round = isUndefined(opts.round) ? true : opts.round, rounding = isUndefined(opts.rounding) ? "trunc" : opts.rounding, format = (c, unit) => {
			c = roundTo(c, round || opts.calendary ? 0 : 2, opts.calendary ? "round" : rounding);
			return end.loc.clone(opts).relFormatter(opts).format(c, unit);
		}, differ = (unit) => {
			if (opts.calendary) if (!end.hasSame(start, unit)) return end.startOf(unit).diff(start.startOf(unit), unit).get(unit);
			else return 0;
			else return end.diff(start, unit).get(unit);
		};
		if (opts.unit) return format(differ(opts.unit), opts.unit);
		for (const unit of opts.units) {
			const count = differ(unit);
			if (Math.abs(count) >= 1) return format(count, unit);
		}
		return format(start > end ? -0 : 0, opts.units[opts.units.length - 1]);
	}
	function lastOpts(argList) {
		let opts = {}, args;
		if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
			opts = argList[argList.length - 1];
			args = Array.from(argList).slice(0, argList.length - 1);
		} else args = Array.from(argList);
		return [opts, args];
	}
	/**
	* Timestamp to use for cached zone offset guesses (exposed for test)
	*/
	let zoneOffsetTs;
	/**
	* Cache for zone offset guesses (exposed for test).
	*
	* This optimizes quickDT via guessOffsetForZone to avoid repeated calls of
	* zone.offset().
	*/
	const zoneOffsetGuessCache = /* @__PURE__ */ new Map();
	/**
	* A DateTime is an immutable data structure representing a specific date and time and accompanying methods. It contains class and instance methods for creating, parsing, interrogating, transforming, and formatting them.
	*
	* A DateTime comprises of:
	* * A timestamp. Each DateTime instance refers to a specific millisecond of the Unix epoch.
	* * A time zone. Each instance is considered in the context of a specific zone (by default the local system's zone).
	* * Configuration properties that effect how output strings are formatted, such as `locale`, `numberingSystem`, and `outputCalendar`.
	*
	* Here is a brief overview of the most commonly used functionality it provides:
	*
	* * **Creation**: To create a DateTime from its components, use one of its factory class methods: {@link DateTime.local}, {@link DateTime.utc}, and (most flexibly) {@link DateTime.fromObject}. To create one from a standard string format, use {@link DateTime.fromISO}, {@link DateTime.fromHTTP}, and {@link DateTime.fromRFC2822}. To create one from a custom string format, use {@link DateTime.fromFormat}. To create one from a native JS date, use {@link DateTime.fromJSDate}.
	* * **Gregorian calendar and time**: To examine the Gregorian properties of a DateTime individually (i.e as opposed to collectively through {@link DateTime#toObject}), use the {@link DateTime#year}, {@link DateTime#month},
	* {@link DateTime#day}, {@link DateTime#hour}, {@link DateTime#minute}, {@link DateTime#second}, {@link DateTime#millisecond} accessors.
	* * **Week calendar**: For ISO week calendar attributes, see the {@link DateTime#weekYear}, {@link DateTime#weekNumber}, and {@link DateTime#weekday} accessors.
	* * **Configuration** See the {@link DateTime#locale} and {@link DateTime#numberingSystem} accessors.
	* * **Transformation**: To transform the DateTime into other DateTimes, use {@link DateTime#set}, {@link DateTime#reconfigure}, {@link DateTime#setZone}, {@link DateTime#setLocale}, {@link DateTime.plus}, {@link DateTime#minus}, {@link DateTime#endOf}, {@link DateTime#startOf}, {@link DateTime#toUTC}, and {@link DateTime#toLocal}.
	* * **Output**: To convert the DateTime to other representations, use the {@link DateTime#toRelative}, {@link DateTime#toRelativeCalendar}, {@link DateTime#toJSON}, {@link DateTime#toISO}, {@link DateTime#toHTTP}, {@link DateTime#toObject}, {@link DateTime#toRFC2822}, {@link DateTime#toString}, {@link DateTime#toLocaleString}, {@link DateTime#toFormat}, {@link DateTime#toMillis} and {@link DateTime#toJSDate}.
	*
	* There's plenty others documented below. In addition, for more information on subtler topics like internationalization, time zones, alternative calendars, validity, and so on, see the external documentation.
	*/
	var DateTime = class DateTime {
		/**
		* @access private
		*/
		constructor(config) {
			const zone = config.zone || Settings.defaultZone;
			let invalid = config.invalid || (Number.isNaN(config.ts) ? new Invalid("invalid input") : null) || (!zone.isValid ? unsupportedZone(zone) : null);
			/**
			* @access private
			*/
			this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;
			let c = null, o = null;
			if (!invalid) if (config.old && config.old.ts === this.ts && config.old.zone.equals(zone)) [c, o] = [config.old.c, config.old.o];
			else {
				const ot = isNumber(config.o) && !config.old ? config.o : zone.offset(this.ts);
				c = tsToObj(this.ts, ot);
				invalid = Number.isNaN(c.year) ? new Invalid("invalid input") : null;
				c = invalid ? null : c;
				o = invalid ? null : ot;
			}
			/**
			* @access private
			*/
			this._zone = zone;
			/**
			* @access private
			*/
			this.loc = config.loc || Locale.create();
			/**
			* @access private
			*/
			this.invalid = invalid;
			/**
			* @access private
			*/
			this.weekData = null;
			/**
			* @access private
			*/
			this.localWeekData = null;
			/**
			* @access private
			*/
			this.c = c;
			/**
			* @access private
			*/
			this.o = o;
			/**
			* @access private
			*/
			this.isLuxonDateTime = true;
		}
		/**
		* Create a DateTime for the current instant, in the system's time zone.
		*
		* Use Settings to override these default values if needed.
		* @example DateTime.now().toISO() //~> now in the ISO format
		* @return {DateTime}
		*/
		static now() {
			return new DateTime({});
		}
		/**
		* Create a local DateTime
		* @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
		* @param {number} [month=1] - The month, 1-indexed
		* @param {number} [day=1] - The day of the month, 1-indexed
		* @param {number} [hour=0] - The hour of the day, in 24-hour time
		* @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
		* @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
		* @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
		* @example DateTime.local()                                  //~> now
		* @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
		* @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
		* @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
		* @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
		* @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
		* @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
		* @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
		* @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
		* @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
		* @return {DateTime}
		*/
		static local() {
			const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
			return quickDT({
				year,
				month,
				day,
				hour,
				minute,
				second,
				millisecond
			}, opts);
		}
		/**
		* Create a DateTime in UTC
		* @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
		* @param {number} [month=1] - The month, 1-indexed
		* @param {number} [day=1] - The day of the month
		* @param {number} [hour=0] - The hour of the day, in 24-hour time
		* @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
		* @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
		* @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
		* @param {Object} options - configuration options for the DateTime
		* @param {string} [options.locale] - a locale to set on the resulting DateTime instance
		* @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
		* @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
		* @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
		* @example DateTime.utc()                                              //~> now
		* @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
		* @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
		* @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
		* @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
		* @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
		* @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
		* @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
		* @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
		* @return {DateTime}
		*/
		static utc() {
			const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
			opts.zone = FixedOffsetZone.utcInstance;
			return quickDT({
				year,
				month,
				day,
				hour,
				minute,
				second,
				millisecond
			}, opts);
		}
		/**
		* Create a DateTime from a JavaScript Date object. Uses the default zone.
		* @param {Date} date - a JavaScript Date object
		* @param {Object} options - configuration options for the DateTime
		* @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
		* @return {DateTime}
		*/
		static fromJSDate(date, options = {}) {
			const ts = isDate(date) ? date.valueOf() : NaN;
			if (Number.isNaN(ts)) return DateTime.invalid("invalid input");
			const zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
			if (!zoneToUse.isValid) return DateTime.invalid(unsupportedZone(zoneToUse));
			return new DateTime({
				ts,
				zone: zoneToUse,
				loc: Locale.fromObject(options)
			});
		}
		/**
		* Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
		* @param {number} milliseconds - a number of milliseconds since 1970 UTC
		* @param {Object} options - configuration options for the DateTime
		* @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
		* @param {string} [options.locale] - a locale to set on the resulting DateTime instance
		* @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
		* @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
		* @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
		* @return {DateTime}
		*/
		static fromMillis(milliseconds, options = {}) {
			if (!isNumber(milliseconds)) throw new InvalidArgumentError(`fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`);
			else if (milliseconds < -864e13 || milliseconds > MAX_DATE) return DateTime.invalid("Timestamp out of range");
			else return new DateTime({
				ts: milliseconds,
				zone: normalizeZone(options.zone, Settings.defaultZone),
				loc: Locale.fromObject(options)
			});
		}
		/**
		* Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
		* @param {number} seconds - a number of seconds since 1970 UTC
		* @param {Object} options - configuration options for the DateTime
		* @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
		* @param {string} [options.locale] - a locale to set on the resulting DateTime instance
		* @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
		* @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
		* @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
		* @return {DateTime}
		*/
		static fromSeconds(seconds, options = {}) {
			if (!isNumber(seconds)) throw new InvalidArgumentError("fromSeconds requires a numerical input");
			else return new DateTime({
				ts: seconds * 1e3,
				zone: normalizeZone(options.zone, Settings.defaultZone),
				loc: Locale.fromObject(options)
			});
		}
		/**
		* Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
		* @param {Object} obj - the object to create the DateTime from
		* @param {number} obj.year - a year, such as 1987
		* @param {number} obj.month - a month, 1-12
		* @param {number} obj.day - a day of the month, 1-31, depending on the month
		* @param {number} obj.ordinal - day of the year, 1-365 or 366
		* @param {number} obj.weekYear - an ISO week year
		* @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
		* @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
		* @param {number} obj.localWeekYear - a week year, according to the locale
		* @param {number} obj.localWeekNumber - a week number, between 1 and 52 or 53, depending on the year, according to the locale
		* @param {number} obj.localWeekday - a weekday, 1-7, where 1 is the first and 7 is the last day of the week, according to the locale
		* @param {number} obj.hour - hour of the day, 0-23
		* @param {number} obj.minute - minute of the hour, 0-59
		* @param {number} obj.second - second of the minute, 0-59
		* @param {number} obj.millisecond - millisecond of the second, 0-999
		* @param {Object} opts - options for creating this DateTime
		* @param {string|Zone} [opts.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
		* @param {string} [opts.locale='system\'s locale'] - a locale to set on the resulting DateTime instance
		* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
		* @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
		* @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
		* @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
		* @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
		* @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
		* @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
		* @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
		* @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
		* @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
		* @example DateTime.fromObject({ localWeekYear: 2022, localWeekNumber: 1, localWeekday: 1 }, { locale: "en-US" }).toISODate() //=> '2021-12-26'
		* @return {DateTime}
		*/
		static fromObject(obj, opts = {}) {
			obj = obj || {};
			const zoneToUse = normalizeZone(opts.zone, Settings.defaultZone);
			if (!zoneToUse.isValid) return DateTime.invalid(unsupportedZone(zoneToUse));
			const loc = Locale.fromObject(opts);
			const normalized = normalizeObject(obj, normalizeUnitWithLocalWeeks);
			const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, loc);
			const tsNow = Settings.now(), offsetProvis = !isUndefined(opts.specificOffset) ? opts.specificOffset : zoneToUse.offset(tsNow), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
			if ((containsGregor || containsOrdinal) && definiteWeekDef) throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
			if (containsGregorMD && containsOrdinal) throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
			const useWeekData = definiteWeekDef || normalized.weekday && !containsGregor;
			let units, defaultValues, objNow = tsToObj(tsNow, offsetProvis);
			if (useWeekData) {
				units = orderedWeekUnits;
				defaultValues = defaultWeekUnitValues;
				objNow = gregorianToWeek(objNow, minDaysInFirstWeek, startOfWeek);
			} else if (containsOrdinal) {
				units = orderedOrdinalUnits;
				defaultValues = defaultOrdinalUnitValues;
				objNow = gregorianToOrdinal(objNow);
			} else {
				units = orderedUnits;
				defaultValues = defaultUnitValues;
			}
			let foundFirst = false;
			for (const u of units) {
				const v = normalized[u];
				if (!isUndefined(v)) foundFirst = true;
				else if (foundFirst) normalized[u] = defaultValues[u];
				else normalized[u] = objNow[u];
			}
			const invalid = (useWeekData ? hasInvalidWeekData(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? hasInvalidOrdinalData(normalized) : hasInvalidGregorianData(normalized)) || hasInvalidTimeData(normalized);
			if (invalid) return DateTime.invalid(invalid);
			const [tsFinal, offsetFinal] = objToTS(useWeekData ? weekToGregorian(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? ordinalToGregorian(normalized) : normalized, offsetProvis, zoneToUse), inst = new DateTime({
				ts: tsFinal,
				zone: zoneToUse,
				o: offsetFinal,
				loc
			});
			if (normalized.weekday && containsGregor && obj.weekday !== inst.weekday) return DateTime.invalid("mismatched weekday", `you can't specify both a weekday of ${normalized.weekday} and a date of ${inst.toISO()}`);
			if (!inst.isValid) return DateTime.invalid(inst.invalid);
			return inst;
		}
		/**
		* Create a DateTime from an ISO 8601 string
		* @param {string} text - the ISO string
		* @param {Object} opts - options to affect the creation
		* @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
		* @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
		* @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
		* @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
		* @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
		* @param {string} [opts.weekSettings] - the week settings to set on the resulting DateTime instance
		* @example DateTime.fromISO('2016-05-25T09:08:34.123')
		* @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
		* @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
		* @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
		* @example DateTime.fromISO('2016-W05-4')
		* @return {DateTime}
		*/
		static fromISO(text, opts = {}) {
			const [vals, parsedZone] = parseISODate(text);
			return parseDataToDateTime(vals, parsedZone, opts, "ISO 8601", text);
		}
		/**
		* Create a DateTime from an RFC 2822 string
		* @param {string} text - the RFC 2822 string
		* @param {Object} opts - options to affect the creation
		* @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
		* @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
		* @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
		* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
		* @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
		* @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
		* @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
		* @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
		* @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
		* @return {DateTime}
		*/
		static fromRFC2822(text, opts = {}) {
			const [vals, parsedZone] = parseRFC2822Date(text);
			return parseDataToDateTime(vals, parsedZone, opts, "RFC 2822", text);
		}
		/**
		* Create a DateTime from an HTTP header date
		* @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
		* @param {string} text - the HTTP header date
		* @param {Object} opts - options to affect the creation
		* @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
		* @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
		* @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
		* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
		* @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
		* @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
		* @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
		* @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
		* @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
		* @return {DateTime}
		*/
		static fromHTTP(text, opts = {}) {
			const [vals, parsedZone] = parseHTTPDate(text);
			return parseDataToDateTime(vals, parsedZone, opts, "HTTP", opts);
		}
		/**
		* Create a DateTime from an input string and format string.
		* Defaults to en-US if no locale has been specified, regardless of the system's locale. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).
		* @param {string} text - the string to parse
		* @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
		* @param {Object} opts - options to affect the creation
		* @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
		* @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
		* @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
		* @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
		* @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
		* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
		* @return {DateTime}
		*/
		static fromFormat(text, fmt, opts = {}) {
			if (isUndefined(text) || isUndefined(fmt)) throw new InvalidArgumentError("fromFormat requires an input string and a format");
			const { locale = null, numberingSystem = null } = opts, [vals, parsedZone, specificOffset, invalid] = parseFromTokens(Locale.fromOpts({
				locale,
				numberingSystem,
				defaultToEN: true
			}), text, fmt);
			if (invalid) return DateTime.invalid(invalid);
			else return parseDataToDateTime(vals, parsedZone, opts, `format ${fmt}`, text, specificOffset);
		}
		/**
		* @deprecated use fromFormat instead
		*/
		static fromString(text, fmt, opts = {}) {
			return DateTime.fromFormat(text, fmt, opts);
		}
		/**
		* Create a DateTime from a SQL date, time, or datetime
		* Defaults to en-US if no locale has been specified, regardless of the system's locale
		* @param {string} text - the string to parse
		* @param {Object} opts - options to affect the creation
		* @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
		* @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
		* @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
		* @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
		* @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
		* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
		* @example DateTime.fromSQL('2017-05-15')
		* @example DateTime.fromSQL('2017-05-15 09:12:34')
		* @example DateTime.fromSQL('2017-05-15 09:12:34.342')
		* @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
		* @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
		* @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
		* @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
		* @example DateTime.fromSQL('09:12:34.342')
		* @return {DateTime}
		*/
		static fromSQL(text, opts = {}) {
			const [vals, parsedZone] = parseSQL(text);
			return parseDataToDateTime(vals, parsedZone, opts, "SQL", text);
		}
		/**
		* Create an invalid DateTime.
		* @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
		* @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
		* @return {DateTime}
		*/
		static invalid(reason, explanation = null) {
			if (!reason) throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");
			const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
			if (Settings.throwOnInvalid) throw new InvalidDateTimeError(invalid);
			else return new DateTime({ invalid });
		}
		/**
		* Check if an object is an instance of DateTime. Works across context boundaries
		* @param {object} o
		* @return {boolean}
		*/
		static isDateTime(o) {
			return o && o.isLuxonDateTime || false;
		}
		/**
		* Produce the format string for a set of options
		* @param formatOpts
		* @param localeOpts
		* @returns {string}
		*/
		static parseFormatForOpts(formatOpts, localeOpts = {}) {
			const tokenList = formatOptsToTokens(formatOpts, Locale.fromObject(localeOpts));
			return !tokenList ? null : tokenList.map((t) => t ? t.val : null).join("");
		}
		/**
		* Produce the the fully expanded format token for the locale
		* Does NOT quote characters, so quoted tokens will not round trip correctly
		* @param fmt
		* @param localeOpts
		* @returns {string}
		*/
		static expandFormat(fmt, localeOpts = {}) {
			return expandMacroTokens(Formatter.parseFormat(fmt), Locale.fromObject(localeOpts)).map((t) => t.val).join("");
		}
		static resetCache() {
			zoneOffsetTs = void 0;
			zoneOffsetGuessCache.clear();
		}
		/**
		* Get the value of unit.
		* @param {string} unit - a unit such as 'minute' or 'day'
		* @example DateTime.local(2017, 7, 4).get('month'); //=> 7
		* @example DateTime.local(2017, 7, 4).get('day'); //=> 4
		* @return {number}
		*/
		get(unit) {
			return this[unit];
		}
		/**
		* Returns whether the DateTime is valid. Invalid DateTimes occur when:
		* * The DateTime was created from invalid calendar information, such as the 13th month or February 30
		* * The DateTime was created by an operation on another invalid date
		* @type {boolean}
		*/
		get isValid() {
			return this.invalid === null;
		}
		/**
		* Returns an error code if this DateTime is invalid, or null if the DateTime is valid
		* @type {string}
		*/
		get invalidReason() {
			return this.invalid ? this.invalid.reason : null;
		}
		/**
		* Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
		* @type {string}
		*/
		get invalidExplanation() {
			return this.invalid ? this.invalid.explanation : null;
		}
		/**
		* Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
		*
		* @type {string}
		*/
		get locale() {
			return this.isValid ? this.loc.locale : null;
		}
		/**
		* Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
		*
		* @type {string}
		*/
		get numberingSystem() {
			return this.isValid ? this.loc.numberingSystem : null;
		}
		/**
		* Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
		*
		* @type {string}
		*/
		get outputCalendar() {
			return this.isValid ? this.loc.outputCalendar : null;
		}
		/**
		* Get the time zone associated with this DateTime.
		* @type {Zone}
		*/
		get zone() {
			return this._zone;
		}
		/**
		* Get the name of the time zone.
		* @type {string}
		*/
		get zoneName() {
			return this.isValid ? this.zone.name : null;
		}
		/**
		* Get the year
		* @example DateTime.local(2017, 5, 25).year //=> 2017
		* @type {number}
		*/
		get year() {
			return this.isValid ? this.c.year : NaN;
		}
		/**
		* Get the quarter
		* @example DateTime.local(2017, 5, 25).quarter //=> 2
		* @type {number}
		*/
		get quarter() {
			return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
		}
		/**
		* Get the month (1-12).
		* @example DateTime.local(2017, 5, 25).month //=> 5
		* @type {number}
		*/
		get month() {
			return this.isValid ? this.c.month : NaN;
		}
		/**
		* Get the day of the month (1-30ish).
		* @example DateTime.local(2017, 5, 25).day //=> 25
		* @type {number}
		*/
		get day() {
			return this.isValid ? this.c.day : NaN;
		}
		/**
		* Get the hour of the day (0-23).
		* @example DateTime.local(2017, 5, 25, 9).hour //=> 9
		* @type {number}
		*/
		get hour() {
			return this.isValid ? this.c.hour : NaN;
		}
		/**
		* Get the minute of the hour (0-59).
		* @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
		* @type {number}
		*/
		get minute() {
			return this.isValid ? this.c.minute : NaN;
		}
		/**
		* Get the second of the minute (0-59).
		* @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
		* @type {number}
		*/
		get second() {
			return this.isValid ? this.c.second : NaN;
		}
		/**
		* Get the millisecond of the second (0-999).
		* @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
		* @type {number}
		*/
		get millisecond() {
			return this.isValid ? this.c.millisecond : NaN;
		}
		/**
		* Get the week year
		* @see https://en.wikipedia.org/wiki/ISO_week_date
		* @example DateTime.local(2014, 12, 31).weekYear //=> 2015
		* @type {number}
		*/
		get weekYear() {
			return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
		}
		/**
		* Get the week number of the week year (1-52ish).
		* @see https://en.wikipedia.org/wiki/ISO_week_date
		* @example DateTime.local(2017, 5, 25).weekNumber //=> 21
		* @type {number}
		*/
		get weekNumber() {
			return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
		}
		/**
		* Get the day of the week.
		* 1 is Monday and 7 is Sunday
		* @see https://en.wikipedia.org/wiki/ISO_week_date
		* @example DateTime.local(2014, 11, 31).weekday //=> 4
		* @type {number}
		*/
		get weekday() {
			return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
		}
		/**
		* Returns true if this date is on a weekend according to the locale, false otherwise
		* @returns {boolean}
		*/
		get isWeekend() {
			return this.isValid && this.loc.getWeekendDays().includes(this.weekday);
		}
		/**
		* Get the day of the week according to the locale.
		* 1 is the first day of the week and 7 is the last day of the week.
		* If the locale assigns Sunday as the first day of the week, then a date which is a Sunday will return 1,
		* @returns {number}
		*/
		get localWeekday() {
			return this.isValid ? possiblyCachedLocalWeekData(this).weekday : NaN;
		}
		/**
		* Get the week number of the week year according to the locale. Different locales assign week numbers differently,
		* because the week can start on different days of the week (see localWeekday) and because a different number of days
		* is required for a week to count as the first week of a year.
		* @returns {number}
		*/
		get localWeekNumber() {
			return this.isValid ? possiblyCachedLocalWeekData(this).weekNumber : NaN;
		}
		/**
		* Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
		* differently, see localWeekNumber.
		* @returns {number}
		*/
		get localWeekYear() {
			return this.isValid ? possiblyCachedLocalWeekData(this).weekYear : NaN;
		}
		/**
		* Get the ordinal (meaning the day of the year)
		* @example DateTime.local(2017, 5, 25).ordinal //=> 145
		* @type {number|DateTime}
		*/
		get ordinal() {
			return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
		}
		/**
		* Get the human readable short month name, such as 'Oct'.
		* Defaults to the system's locale if no locale has been specified
		* @example DateTime.local(2017, 10, 30).monthShort //=> Oct
		* @type {string}
		*/
		get monthShort() {
			return this.isValid ? Info.months("short", { locObj: this.loc })[this.month - 1] : null;
		}
		/**
		* Get the human readable long month name, such as 'October'.
		* Defaults to the system's locale if no locale has been specified
		* @example DateTime.local(2017, 10, 30).monthLong //=> October
		* @type {string}
		*/
		get monthLong() {
			return this.isValid ? Info.months("long", { locObj: this.loc })[this.month - 1] : null;
		}
		/**
		* Get the human readable short weekday, such as 'Mon'.
		* Defaults to the system's locale if no locale has been specified
		* @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
		* @type {string}
		*/
		get weekdayShort() {
			return this.isValid ? Info.weekdays("short", { locObj: this.loc })[this.weekday - 1] : null;
		}
		/**
		* Get the human readable long weekday, such as 'Monday'.
		* Defaults to the system's locale if no locale has been specified
		* @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
		* @type {string}
		*/
		get weekdayLong() {
			return this.isValid ? Info.weekdays("long", { locObj: this.loc })[this.weekday - 1] : null;
		}
		/**
		* Get the UTC offset of this DateTime in minutes
		* @example DateTime.now().offset //=> -240
		* @example DateTime.utc().offset //=> 0
		* @type {number}
		*/
		get offset() {
			return this.isValid ? +this.o : NaN;
		}
		/**
		* Get the short human name for the zone's current offset, for example "EST" or "EDT".
		* Defaults to the system's locale if no locale has been specified
		* @type {string}
		*/
		get offsetNameShort() {
			if (this.isValid) return this.zone.offsetName(this.ts, {
				format: "short",
				locale: this.locale
			});
			else return null;
		}
		/**
		* Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
		* Defaults to the system's locale if no locale has been specified
		* @type {string}
		*/
		get offsetNameLong() {
			if (this.isValid) return this.zone.offsetName(this.ts, {
				format: "long",
				locale: this.locale
			});
			else return null;
		}
		/**
		* Get whether this zone's offset ever changes, as in a DST.
		* @type {boolean}
		*/
		get isOffsetFixed() {
			return this.isValid ? this.zone.isUniversal : null;
		}
		/**
		* Get whether the DateTime is in a DST.
		* @type {boolean}
		*/
		get isInDST() {
			if (this.isOffsetFixed) return false;
			else return this.offset > this.set({
				month: 1,
				day: 1
			}).offset || this.offset > this.set({ month: 5 }).offset;
		}
		/**
		* Get those DateTimes which have the same local time as this DateTime, but a different offset from UTC
		* in this DateTime's zone. During DST changes local time can be ambiguous, for example
		* `2023-10-29T02:30:00` in `Europe/Berlin` can have offset `+01:00` or `+02:00`.
		* This method will return both possible DateTimes if this DateTime's local time is ambiguous.
		* @returns {DateTime[]}
		*/
		getPossibleOffsets() {
			if (!this.isValid || this.isOffsetFixed) return [this];
			const dayMs = 864e5;
			const minuteMs = 6e4;
			const localTS = objToLocalTS(this.c);
			const oEarlier = this.zone.offset(localTS - dayMs);
			const oLater = this.zone.offset(localTS + dayMs);
			const o1 = this.zone.offset(localTS - oEarlier * minuteMs);
			const o2 = this.zone.offset(localTS - oLater * minuteMs);
			if (o1 === o2) return [this];
			const ts1 = localTS - o1 * minuteMs;
			const ts2 = localTS - o2 * minuteMs;
			const c1 = tsToObj(ts1, o1);
			const c2 = tsToObj(ts2, o2);
			if (c1.hour === c2.hour && c1.minute === c2.minute && c1.second === c2.second && c1.millisecond === c2.millisecond) return [clone(this, { ts: ts1 }), clone(this, { ts: ts2 })];
			return [this];
		}
		/**
		* Returns true if this DateTime is in a leap year, false otherwise
		* @example DateTime.local(2016).isInLeapYear //=> true
		* @example DateTime.local(2013).isInLeapYear //=> false
		* @type {boolean}
		*/
		get isInLeapYear() {
			return isLeapYear(this.year);
		}
		/**
		* Returns the number of days in this DateTime's month
		* @example DateTime.local(2016, 2).daysInMonth //=> 29
		* @example DateTime.local(2016, 3).daysInMonth //=> 31
		* @type {number}
		*/
		get daysInMonth() {
			return daysInMonth(this.year, this.month);
		}
		/**
		* Returns the number of days in this DateTime's year
		* @example DateTime.local(2016).daysInYear //=> 366
		* @example DateTime.local(2013).daysInYear //=> 365
		* @type {number}
		*/
		get daysInYear() {
			return this.isValid ? daysInYear(this.year) : NaN;
		}
		/**
		* Returns the number of weeks in this DateTime's year
		* @see https://en.wikipedia.org/wiki/ISO_week_date
		* @example DateTime.local(2004).weeksInWeekYear //=> 53
		* @example DateTime.local(2013).weeksInWeekYear //=> 52
		* @type {number}
		*/
		get weeksInWeekYear() {
			return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
		}
		/**
		* Returns the number of weeks in this DateTime's local week year
		* @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
		* @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
		* @type {number}
		*/
		get weeksInLocalWeekYear() {
			return this.isValid ? weeksInWeekYear(this.localWeekYear, this.loc.getMinDaysInFirstWeek(), this.loc.getStartOfWeek()) : NaN;
		}
		/**
		* Returns the resolved Intl options for this DateTime.
		* This is useful in understanding the behavior of formatting methods
		* @param {Object} opts - the same options as toLocaleString
		* @return {Object}
		*/
		resolvedLocaleOptions(opts = {}) {
			const { locale, numberingSystem, calendar } = Formatter.create(this.loc.clone(opts), opts).resolvedOptions(this);
			return {
				locale,
				numberingSystem,
				outputCalendar: calendar
			};
		}
		/**
		* "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
		*
		* Equivalent to {@link DateTime#setZone}('utc')
		* @param {number} [offset=0] - optionally, an offset from UTC in minutes
		* @param {Object} [opts={}] - options to pass to `setZone()`
		* @return {DateTime}
		*/
		toUTC(offset = 0, opts = {}) {
			return this.setZone(FixedOffsetZone.instance(offset), opts);
		}
		/**
		* "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
		*
		* Equivalent to `setZone('local')`
		* @return {DateTime}
		*/
		toLocal() {
			return this.setZone(Settings.defaultZone);
		}
		/**
		* "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
		*
		* By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
		* @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link DateTime#Zone} class.
		* @param {Object} opts - options
		* @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
		* @return {DateTime}
		*/
		setZone(zone, { keepLocalTime = false, keepCalendarTime = false } = {}) {
			zone = normalizeZone(zone, Settings.defaultZone);
			if (zone.equals(this.zone)) return this;
			else if (!zone.isValid) return DateTime.invalid(unsupportedZone(zone));
			else {
				let newTS = this.ts;
				if (keepLocalTime || keepCalendarTime) {
					const offsetGuess = zone.offset(this.ts);
					const asObj = this.toObject();
					[newTS] = objToTS(asObj, offsetGuess, zone);
				}
				return clone(this, {
					ts: newTS,
					zone
				});
			}
		}
		/**
		* "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
		* @param {Object} properties - the properties to set
		* @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
		* @return {DateTime}
		*/
		reconfigure({ locale, numberingSystem, outputCalendar } = {}) {
			const loc = this.loc.clone({
				locale,
				numberingSystem,
				outputCalendar
			});
			return clone(this, { loc });
		}
		/**
		* "Set" the locale. Returns a newly-constructed DateTime.
		* Just a convenient alias for reconfigure({ locale })
		* @example DateTime.local(2017, 5, 25).setLocale('en-GB')
		* @return {DateTime}
		*/
		setLocale(locale) {
			return this.reconfigure({ locale });
		}
		/**
		* "Set" the values of specified units. Returns a newly-constructed DateTime.
		* You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
		*
		* This method also supports setting locale-based week units, i.e. `localWeekday`, `localWeekNumber` and `localWeekYear`.
		* They cannot be mixed with ISO-week units like `weekday`.
		* @param {Object} values - a mapping of units to numbers
		* @example dt.set({ year: 2017 })
		* @example dt.set({ hour: 8, minute: 30 })
		* @example dt.set({ weekday: 5 })
		* @example dt.set({ year: 2005, ordinal: 234 })
		* @return {DateTime}
		*/
		set(values) {
			if (!this.isValid) return this;
			const normalized = normalizeObject(values, normalizeUnitWithLocalWeeks);
			const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, this.loc);
			const settingWeekStuff = !isUndefined(normalized.weekYear) || !isUndefined(normalized.weekNumber) || !isUndefined(normalized.weekday), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
			if ((containsGregor || containsOrdinal) && definiteWeekDef) throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
			if (containsGregorMD && containsOrdinal) throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
			let mixed;
			if (settingWeekStuff) mixed = weekToGregorian({
				...gregorianToWeek(this.c, minDaysInFirstWeek, startOfWeek),
				...normalized
			}, minDaysInFirstWeek, startOfWeek);
			else if (!isUndefined(normalized.ordinal)) mixed = ordinalToGregorian({
				...gregorianToOrdinal(this.c),
				...normalized
			});
			else {
				mixed = {
					...this.toObject(),
					...normalized
				};
				if (isUndefined(normalized.day)) mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
			}
			const [ts, o] = objToTS(mixed, this.o, this.zone);
			return clone(this, {
				ts,
				o
			});
		}
		/**
		* Add a period of time to this DateTime and return the resulting DateTime
		*
		* Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
		* @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
		* @example DateTime.now().plus(123) //~> in 123 milliseconds
		* @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
		* @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
		* @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
		* @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
		* @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
		* @return {DateTime}
		*/
		plus(duration) {
			if (!this.isValid) return this;
			const dur = Duration.fromDurationLike(duration);
			return clone(this, adjustTime(this, dur));
		}
		/**
		* Subtract a period of time to this DateTime and return the resulting DateTime
		* See {@link DateTime#plus}
		* @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
		@return {DateTime}
		*/
		minus(duration) {
			if (!this.isValid) return this;
			const dur = Duration.fromDurationLike(duration).negate();
			return clone(this, adjustTime(this, dur));
		}
		/**
		* "Set" this DateTime to the beginning of a unit of time.
		* @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
		* @param {Object} opts - options
		* @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
		* @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
		* @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
		* @example DateTime.local(2014, 3, 3).startOf('week').toISODate(); //=> '2014-03-03', weeks always start on Mondays
		* @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
		* @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
		* @return {DateTime}
		*/
		startOf(unit, { useLocaleWeeks = false } = {}) {
			if (!this.isValid) return this;
			const o = {}, normalizedUnit = Duration.normalizeUnit(unit);
			switch (normalizedUnit) {
				case "years": o.month = 1;
				case "quarters":
				case "months": o.day = 1;
				case "weeks":
				case "days": o.hour = 0;
				case "hours": o.minute = 0;
				case "minutes": o.second = 0;
				case "seconds":
					o.millisecond = 0;
					break;
			}
			if (normalizedUnit === "weeks") if (useLocaleWeeks) {
				const startOfWeek = this.loc.getStartOfWeek();
				const { weekday } = this;
				if (weekday < startOfWeek) o.weekNumber = this.weekNumber - 1;
				o.weekday = startOfWeek;
			} else o.weekday = 1;
			if (normalizedUnit === "quarters") o.month = (Math.ceil(this.month / 3) - 1) * 3 + 1;
			return this.set(o);
		}
		/**
		* "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
		* @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
		* @param {Object} opts - options
		* @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
		* @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
		* @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
		* @example DateTime.local(2014, 3, 3).endOf('week').toISO(); // => '2014-03-09T23:59:59.999-05:00', weeks start on Mondays
		* @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
		* @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
		* @return {DateTime}
		*/
		endOf(unit, opts) {
			return this.isValid ? this.plus({ [unit]: 1 }).startOf(unit, opts).minus(1) : this;
		}
		/**
		* Returns a string representation of this DateTime formatted according to the specified format string.
		* **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
		* Defaults to en-US if no locale has been specified, regardless of the system's locale.
		* @param {string} fmt - the format string
		* @param {Object} opts - opts to override the configuration options on this DateTime
		* @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
		* @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
		* @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
		* @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
		* @return {string}
		*/
		toFormat(fmt, opts = {}) {
			return this.isValid ? Formatter.create(this.loc.redefaultToEN(opts)).formatDateTimeFromString(this, fmt) : INVALID;
		}
		/**
		* Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
		* The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
		* of the DateTime in the assigned locale.
		* Defaults to the system's locale if no locale has been specified
		* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
		* @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
		* @param {Object} opts - opts to override the configuration options on this DateTime
		* @example DateTime.now().toLocaleString(); //=> 4/20/2017
		* @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
		* @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
		* @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
		* @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
		* @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
		* @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
		* @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
		* @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
		* @return {string}
		*/
		toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
			return this.isValid ? Formatter.create(this.loc.clone(opts), formatOpts).formatDateTime(this) : INVALID;
		}
		/**
		* Returns an array of format "parts", meaning individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
		* Defaults to the system's locale if no locale has been specified
		* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
		* @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
		* @example DateTime.now().toLocaleParts(); //=> [
		*                                   //=>   { type: 'day', value: '25' },
		*                                   //=>   { type: 'literal', value: '/' },
		*                                   //=>   { type: 'month', value: '05' },
		*                                   //=>   { type: 'literal', value: '/' },
		*                                   //=>   { type: 'year', value: '1982' }
		*                                   //=> ]
		*/
		toLocaleParts(opts = {}) {
			return this.isValid ? Formatter.create(this.loc.clone(opts), opts).formatDateTimeParts(this) : [];
		}
		/**
		* Returns an ISO 8601-compliant string representation of this DateTime
		* @param {Object} opts - options
		* @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
		* @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
		* @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
		* @param {boolean} [opts.extendedZone=false] - add the time zone format extension
		* @param {string} [opts.format='extended'] - choose between the basic and extended format
		* @param {string} [opts.precision='milliseconds'] - truncate output to desired presicion: 'years', 'months', 'days', 'hours', 'minutes', 'seconds' or 'milliseconds'. When precision and suppressSeconds or suppressMilliseconds are used together, precision sets the maximum unit shown in the output, however seconds or milliseconds will still be suppressed if they are 0.
		* @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
		* @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
		* @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
		* @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
		* @example DateTime.now().toISO({ precision: 'day' }) //=> '2017-04-22Z'
		* @example DateTime.now().toISO({ precision: 'minute' }) //=> '2017-04-22T20:47Z'
		* @return {string|null}
		*/
		toISO({ format = "extended", suppressSeconds = false, suppressMilliseconds = false, includeOffset = true, extendedZone = false, precision = "milliseconds" } = {}) {
			if (!this.isValid) return null;
			precision = normalizeUnit(precision);
			const ext = format === "extended";
			let c = toISODate(this, ext, precision);
			if (orderedUnits.indexOf(precision) >= 3) c += "T";
			c += toISOTime(this, ext, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone, precision);
			return c;
		}
		/**
		* Returns an ISO 8601-compliant string representation of this DateTime's date component
		* @param {Object} opts - options
		* @param {string} [opts.format='extended'] - choose between the basic and extended format
		* @param {string} [opts.precision='day'] - truncate output to desired precision: 'years', 'months', or 'days'.
		* @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
		* @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
		* @example DateTime.utc(1982, 5, 25).toISODate({ precision: 'month' }) //=> '1982-05'
		* @return {string|null}
		*/
		toISODate({ format = "extended", precision = "day" } = {}) {
			if (!this.isValid) return null;
			return toISODate(this, format === "extended", normalizeUnit(precision));
		}
		/**
		* Returns an ISO 8601-compliant string representation of this DateTime's week date
		* @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
		* @return {string}
		*/
		toISOWeekDate() {
			return toTechFormat(this, "kkkk-'W'WW-c");
		}
		/**
		* Returns an ISO 8601-compliant string representation of this DateTime's time component
		* @param {Object} opts - options
		* @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
		* @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
		* @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
		* @param {boolean} [opts.extendedZone=true] - add the time zone format extension
		* @param {boolean} [opts.includePrefix=false] - include the `T` prefix
		* @param {string} [opts.format='extended'] - choose between the basic and extended format
		* @param {string} [opts.precision='milliseconds'] - truncate output to desired presicion: 'hours', 'minutes', 'seconds' or 'milliseconds'. When precision and suppressSeconds or suppressMilliseconds are used together, precision sets the maximum unit shown in the output, however seconds or milliseconds will still be suppressed if they are 0.
		* @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
		* @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
		* @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
		* @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
		* @example DateTime.utc().set({ hour: 7, minute: 34, second: 56 }).toISOTime({ precision: 'minute' }) //=> '07:34Z'
		* @return {string}
		*/
		toISOTime({ suppressMilliseconds = false, suppressSeconds = false, includeOffset = true, includePrefix = false, extendedZone = false, format = "extended", precision = "milliseconds" } = {}) {
			if (!this.isValid) return null;
			precision = normalizeUnit(precision);
			return (includePrefix && orderedUnits.indexOf(precision) >= 3 ? "T" : "") + toISOTime(this, format === "extended", suppressSeconds, suppressMilliseconds, includeOffset, extendedZone, precision);
		}
		/**
		* Returns an RFC 2822-compatible string representation of this DateTime
		* @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
		* @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
		* @return {string}
		*/
		toRFC2822() {
			return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
		}
		/**
		* Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT.
		* Specifically, the string conforms to RFC 1123.
		* @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
		* @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
		* @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
		* @return {string}
		*/
		toHTTP() {
			return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
		}
		/**
		* Returns a string representation of this DateTime appropriate for use in SQL Date
		* @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
		* @return {string|null}
		*/
		toSQLDate() {
			if (!this.isValid) return null;
			return toISODate(this, true);
		}
		/**
		* Returns a string representation of this DateTime appropriate for use in SQL Time
		* @param {Object} opts - options
		* @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
		* @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
		* @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
		* @example DateTime.utc().toSQL() //=> '05:15:16.345'
		* @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
		* @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
		* @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
		* @return {string}
		*/
		toSQLTime({ includeOffset = true, includeZone = false, includeOffsetSpace = true } = {}) {
			let fmt = "HH:mm:ss.SSS";
			if (includeZone || includeOffset) {
				if (includeOffsetSpace) fmt += " ";
				if (includeZone) fmt += "z";
				else if (includeOffset) fmt += "ZZ";
			}
			return toTechFormat(this, fmt, true);
		}
		/**
		* Returns a string representation of this DateTime appropriate for use in SQL DateTime
		* @param {Object} opts - options
		* @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
		* @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
		* @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
		* @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
		* @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
		* @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
		* @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
		* @return {string}
		*/
		toSQL(opts = {}) {
			if (!this.isValid) return null;
			return `${this.toSQLDate()} ${this.toSQLTime(opts)}`;
		}
		/**
		* Returns a string representation of this DateTime appropriate for debugging
		* @return {string}
		*/
		toString() {
			return this.isValid ? this.toISO() : INVALID;
		}
		/**
		* Returns a string representation of this DateTime appropriate for the REPL.
		* @return {string}
		*/
		[Symbol.for("nodejs.util.inspect.custom")]() {
			if (this.isValid) return `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`;
			else return `DateTime { Invalid, reason: ${this.invalidReason} }`;
		}
		/**
		* Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
		* @return {number}
		*/
		valueOf() {
			return this.toMillis();
		}
		/**
		* Returns the epoch milliseconds of this DateTime.
		* @return {number}
		*/
		toMillis() {
			return this.isValid ? this.ts : NaN;
		}
		/**
		* Returns the epoch seconds (including milliseconds in the fractional part) of this DateTime.
		* @return {number}
		*/
		toSeconds() {
			return this.isValid ? this.ts / 1e3 : NaN;
		}
		/**
		* Returns the epoch seconds (as a whole number) of this DateTime.
		* @return {number}
		*/
		toUnixInteger() {
			return this.isValid ? Math.floor(this.ts / 1e3) : NaN;
		}
		/**
		* Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
		* @return {string}
		*/
		toJSON() {
			return this.toISO();
		}
		/**
		* Returns a BSON serializable equivalent to this DateTime.
		* @return {Date}
		*/
		toBSON() {
			return this.toJSDate();
		}
		/**
		* Returns a JavaScript object with this DateTime's year, month, day, and so on.
		* @param opts - options for generating the object
		* @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
		* @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
		* @return {Object}
		*/
		toObject(opts = {}) {
			if (!this.isValid) return {};
			const base = { ...this.c };
			if (opts.includeConfig) {
				base.outputCalendar = this.outputCalendar;
				base.numberingSystem = this.loc.numberingSystem;
				base.locale = this.loc.locale;
			}
			return base;
		}
		/**
		* Returns a JavaScript Date equivalent to this DateTime.
		* @return {Date}
		*/
		toJSDate() {
			return new Date(this.isValid ? this.ts : NaN);
		}
		/**
		* Return the difference between two DateTimes as a Duration.
		* @param {DateTime} otherDateTime - the DateTime to compare this one to
		* @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
		* @param {Object} opts - options that affect the creation of the Duration
		* @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
		* @example
		* var i1 = DateTime.fromISO('1982-05-25T09:45'),
		*     i2 = DateTime.fromISO('1983-10-14T10:30');
		* i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
		* i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
		* i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
		* i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
		* @return {Duration}
		*/
		diff(otherDateTime, unit = "milliseconds", opts = {}) {
			if (!this.isValid || !otherDateTime.isValid) return Duration.invalid("created by diffing an invalid DateTime");
			const durOpts = {
				locale: this.locale,
				numberingSystem: this.numberingSystem,
				...opts
			};
			const units = maybeArray(unit).map(Duration.normalizeUnit), otherIsLater = otherDateTime.valueOf() > this.valueOf(), diffed = diff(otherIsLater ? this : otherDateTime, otherIsLater ? otherDateTime : this, units, durOpts);
			return otherIsLater ? diffed.negate() : diffed;
		}
		/**
		* Return the difference between this DateTime and right now.
		* See {@link DateTime#diff}
		* @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
		* @param {Object} opts - options that affect the creation of the Duration
		* @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
		* @return {Duration}
		*/
		diffNow(unit = "milliseconds", opts = {}) {
			return this.diff(DateTime.now(), unit, opts);
		}
		/**
		* Return an Interval spanning between this DateTime and another DateTime
		* @param {DateTime} otherDateTime - the other end point of the Interval
		* @return {Interval|DateTime}
		*/
		until(otherDateTime) {
			return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
		}
		/**
		* Return whether this DateTime is in the same unit of time as another DateTime.
		* Higher-order units must also be identical for this function to return `true`.
		* Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
		* @param {DateTime} otherDateTime - the other DateTime
		* @param {string} unit - the unit of time to check sameness on
		* @param {Object} opts - options
		* @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; only the locale of this DateTime is used
		* @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
		* @return {boolean}
		*/
		hasSame(otherDateTime, unit, opts) {
			if (!this.isValid) return false;
			const inputMs = otherDateTime.valueOf();
			const adjustedToZone = this.setZone(otherDateTime.zone, { keepLocalTime: true });
			return adjustedToZone.startOf(unit, opts) <= inputMs && inputMs <= adjustedToZone.endOf(unit, opts);
		}
		/**
		* Equality check
		* Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
		* To compare just the millisecond values, use `+dt1 === +dt2`.
		* @param {DateTime} other - the other DateTime
		* @return {boolean}
		*/
		equals(other) {
			return this.isValid && other.isValid && this.valueOf() === other.valueOf() && this.zone.equals(other.zone) && this.loc.equals(other.loc);
		}
		/**
		* Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
		* platform supports Intl.RelativeTimeFormat. Rounds towards zero by default.
		* @param {Object} options - options that affect the output
		* @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
		* @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
		* @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
		* @param {boolean} [options.round=true] - whether to round the numbers in the output.
		* @param {string} [options.rounding="trunc"] - rounding method to use when rounding the numbers in the output. Can be "trunc" (toward zero), "expand" (away from zero), "round", "floor", or "ceil".
		* @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
		* @param {string} options.locale - override the locale of this DateTime
		* @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
		* @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
		* @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
		* @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
		* @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
		* @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
		* @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
		*/
		toRelative(options = {}) {
			if (!this.isValid) return null;
			const base = options.base || DateTime.fromObject({}, { zone: this.zone }), padding = options.padding ? this < base ? -options.padding : options.padding : 0;
			let units = [
				"years",
				"months",
				"days",
				"hours",
				"minutes",
				"seconds"
			];
			let unit = options.unit;
			if (Array.isArray(options.unit)) {
				units = options.unit;
				unit = void 0;
			}
			return diffRelative(base, this.plus(padding), {
				...options,
				numeric: "always",
				units,
				unit
			});
		}
		/**
		* Returns a string representation of this date relative to today, such as "yesterday" or "next month".
		* Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
		* @param {Object} options - options that affect the output
		* @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
		* @param {string} options.locale - override the locale of this DateTime
		* @param {string} options.unit - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
		* @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
		* @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
		* @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
		* @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
		* @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
		*/
		toRelativeCalendar(options = {}) {
			if (!this.isValid) return null;
			return diffRelative(options.base || DateTime.fromObject({}, { zone: this.zone }), this, {
				...options,
				numeric: "auto",
				units: [
					"years",
					"months",
					"days"
				],
				calendary: true
			});
		}
		/**
		* Return the min of several date times
		* @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
		* @return {DateTime} the min DateTime, or undefined if called with no argument
		*/
		static min(...dateTimes) {
			if (!dateTimes.every(DateTime.isDateTime)) throw new InvalidArgumentError("min requires all arguments be DateTimes");
			return bestBy(dateTimes, (i) => i.valueOf(), Math.min);
		}
		/**
		* Return the max of several date times
		* @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
		* @return {DateTime} the max DateTime, or undefined if called with no argument
		*/
		static max(...dateTimes) {
			if (!dateTimes.every(DateTime.isDateTime)) throw new InvalidArgumentError("max requires all arguments be DateTimes");
			return bestBy(dateTimes, (i) => i.valueOf(), Math.max);
		}
		/**
		* Explain how a string would be parsed by fromFormat()
		* @param {string} text - the string to parse
		* @param {string} fmt - the format the string is expected to be in (see description)
		* @param {Object} options - options taken by fromFormat()
		* @return {Object}
		*/
		static fromFormatExplain(text, fmt, options = {}) {
			const { locale = null, numberingSystem = null } = options;
			return explainFromTokens(Locale.fromOpts({
				locale,
				numberingSystem,
				defaultToEN: true
			}), text, fmt);
		}
		/**
		* @deprecated use fromFormatExplain instead
		*/
		static fromStringExplain(text, fmt, options = {}) {
			return DateTime.fromFormatExplain(text, fmt, options);
		}
		/**
		* Build a parser for `fmt` using the given locale. This parser can be passed
		* to {@link DateTime.fromFormatParser} to a parse a date in this format. This
		* can be used to optimize cases where many dates need to be parsed in a
		* specific format.
		*
		* @param {String} fmt - the format the string is expected to be in (see
		* description)
		* @param {Object} options - options used to set locale and numberingSystem
		* for parser
		* @returns {TokenParser} - opaque object to be used
		*/
		static buildFormatParser(fmt, options = {}) {
			const { locale = null, numberingSystem = null } = options;
			return new TokenParser(Locale.fromOpts({
				locale,
				numberingSystem,
				defaultToEN: true
			}), fmt);
		}
		/**
		* Create a DateTime from an input string and format parser.
		*
		* The format parser must have been created with the same locale as this call.
		*
		* @param {String} text - the string to parse
		* @param {TokenParser} formatParser - parser from {@link DateTime.buildFormatParser}
		* @param {Object} opts - options taken by fromFormat()
		* @returns {DateTime}
		*/
		static fromFormatParser(text, formatParser, opts = {}) {
			if (isUndefined(text) || isUndefined(formatParser)) throw new InvalidArgumentError("fromFormatParser requires an input string and a format parser");
			const { locale = null, numberingSystem = null } = opts, localeToUse = Locale.fromOpts({
				locale,
				numberingSystem,
				defaultToEN: true
			});
			if (!localeToUse.equals(formatParser.locale)) throw new InvalidArgumentError(`fromFormatParser called with a locale of ${localeToUse}, but the format parser was created for ${formatParser.locale}`);
			const { result, zone, specificOffset, invalidReason } = formatParser.explainFromTokens(text);
			if (invalidReason) return DateTime.invalid(invalidReason);
			else return parseDataToDateTime(result, zone, opts, `format ${formatParser.format}`, text, specificOffset);
		}
		/**
		* {@link DateTime#toLocaleString} format like 10/14/1983
		* @type {Object}
		*/
		static get DATE_SHORT() {
			return DATE_SHORT;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
		* @type {Object}
		*/
		static get DATE_MED() {
			return DATE_MED;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
		* @type {Object}
		*/
		static get DATE_MED_WITH_WEEKDAY() {
			return DATE_MED_WITH_WEEKDAY;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'October 14, 1983'
		* @type {Object}
		*/
		static get DATE_FULL() {
			return DATE_FULL;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
		* @type {Object}
		*/
		static get DATE_HUGE() {
			return DATE_HUGE;
		}
		/**
		* {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get TIME_SIMPLE() {
			return TIME_SIMPLE;
		}
		/**
		* {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get TIME_WITH_SECONDS() {
			return TIME_WITH_SECONDS;
		}
		/**
		* {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get TIME_WITH_SHORT_OFFSET() {
			return TIME_WITH_SHORT_OFFSET;
		}
		/**
		* {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get TIME_WITH_LONG_OFFSET() {
			return TIME_WITH_LONG_OFFSET;
		}
		/**
		* {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
		* @type {Object}
		*/
		static get TIME_24_SIMPLE() {
			return TIME_24_SIMPLE;
		}
		/**
		* {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
		* @type {Object}
		*/
		static get TIME_24_WITH_SECONDS() {
			return TIME_24_WITH_SECONDS;
		}
		/**
		* {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
		* @type {Object}
		*/
		static get TIME_24_WITH_SHORT_OFFSET() {
			return TIME_24_WITH_SHORT_OFFSET;
		}
		/**
		* {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
		* @type {Object}
		*/
		static get TIME_24_WITH_LONG_OFFSET() {
			return TIME_24_WITH_LONG_OFFSET;
		}
		/**
		* {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_SHORT() {
			return DATETIME_SHORT;
		}
		/**
		* {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_SHORT_WITH_SECONDS() {
			return DATETIME_SHORT_WITH_SECONDS;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_MED() {
			return DATETIME_MED;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_MED_WITH_SECONDS() {
			return DATETIME_MED_WITH_SECONDS;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_MED_WITH_WEEKDAY() {
			return DATETIME_MED_WITH_WEEKDAY;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_FULL() {
			return DATETIME_FULL;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_FULL_WITH_SECONDS() {
			return DATETIME_FULL_WITH_SECONDS;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_HUGE() {
			return DATETIME_HUGE;
		}
		/**
		* {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
		* @type {Object}
		*/
		static get DATETIME_HUGE_WITH_SECONDS() {
			return DATETIME_HUGE_WITH_SECONDS;
		}
	};
	/**
	* @private
	*/
	function friendlyDateTime(dateTimeish) {
		if (DateTime.isDateTime(dateTimeish)) return dateTimeish;
		else if (dateTimeish && dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) return DateTime.fromJSDate(dateTimeish);
		else if (dateTimeish && typeof dateTimeish === "object") return DateTime.fromObject(dateTimeish);
		else throw new InvalidArgumentError(`Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`);
	}
	const VERSION = "3.7.2";
	exports.DateTime = DateTime;
	exports.Duration = Duration;
	exports.FixedOffsetZone = FixedOffsetZone;
	exports.IANAZone = IANAZone;
	exports.Info = Info;
	exports.Interval = Interval;
	exports.InvalidZone = InvalidZone;
	exports.Settings = Settings;
	exports.SystemZone = SystemZone;
	exports.VERSION = VERSION;
	exports.Zone = Zone;
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/CronDate.js
var require_CronDate = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronDate = exports.DAYS_IN_MONTH = exports.DateMathOp = exports.TimeUnit = void 0;
	const luxon_1 = require_luxon();
	var TimeUnit;
	(function(TimeUnit) {
		TimeUnit["Second"] = "Second";
		TimeUnit["Minute"] = "Minute";
		TimeUnit["Hour"] = "Hour";
		TimeUnit["Day"] = "Day";
		TimeUnit["Month"] = "Month";
		TimeUnit["Year"] = "Year";
	})(TimeUnit || (exports.TimeUnit = TimeUnit = {}));
	var DateMathOp;
	(function(DateMathOp) {
		DateMathOp["Add"] = "Add";
		DateMathOp["Subtract"] = "Subtract";
	})(DateMathOp || (exports.DateMathOp = DateMathOp = {}));
	exports.DAYS_IN_MONTH = Object.freeze([
		31,
		29,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	]);
	/**
	* CronDate class that wraps the Luxon DateTime object to provide
	* a consistent API for working with dates and times in the context of cron.
	*/
	var CronDate = class CronDate {
		#date;
		#dstStart = null;
		#dstEnd = null;
		/**
		* Constructs a new CronDate instance.
		* @param {CronDate | Date | number | string} [timestamp] - The timestamp to initialize the CronDate with.
		* @param {string} [tz] - The timezone to use for the CronDate.
		*/
		constructor(timestamp, tz) {
			const dateOpts = { zone: tz };
			if (!timestamp) this.#date = luxon_1.DateTime.local();
			else if (timestamp instanceof CronDate) {
				this.#date = timestamp.#date;
				this.#dstStart = timestamp.#dstStart;
				this.#dstEnd = timestamp.#dstEnd;
			} else if (timestamp instanceof Date) this.#date = luxon_1.DateTime.fromJSDate(timestamp, dateOpts);
			else if (typeof timestamp === "number") this.#date = luxon_1.DateTime.fromMillis(timestamp, dateOpts);
			else {
				this.#date = luxon_1.DateTime.fromISO(timestamp, dateOpts);
				this.#date.isValid || (this.#date = luxon_1.DateTime.fromRFC2822(timestamp, dateOpts));
				this.#date.isValid || (this.#date = luxon_1.DateTime.fromSQL(timestamp, dateOpts));
				this.#date.isValid || (this.#date = luxon_1.DateTime.fromFormat(timestamp, "EEE, d MMM yyyy HH:mm:ss", dateOpts));
			}
			if (!this.#date.isValid) throw new Error(`CronDate: unhandled timestamp: ${timestamp}`);
			if (tz && tz !== this.#date.zoneName) this.#date = this.#date.setZone(tz);
		}
		/**
		* Determines if the given year is a leap year.
		* @param {number} year - The year to check
		* @returns {boolean} - True if the year is a leap year, false otherwise
		* @private
		*/
		static #isLeapYear(year) {
			return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
		}
		/**
		* Returns daylight savings start time.
		* @returns {number | null}
		*/
		get dstStart() {
			return this.#dstStart;
		}
		/**
		* Sets daylight savings start time.
		* @param {number | null} value
		*/
		set dstStart(value) {
			this.#dstStart = value;
		}
		/**
		* Returns daylight savings end time.
		* @returns {number | null}
		*/
		get dstEnd() {
			return this.#dstEnd;
		}
		/**
		* Sets daylight savings end time.
		* @param {number | null} value
		*/
		set dstEnd(value) {
			this.#dstEnd = value;
		}
		/**
		* Adds one year to the current CronDate.
		*/
		addYear() {
			this.#date = this.#date.plus({ years: 1 });
		}
		/**
		* Adds one month to the current CronDate.
		*/
		addMonth() {
			this.#date = this.#date.plus({ months: 1 }).startOf("month");
		}
		/**
		* Adds one day to the current CronDate.
		*/
		addDay() {
			this.#date = this.#date.plus({ days: 1 }).startOf("day");
		}
		/**
		* Adds one hour to the current CronDate.
		*/
		addHour() {
			this.#date = this.#date.plus({ hours: 1 }).startOf("hour");
		}
		/**
		* Adds one minute to the current CronDate.
		*/
		addMinute() {
			this.#date = this.#date.plus({ minutes: 1 }).startOf("minute");
		}
		/**
		* Adds one second to the current CronDate.
		*/
		addSecond() {
			this.#date = this.#date.plus({ seconds: 1 });
		}
		/**
		* Subtracts one year from the current CronDate.
		*/
		subtractYear() {
			this.#date = this.#date.minus({ years: 1 });
		}
		/**
		* Subtracts one month from the current CronDate.
		* If the month is 1, it will subtract one year instead.
		*/
		subtractMonth() {
			this.#date = this.#date.minus({ months: 1 }).endOf("month").startOf("second");
		}
		/**
		* Subtracts one day from the current CronDate.
		* If the day is 1, it will subtract one month instead.
		*/
		subtractDay() {
			this.#date = this.#date.minus({ days: 1 }).endOf("day").startOf("second");
		}
		/**
		* Subtracts one hour from the current CronDate.
		* If the hour is 0, it will subtract one day instead.
		*/
		subtractHour() {
			this.#date = this.#date.minus({ hours: 1 }).endOf("hour").startOf("second");
		}
		/**
		* Subtracts one minute from the current CronDate.
		* If the minute is 0, it will subtract one hour instead.
		*/
		subtractMinute() {
			this.#date = this.#date.minus({ minutes: 1 }).endOf("minute").startOf("second");
		}
		/**
		* Subtracts one second from the current CronDate.
		* If the second is 0, it will subtract one minute instead.
		*/
		subtractSecond() {
			this.#date = this.#date.minus({ seconds: 1 });
		}
		/**
		* Adds a unit of time to the current CronDate.
		* @param {TimeUnit} unit
		*/
		addUnit(unit) {
			switch (unit) {
				case TimeUnit.Year: return this.addYear();
				case TimeUnit.Month: return this.addMonth();
				case TimeUnit.Day: return this.addDay();
				case TimeUnit.Hour: return this.addHour();
				case TimeUnit.Minute: return this.addMinute();
				case TimeUnit.Second: return this.addSecond();
			}
		}
		/**
		* Subtracts a unit of time from the current CronDate.
		* @param {TimeUnit} unit
		*/
		subtractUnit(unit) {
			switch (unit) {
				case TimeUnit.Year: return this.subtractYear();
				case TimeUnit.Month: return this.subtractMonth();
				case TimeUnit.Day: return this.subtractDay();
				case TimeUnit.Hour: return this.subtractHour();
				case TimeUnit.Minute: return this.subtractMinute();
				case TimeUnit.Second: return this.subtractSecond();
			}
		}
		/**
		* Handles a math operation.
		* @param {DateMathOp} verb - {'add' | 'subtract'}
		* @param {TimeUnit} unit - {'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'}
		*/
		invokeDateOperation(verb, unit) {
			if (verb === DateMathOp.Add) {
				this.addUnit(unit);
				return;
			}
			if (verb === DateMathOp.Subtract) {
				this.subtractUnit(unit);
				return;
			}
			/* istanbul ignore next - this would only happen if an end user call the handleMathOp with an invalid verb */
			throw new Error(`Invalid verb: ${verb}`);
		}
		/**
		* Returns the day.
		* @returns {number}
		*/
		getDate() {
			return this.#date.day;
		}
		/**
		* Returns the year.
		* @returns {number}
		*/
		getFullYear() {
			return this.#date.year;
		}
		/**
		* Returns the day of the week.
		* @returns {number}
		*/
		getDay() {
			const weekday = this.#date.weekday;
			return weekday === 7 ? 0 : weekday;
		}
		/**
		* Returns the month.
		* @returns {number}
		*/
		getMonth() {
			return this.#date.month - 1;
		}
		/**
		* Returns the hour.
		* @returns {number}
		*/
		getHours() {
			return this.#date.hour;
		}
		/**
		* Returns the minutes.
		* @returns {number}
		*/
		getMinutes() {
			return this.#date.minute;
		}
		/**
		* Returns the seconds.
		* @returns {number}
		*/
		getSeconds() {
			return this.#date.second;
		}
		/**
		* Returns the milliseconds.
		* @returns {number}
		*/
		getMilliseconds() {
			return this.#date.millisecond;
		}
		/**
		* Returns the timezone offset from UTC in minutes (e.g. UTC+2 => 120).
		* Useful for detecting DST transition days.
		*
		* @returns {number} UTC offset in minutes
		*/
		getUTCOffset() {
			return this.#date.offset;
		}
		/**
		* Sets the time to the start of the day (00:00:00.000) in the current timezone.
		*/
		setStartOfDay() {
			this.#date = this.#date.startOf("day");
		}
		/**
		* Sets the time to the end of the day (23:59:59.999) in the current timezone.
		*/
		setEndOfDay() {
			this.#date = this.#date.endOf("day");
		}
		/**
		* Returns the time.
		* @returns {number}
		*/
		getTime() {
			return this.#date.valueOf();
		}
		/**
		* Returns the UTC day.
		* @returns {number}
		*/
		getUTCDate() {
			return this.#getUTC().day;
		}
		/**
		* Returns the UTC year.
		* @returns {number}
		*/
		getUTCFullYear() {
			return this.#getUTC().year;
		}
		/**
		* Returns the UTC day of the week.
		* @returns {number}
		*/
		getUTCDay() {
			const weekday = this.#getUTC().weekday;
			return weekday === 7 ? 0 : weekday;
		}
		/**
		* Returns the UTC month.
		* @returns {number}
		*/
		getUTCMonth() {
			return this.#getUTC().month - 1;
		}
		/**
		* Returns the UTC hour.
		* @returns {number}
		*/
		getUTCHours() {
			return this.#getUTC().hour;
		}
		/**
		* Returns the UTC minutes.
		* @returns {number}
		*/
		getUTCMinutes() {
			return this.#getUTC().minute;
		}
		/**
		* Returns the UTC seconds.
		* @returns {number}
		*/
		getUTCSeconds() {
			return this.#getUTC().second;
		}
		/**
		* Returns the UTC milliseconds.
		* @returns {string | null}
		*/
		toISOString() {
			return this.#date.toUTC().toISO();
		}
		/**
		* Returns the date as a JSON string.
		* @returns {string | null}
		*/
		toJSON() {
			return this.#date.toJSON();
		}
		/**
		* Sets the day.
		* @param d
		*/
		setDate(d) {
			this.#date = this.#date.set({ day: d });
		}
		/**
		* Sets the year.
		* @param y
		*/
		setFullYear(y) {
			this.#date = this.#date.set({ year: y });
		}
		/**
		* Sets the day of the week.
		* @param d
		*/
		setDay(d) {
			this.#date = this.#date.set({ weekday: d });
		}
		/**
		* Sets the month.
		* @param m
		*/
		setMonth(m) {
			this.#date = this.#date.set({ month: m + 1 });
		}
		/**
		* Sets the hour.
		* @param h
		*/
		setHours(h) {
			this.#date = this.#date.set({ hour: h });
		}
		/**
		* Sets the minutes.
		* @param m
		*/
		setMinutes(m) {
			this.#date = this.#date.set({ minute: m });
		}
		/**
		* Sets the seconds.
		* @param s
		*/
		setSeconds(s) {
			this.#date = this.#date.set({ second: s });
		}
		/**
		* Sets the milliseconds.
		* @param s
		*/
		setMilliseconds(s) {
			this.#date = this.#date.set({ millisecond: s });
		}
		/**
		* Returns the date as a string.
		* @returns {string}
		*/
		toString() {
			return this.toDate().toString();
		}
		/**
		* Returns the date as a Date object.
		* @returns {Date}
		*/
		toDate() {
			return this.#date.toJSDate();
		}
		/**
		* Returns true if the day is the last day of the month.
		* @returns {boolean}
		*/
		isLastDayOfMonth() {
			const { day, month } = this.#date;
			if (month === 2) {
				const isLeap = CronDate.#isLeapYear(this.#date.year);
				return day === exports.DAYS_IN_MONTH[month - 1] - (isLeap ? 0 : 1);
			}
			return day === exports.DAYS_IN_MONTH[month - 1];
		}
		/**
		* Returns true if the day is the last weekday of the month.
		* @returns {boolean}
		*/
		isLastWeekdayOfMonth() {
			const { day, month } = this.#date;
			let lastDay;
			if (month === 2) lastDay = exports.DAYS_IN_MONTH[month - 1] - (CronDate.#isLeapYear(this.#date.year) ? 0 : 1);
			else lastDay = exports.DAYS_IN_MONTH[month - 1];
			return day > lastDay - 7;
		}
		/**
		* Primarily for internal use.
		* @param {DateMathOp} op - The operation to perform.
		* @param {TimeUnit} unit - The unit of time to use.
		* @param {number} [hoursLength] - The length of the hours. Required when unit is not month or day.
		*/
		applyDateOperation(op, unit, hoursLength) {
			if (unit === TimeUnit.Month || unit === TimeUnit.Day) {
				this.invokeDateOperation(op, unit);
				return;
			}
			const previousHour = this.getHours();
			this.invokeDateOperation(op, unit);
			const currentHour = this.getHours();
			const diff = currentHour - previousHour;
			if (diff === 2) {
				if (hoursLength !== 24) this.dstStart = previousHour + 1;
			} else if (diff === 0 && this.getMinutes() === 0 && this.getSeconds() === 0) {
				if (hoursLength !== 24) this.dstEnd = currentHour;
			}
		}
		/**
		* Returns the UTC date.
		* @private
		* @returns {DateTime}
		*/
		#getUTC() {
			return this.#date.toUTC();
		}
	};
	exports.CronDate = CronDate;
	exports.default = CronDate;
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/CronMonth.js
var require_CronMonth = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronMonth = void 0;
	const CronDate_1 = require_CronDate();
	const CronField_1 = require_CronField();
	const MIN_MONTH = 1;
	const MAX_MONTH = 12;
	const MONTH_CHARS = Object.freeze([]);
	/**
	* Represents the "day of the month" field within a cron expression.
	* @class CronDayOfMonth
	* @extends CronField
	*/
	var CronMonth = class extends CronField_1.CronField {
		static get min() {
			return MIN_MONTH;
		}
		static get max() {
			return MAX_MONTH;
		}
		static get chars() {
			return MONTH_CHARS;
		}
		static get daysInMonth() {
			return CronDate_1.DAYS_IN_MONTH;
		}
		/**
		* CronDayOfMonth constructor. Initializes the "day of the month" field with the provided values.
		* @param {MonthRange[]} values - Values for the "day of the month" field
		* @param {CronFieldOptions} [options] - Options provided by the parser
		*/
		constructor(values, options) {
			super(values, options);
			this.validate();
		}
		/**
		* Returns an array of allowed values for the "day of the month" field.
		* @returns {MonthRange[]}
		*/
		get values() {
			return super.values;
		}
	};
	exports.CronMonth = CronMonth;
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/CronSecond.js
var require_CronSecond = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronSecond = void 0;
	const CronField_1 = require_CronField();
	const MIN_SECOND = 0;
	const MAX_SECOND = 59;
	const SECOND_CHARS = Object.freeze([]);
	/**
	* Represents the "second" field within a cron expression.
	* @class CronSecond
	* @extends CronField
	*/
	var CronSecond = class extends CronField_1.CronField {
		static get min() {
			return MIN_SECOND;
		}
		static get max() {
			return MAX_SECOND;
		}
		static get chars() {
			return SECOND_CHARS;
		}
		/**
		* CronSecond constructor. Initializes the "second" field with the provided values.
		* @param {SixtyRange[]} values - Values for the "second" field
		* @param {CronFieldOptions} [options] - Options provided by the parser
		*/
		constructor(values, options) {
			super(values, options);
			this.validate();
		}
		/**
		* Returns an array of allowed values for the "second" field.
		* @returns {SixtyRange[]}
		*/
		get values() {
			return super.values;
		}
	};
	exports.CronSecond = CronSecond;
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/fields/index.js
var require_fields = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$2) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$2, p)) __createBinding(exports$2, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(require_types(), exports);
	__exportStar(require_CronDayOfMonth(), exports);
	__exportStar(require_CronDayOfWeek(), exports);
	__exportStar(require_CronField(), exports);
	__exportStar(require_CronHour(), exports);
	__exportStar(require_CronMinute(), exports);
	__exportStar(require_CronMonth(), exports);
	__exportStar(require_CronSecond(), exports);
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/CronFieldCollection.js
var require_CronFieldCollection = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronFieldCollection = void 0;
	const fields_1 = require_fields();
	exports.CronFieldCollection = class CronFieldCollection {
		#second;
		#minute;
		#hour;
		#dayOfMonth;
		#month;
		#dayOfWeek;
		/**
		* Creates a new CronFieldCollection instance by partially overriding fields from an existing one.
		* @param {CronFieldCollection} base - The base CronFieldCollection to copy fields from
		* @param {CronFieldOverride} fields - The fields to override, can be CronField instances or raw values
		* @returns {CronFieldCollection} A new CronFieldCollection instance
		* @example
		* const base = new CronFieldCollection({
		*   second: new CronSecond([0]),
		*   minute: new CronMinute([0]),
		*   hour: new CronHour([12]),
		*   dayOfMonth: new CronDayOfMonth([1]),
		*   month: new CronMonth([1]),
		*   dayOfWeek: new CronDayOfWeek([1])
		* });
		*
		* // Using CronField instances
		* const modified1 = CronFieldCollection.from(base, {
		*   hour: new CronHour([15]),
		*   minute: new CronMinute([30])
		* });
		*
		* // Using raw values
		* const modified2 = CronFieldCollection.from(base, {
		*   hour: [15],        // Will create new CronHour
		*   minute: [30]       // Will create new CronMinute
		* });
		*/
		static from(base, fields) {
			return new CronFieldCollection({
				second: this.resolveField(fields_1.CronSecond, base.second, fields.second),
				minute: this.resolveField(fields_1.CronMinute, base.minute, fields.minute),
				hour: this.resolveField(fields_1.CronHour, base.hour, fields.hour),
				dayOfMonth: this.resolveField(fields_1.CronDayOfMonth, base.dayOfMonth, fields.dayOfMonth),
				month: this.resolveField(fields_1.CronMonth, base.month, fields.month),
				dayOfWeek: this.resolveField(fields_1.CronDayOfWeek, base.dayOfWeek, fields.dayOfWeek)
			});
		}
		/**
		* Resolves a field value, either using the provided CronField instance or creating a new one from raw values.
		* @param constructor - The constructor for creating new field instances
		* @param baseField - The base field to use if no override is provided
		* @param fieldValue - The override value, either a CronField instance or raw values
		* @returns The resolved CronField instance
		* @private
		*/
		static resolveField(constructor, baseField, fieldValue) {
			if (!fieldValue) return baseField;
			if (fieldValue instanceof fields_1.CronField) return fieldValue;
			return new constructor(fieldValue);
		}
		/**
		* CronFieldCollection constructor. Initializes the cron fields with the provided values.
		* @param {CronFields} param0 - The cron fields values
		* @throws {Error} if validation fails
		* @example
		* const cronFields = new CronFieldCollection({
		*   second: new CronSecond([0]),
		*   minute: new CronMinute([0, 30]),
		*   hour: new CronHour([9]),
		*   dayOfMonth: new CronDayOfMonth([15]),
		*   month: new CronMonth([1]),
		*   dayOfWeek: new CronDayOfTheWeek([1, 2, 3, 4, 5]),
		* })
		*
		* console.log(cronFields.second.values); // [0]
		* console.log(cronFields.minute.values); // [0, 30]
		* console.log(cronFields.hour.values); // [9]
		* console.log(cronFields.dayOfMonth.values); // [15]
		* console.log(cronFields.month.values); // [1]
		* console.log(cronFields.dayOfWeek.values); // [1, 2, 3, 4, 5]
		*/
		constructor({ second, minute, hour, dayOfMonth, month, dayOfWeek }) {
			if (!second) throw new Error("Validation error, Field second is missing");
			if (!minute) throw new Error("Validation error, Field minute is missing");
			if (!hour) throw new Error("Validation error, Field hour is missing");
			if (!dayOfMonth) throw new Error("Validation error, Field dayOfMonth is missing");
			if (!month) throw new Error("Validation error, Field month is missing");
			if (!dayOfWeek) throw new Error("Validation error, Field dayOfWeek is missing");
			if (month.values.length === 1 && !dayOfMonth.hasLastChar && dayOfWeek.isWildcard) {
				if (!(parseInt(dayOfMonth.values[0], 10) <= fields_1.CronMonth.daysInMonth[month.values[0] - 1])) throw new Error("Invalid explicit day of month definition");
			}
			this.#second = second;
			this.#minute = minute;
			this.#hour = hour;
			this.#month = month;
			this.#dayOfWeek = dayOfWeek;
			this.#dayOfMonth = dayOfMonth;
		}
		/**
		* Returns the second field.
		* @returns {CronSecond}
		*/
		get second() {
			return this.#second;
		}
		/**
		* Returns the minute field.
		* @returns {CronMinute}
		*/
		get minute() {
			return this.#minute;
		}
		/**
		* Returns the hour field.
		* @returns {CronHour}
		*/
		get hour() {
			return this.#hour;
		}
		/**
		* Returns the day of the month field.
		* @returns {CronDayOfMonth}
		*/
		get dayOfMonth() {
			return this.#dayOfMonth;
		}
		/**
		* Returns the month field.
		* @returns {CronMonth}
		*/
		get month() {
			return this.#month;
		}
		/**
		* Returns the day of the week field.
		* @returns {CronDayOfWeek}
		*/
		get dayOfWeek() {
			return this.#dayOfWeek;
		}
		/**
		* Returns a string representation of the cron fields.
		* @param {(number | CronChars)[]} input - The cron fields values
		* @static
		* @returns {FieldRange[]} - The compacted cron fields
		*/
		static compactField(input) {
			if (input.length === 0) return [];
			const output = [];
			let current = void 0;
			input.forEach((item, i, arr) => {
				if (current === void 0) {
					current = {
						start: item,
						count: 1
					};
					return;
				}
				const prevItem = arr[i - 1] || current.start;
				const nextItem = arr[i + 1];
				if (item === "L" || item === "W") {
					output.push(current);
					output.push({
						start: item,
						count: 1
					});
					current = void 0;
					return;
				}
				if (current.step === void 0 && nextItem !== void 0) {
					const step = item - prevItem;
					if (step <= nextItem - item) {
						current = {
							...current,
							count: 2,
							end: item,
							step
						};
						return;
					}
					current.step = 1;
				}
				if (item - (current.end ?? 0) === current.step) {
					current.count++;
					current.end = item;
				} else {
					if (current.count === 1) output.push({
						start: current.start,
						count: 1
					});
					else if (current.count === 2) {
						output.push({
							start: current.start,
							count: 1
						});
						output.push({
							start: current.end ?? prevItem,
							count: 1
						});
					} else output.push(current);
					current = {
						start: item,
						count: 1
					};
				}
			});
			if (current) output.push(current);
			return output;
		}
		/**
		* Handles a single range.
		* @param {CronField} field - The cron field to stringify
		* @param {FieldRange} range {start: number, end: number, step: number, count: number} The range to handle.
		* @param {number} max The maximum value for the field.
		* @returns {string | null} The stringified range or null if it cannot be stringified.
		* @private
		*/
		static #handleSingleRange(field, range, max) {
			const step = range.step;
			if (!step) return null;
			if (step === 1 && range.start === field.min && range.end && range.end >= max) return field.hasQuestionMarkChar ? "?" : "*";
			if (step !== 1 && range.start === field.min && range.end && range.end >= max - step + 1) return `*/${step}`;
			return null;
		}
		/**
		* Handles multiple ranges.
		* @param {FieldRange} range {start: number, end: number, step: number, count: number} The range to handle.
		* @param {number} max The maximum value for the field.
		* @returns {string} The stringified range.
		* @private
		*/
		static #handleMultipleRanges(range, max) {
			const step = range.step;
			if (step === 1) return `${range.start}-${range.end}`;
			const multiplier = range.start === 0 ? range.count - 1 : range.count;
			/* istanbul ignore if */
			if (!step) throw new Error("Unexpected range step");
			/* istanbul ignore if */
			if (!range.end) throw new Error("Unexpected range end");
			if (step * multiplier > range.end) {
				const mapFn = (_, index) => {
					/* istanbul ignore if */
					if (typeof range.start !== "number") throw new Error("Unexpected range start");
					return index % step === 0 ? range.start + index : null;
				};
				/* istanbul ignore if */
				if (typeof range.start !== "number") throw new Error("Unexpected range start");
				const seed = { length: range.end - range.start + 1 };
				return Array.from(seed, mapFn).filter((value) => value !== null).join(",");
			}
			return range.end === max - step + 1 ? `${range.start}/${step}` : `${range.start}-${range.end}/${step}`;
		}
		/**
		* Returns a string representation of the cron fields.
		* @param {CronField} field - The cron field to stringify
		* @static
		* @returns {string} - The stringified cron field
		*/
		stringifyField(field) {
			let max = field.max;
			let values = field.values;
			if (field instanceof fields_1.CronDayOfWeek) {
				max = 6;
				const dayOfWeek = this.#dayOfWeek.values;
				values = dayOfWeek[dayOfWeek.length - 1] === 7 ? dayOfWeek.slice(0, -1) : dayOfWeek;
			}
			if (field instanceof fields_1.CronDayOfMonth) max = this.#month.values.length === 1 ? fields_1.CronMonth.daysInMonth[this.#month.values[0] - 1] : field.max;
			const ranges = CronFieldCollection.compactField(values);
			if (ranges.length === 1) {
				const singleRangeResult = CronFieldCollection.#handleSingleRange(field, ranges[0], max);
				if (singleRangeResult) return singleRangeResult;
			}
			return ranges.map((range) => {
				const value = range.count === 1 ? range.start.toString() : CronFieldCollection.#handleMultipleRanges(range, max);
				if (field instanceof fields_1.CronDayOfWeek && field.nthDay > 0) return `${value}#${field.nthDay}`;
				return value;
			}).join(",");
		}
		/**
		* Returns a string representation of the cron field values.
		* @param {boolean} includeSeconds - Whether to include seconds in the output
		* @returns {string} The formatted cron string
		*/
		stringify(includeSeconds = false) {
			const arr = [];
			if (includeSeconds) arr.push(this.stringifyField(this.#second));
			arr.push(this.stringifyField(this.#minute), this.stringifyField(this.#hour), this.stringifyField(this.#dayOfMonth), this.stringifyField(this.#month), this.stringifyField(this.#dayOfWeek));
			return arr.join(" ");
		}
		/**
		* Returns a serialized representation of the cron fields values.
		* @returns {SerializedCronFields} An object containing the cron field values
		*/
		serialize() {
			return {
				second: this.#second.serialize(),
				minute: this.#minute.serialize(),
				hour: this.#hour.serialize(),
				dayOfMonth: this.#dayOfMonth.serialize(),
				month: this.#month.serialize(),
				dayOfWeek: this.#dayOfWeek.serialize()
			};
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/CronExpression.js
var require_CronExpression = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronExpression = exports.LOOPS_LIMIT_EXCEEDED_ERROR_MESSAGE = exports.TIME_SPAN_OUT_OF_BOUNDS_ERROR_MESSAGE = void 0;
	const CronDate_1 = require_CronDate();
	/**
	* Error message for when the current date is outside the specified time span.
	*/
	exports.TIME_SPAN_OUT_OF_BOUNDS_ERROR_MESSAGE = "Out of the time span range";
	/**
	* Error message for when the loop limit is exceeded during iteration.
	*/
	exports.LOOPS_LIMIT_EXCEEDED_ERROR_MESSAGE = "Invalid expression, loop limit exceeded";
	/**
	* Cron iteration loop safety limit
	*/
	const LOOP_LIMIT = 1e4;
	/**
	* Class representing a Cron expression.
	*/
	var CronExpression = class CronExpression {
		#options;
		#tz;
		#currentDate;
		#startDate;
		#endDate;
		#fields;
		#dstTransitionDayKey = null;
		#isDstTransitionDay = false;
		/**
		* Creates a new CronExpression instance.
		*
		* @param {CronFieldCollection} fields - Cron fields.
		* @param {CronExpressionOptions} options - Parser options.
		*/
		constructor(fields, options) {
			this.#options = options;
			this.#tz = options.tz;
			this.#startDate = options.startDate ? new CronDate_1.CronDate(options.startDate, this.#tz) : null;
			this.#endDate = options.endDate ? new CronDate_1.CronDate(options.endDate, this.#tz) : null;
			let currentDateValue = options.currentDate ?? options.startDate;
			if (currentDateValue) {
				const tempCurrentDate = new CronDate_1.CronDate(currentDateValue, this.#tz);
				if (this.#startDate && tempCurrentDate.getTime() < this.#startDate.getTime()) currentDateValue = this.#startDate;
				else if (this.#endDate && tempCurrentDate.getTime() > this.#endDate.getTime()) currentDateValue = this.#endDate;
			}
			this.#currentDate = new CronDate_1.CronDate(currentDateValue, this.#tz);
			this.#fields = fields;
		}
		/**
		* Getter for the cron fields.
		*
		* @returns {CronFieldCollection} Cron fields.
		*/
		get fields() {
			return this.#fields;
		}
		/**
		* Converts cron fields back to a CronExpression instance.
		*
		* @public
		* @param {Record<string, number[]>} fields - The input cron fields object.
		* @param {CronExpressionOptions} [options] - Optional parsing options.
		* @returns {CronExpression} - A new CronExpression instance.
		*/
		static fieldsToExpression(fields, options) {
			return new CronExpression(fields, options || {});
		}
		/**
		* Checks if the given value matches any element in the sequence.
		*
		* @param {number} value - The value to be matched.
		* @param {number[]} sequence - The sequence to be checked against.
		* @returns {boolean} - True if the value matches an element in the sequence; otherwise, false.
		* @memberof CronExpression
		* @private
		*/
		static #matchSchedule(value, sequence) {
			return sequence.some((element) => element === value);
		}
		/**
		* Returns the minimum or maximum value from the given array of numbers.
		*
		* @param {number[]} values - An array of numbers.
		* @param {boolean} reverse - If true, returns the maximum value; otherwise, returns the minimum value.
		* @returns {number} - The minimum or maximum value.
		*/
		#getMinOrMax(values, reverse) {
			return values[reverse ? values.length - 1 : 0];
		}
		/**
		* Checks whether the given date falls on a DST transition day in its timezone.
		*
		* This is used to disable certain “direct set” fast paths on DST days, because setting the hour
		* directly may land on a non-existent or repeated local time. We cache the result per calendar day
		* to keep iteration overhead low.
		*
		* @param {CronDate} currentDate - Date to check (in the cron timezone)
		* @returns {boolean} True when the day has a DST transition
		* @private
		*/
		#checkDstTransition(currentDate) {
			const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
			if (this.#dstTransitionDayKey === key) return this.#isDstTransitionDay;
			const startOfDay = new CronDate_1.CronDate(currentDate);
			startOfDay.setStartOfDay();
			const endOfDay = new CronDate_1.CronDate(currentDate);
			endOfDay.setEndOfDay();
			this.#dstTransitionDayKey = key;
			this.#isDstTransitionDay = startOfDay.getUTCOffset() !== endOfDay.getUTCOffset();
			return this.#isDstTransitionDay;
		}
		/**
		* Moves the date to the next/previous allowed second value. If there is no remaining allowed second
		* within the current minute, rolls to the next/previous minute and resets seconds to the min/max allowed.
		*
		* @param {CronDate} currentDate - Mutable date being iterated
		* @param {DateMathOp} dateMathVerb - Add/Subtract depending on direction
		* @param {boolean} reverse - When true, iterating backwards
		* @private
		*/
		#moveToNextSecond(currentDate, dateMathVerb, reverse) {
			const seconds = this.#fields.second.values;
			const currentSecond = currentDate.getSeconds();
			const nextSecond = this.#fields.second.findNearestValue(currentSecond, reverse);
			if (nextSecond !== null) {
				currentDate.setSeconds(nextSecond);
				return;
			}
			currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Minute, this.#fields.hour.values.length);
			currentDate.setSeconds(this.#getMinOrMax(seconds, reverse));
		}
		/**
		* Moves the date to the next/previous allowed minute value and resets seconds to the min/max allowed.
		* If there is no remaining allowed minute within the current hour, rolls to the next/previous hour and
		* resets minutes/seconds to their extrema.
		*
		* @param {CronDate} currentDate - Mutable date being iterated
		* @param {DateMathOp} dateMathVerb - Add/Subtract depending on direction
		* @param {boolean} reverse - When true, iterating backwards
		* @private
		*/
		#moveToNextMinute(currentDate, dateMathVerb, reverse) {
			const minutes = this.#fields.minute.values;
			const seconds = this.#fields.second.values;
			const currentMinute = currentDate.getMinutes();
			const nextMinute = this.#fields.minute.findNearestValue(currentMinute, reverse);
			if (nextMinute !== null) {
				currentDate.setMinutes(nextMinute);
				currentDate.setSeconds(this.#getMinOrMax(seconds, reverse));
				return;
			}
			currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Hour, this.#fields.hour.values.length);
			currentDate.setMinutes(this.#getMinOrMax(minutes, reverse));
			currentDate.setSeconds(this.#getMinOrMax(seconds, reverse));
		}
		/**
		* Determines if the current date matches the last specified weekday of the month.
		*
		* @param {Array<(number|string)>} expressions - An array of expressions containing weekdays and "L" for the last weekday.
		* @param {CronDate} currentDate - The current date object.
		* @returns {boolean} - True if the current date matches the last specified weekday of the month; otherwise, false.
		* @memberof CronExpression
		* @private
		*/
		static #isLastWeekdayOfMonthMatch(expressions, currentDate) {
			const isLastWeekdayOfMonth = currentDate.isLastWeekdayOfMonth();
			return expressions.some((expression) => {
				const weekday = parseInt(expression.toString().charAt(0), 10) % 7;
				if (Number.isNaN(weekday)) throw new Error(`Invalid last weekday of the month expression: ${expression}`);
				return currentDate.getDay() === weekday && isLastWeekdayOfMonth;
			});
		}
		/**
		* Find the next scheduled date based on the cron expression.
		* @returns {CronDate} - The next scheduled date or an ES6 compatible iterator object.
		* @memberof CronExpression
		* @public
		*/
		next() {
			return this.#findSchedule();
		}
		/**
		* Find the previous scheduled date based on the cron expression.
		* @returns {CronDate} - The previous scheduled date or an ES6 compatible iterator object.
		* @memberof CronExpression
		* @public
		*/
		prev() {
			return this.#findSchedule(true);
		}
		/**
		* Check if there is a next scheduled date based on the current date and cron expression.
		* @returns {boolean} - Returns true if there is a next scheduled date, false otherwise.
		* @memberof CronExpression
		* @public
		*/
		hasNext() {
			const current = this.#currentDate;
			try {
				this.#findSchedule();
				return true;
			} catch {
				return false;
			} finally {
				this.#currentDate = current;
			}
		}
		/**
		* Check if there is a previous scheduled date based on the current date and cron expression.
		* @returns {boolean} - Returns true if there is a previous scheduled date, false otherwise.
		* @memberof CronExpression
		* @public
		*/
		hasPrev() {
			const current = this.#currentDate;
			try {
				this.#findSchedule(true);
				return true;
			} catch {
				return false;
			} finally {
				this.#currentDate = current;
			}
		}
		/**
		* Iterate over a specified number of steps and optionally execute a callback function for each step.
		* @param {number} steps - The number of steps to iterate. Positive value iterates forward, negative value iterates backward.
		* @returns {CronDate[]} - An array of iterator fields or CronDate objects.
		* @memberof CronExpression
		* @public
		*/
		take(limit) {
			const items = [];
			if (limit >= 0) for (let i = 0; i < limit; i++) try {
				items.push(this.next());
			} catch {
				return items;
			}
			else for (let i = 0; i > limit; i--) try {
				items.push(this.prev());
			} catch {
				return items;
			}
			return items;
		}
		/**
		* Reset the iterators current date to a new date or the initial date.
		* @param {Date | CronDate} [newDate] - Optional new date to reset to. If not provided, it will reset to the initial date.
		* @memberof CronExpression
		* @public
		*/
		reset(newDate) {
			this.#currentDate = new CronDate_1.CronDate(newDate || this.#options.currentDate, this.#tz);
		}
		/**
		* Generate a string representation of the cron expression.
		* @param {boolean} [includeSeconds=false] - Whether to include the seconds field in the string representation.
		* @returns {string} - The string representation of the cron expression.
		* @memberof CronExpression
		* @public
		*/
		stringify(includeSeconds = false) {
			return this.#fields.stringify(includeSeconds);
		}
		/**
		* Check if the cron expression includes the given date
		* @param {Date|CronDate} date
		* @returns {boolean}
		*/
		includesDate(date) {
			const { second, minute, hour, month } = this.#fields;
			const dt = new CronDate_1.CronDate(date, this.#tz);
			if (!second.values.includes(dt.getSeconds()) || !minute.values.includes(dt.getMinutes()) || !hour.values.includes(dt.getHours()) || !month.values.includes(dt.getMonth() + 1)) return false;
			if (!this.#matchDayOfMonth(dt)) return false;
			if (this.#fields.dayOfWeek.nthDay > 0) {
				if (Math.ceil(dt.getDate() / 7) !== this.#fields.dayOfWeek.nthDay) return false;
			}
			return true;
		}
		/**
		* Returns the string representation of the cron expression.
		* @returns {CronDate} - The next schedule date.
		*/
		toString() {
			/* istanbul ignore next - should be impossible under normal use to trigger the or branch */
			return this.#options.expression || this.stringify(true);
		}
		/**
		* Determines if the given date matches the cron expression's day of month and day of week fields.
		*
		* The function checks the following rules:
		* Rule 1: If both "day of month" and "day of week" are restricted (not wildcard), then one or both must match the current day.
		* Rule 2: If "day of month" is restricted and "day of week" is not restricted, then "day of month" must match the current day.
		* Rule 3: If "day of month" is a wildcard, "day of week" is not a wildcard, and "day of week" matches the current day, then the match is accepted.
		* If none of the rules match, the match is rejected.
		*
		* @param {CronDate} currentDate - The current date to be evaluated against the cron expression.
		* @returns {boolean} Returns true if the current date matches the cron expression's day of month and day of week fields, otherwise false.
		* @memberof CronExpression
		* @private
		*/
		#matchDayOfMonth(currentDate) {
			const isDayOfMonthWildcardMatch = this.#fields.dayOfMonth.isWildcard;
			const isRestrictedDayOfMonth = !isDayOfMonthWildcardMatch;
			const isDayOfWeekWildcardMatch = this.#fields.dayOfWeek.isWildcard;
			const isRestrictedDayOfWeek = !isDayOfWeekWildcardMatch;
			const matchedDOM = CronExpression.#matchSchedule(currentDate.getDate(), this.#fields.dayOfMonth.values) || this.#fields.dayOfMonth.hasLastChar && currentDate.isLastDayOfMonth();
			const matchedDOW = CronExpression.#matchSchedule(currentDate.getDay(), this.#fields.dayOfWeek.values) || this.#fields.dayOfWeek.hasLastChar && CronExpression.#isLastWeekdayOfMonthMatch(this.#fields.dayOfWeek.values, currentDate);
			if (isRestrictedDayOfMonth && isRestrictedDayOfWeek && (matchedDOM || matchedDOW)) return true;
			if (matchedDOM && !isRestrictedDayOfWeek) return true;
			if (isDayOfMonthWildcardMatch && !isDayOfWeekWildcardMatch && matchedDOW) return true;
			return false;
		}
		/**
		* Determines if the current hour matches the cron expression.
		*
		* @param {CronDate} currentDate - The current date object.
		* @param {DateMathOp} dateMathVerb - The date math operation enumeration value.
		* @param {boolean} reverse - A flag indicating whether the matching should be done in reverse order.
		* @returns {boolean} - True if the current hour matches the cron expression; otherwise, false.
		*/
		#matchHour(currentDate, dateMathVerb, reverse) {
			const hourValues = this.#fields.hour.values;
			const hours = hourValues;
			const currentHour = currentDate.getHours();
			const isMatch = CronExpression.#matchSchedule(currentHour, hourValues);
			const isDstEnd = currentDate.dstEnd === currentHour;
			if (currentDate.dstStart !== null && currentDate.dstStart === currentHour - 1) {
				if (CronExpression.#matchSchedule(currentDate.dstStart, hourValues)) return true;
			}
			if (isDstEnd && !reverse) {
				currentDate.dstEnd = null;
				currentDate.applyDateOperation(CronDate_1.DateMathOp.Add, CronDate_1.TimeUnit.Hour, hours.length);
				return false;
			}
			if (isMatch) return true;
			currentDate.dstStart = null;
			const nextHour = this.#fields.hour.findNearestValue(currentHour, reverse);
			if (nextHour === null) {
				currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Day, hours.length);
				return false;
			}
			if (this.#checkDstTransition(currentDate)) {
				const steps = reverse ? currentHour - nextHour : nextHour - currentHour;
				for (let i = 0; i < steps; i++) {
					currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Hour, hours.length);
					if (!reverse && currentDate.getHours() >= nextHour) break;
					if (reverse && currentDate.getHours() <= nextHour) break;
				}
			} else currentDate.setHours(nextHour);
			currentDate.setMinutes(this.#getMinOrMax(this.#fields.minute.values, reverse));
			currentDate.setSeconds(this.#getMinOrMax(this.#fields.second.values, reverse));
			return false;
		}
		/**
		* Validates the current date against the start and end dates of the cron expression.
		* If the current date is outside the specified time span, an error is thrown.
		*
		* @param currentDate {CronDate} - The current date to validate.
		* @throws {Error} If the current date is outside the specified time span.
		* @private
		*/
		#validateTimeSpan(currentDate) {
			if (!this.#startDate && !this.#endDate) return;
			const currentTime = currentDate.getTime();
			if (this.#startDate && currentTime < this.#startDate.getTime()) throw new Error(exports.TIME_SPAN_OUT_OF_BOUNDS_ERROR_MESSAGE);
			if (this.#endDate && currentTime > this.#endDate.getTime()) throw new Error(exports.TIME_SPAN_OUT_OF_BOUNDS_ERROR_MESSAGE);
		}
		/**
		* Finds the next or previous schedule based on the cron expression.
		*
		* @param {boolean} [reverse=false] - If true, finds the previous schedule; otherwise, finds the next schedule.
		* @returns {CronDate} - The next or previous schedule date.
		* @private
		*/
		#findSchedule(reverse = false) {
			const dateMathVerb = reverse ? CronDate_1.DateMathOp.Subtract : CronDate_1.DateMathOp.Add;
			const currentDate = new CronDate_1.CronDate(this.#currentDate);
			const startTimestamp = currentDate.getTime();
			let stepCount = 0;
			while (++stepCount < LOOP_LIMIT) {
				this.#validateTimeSpan(currentDate);
				if (!this.#matchDayOfMonth(currentDate)) {
					currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Day, this.#fields.hour.values.length);
					continue;
				}
				if (!(this.#fields.dayOfWeek.nthDay <= 0 || Math.ceil(currentDate.getDate() / 7) === this.#fields.dayOfWeek.nthDay)) {
					currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Day, this.#fields.hour.values.length);
					continue;
				}
				if (!CronExpression.#matchSchedule(currentDate.getMonth() + 1, this.#fields.month.values)) {
					currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Month, this.#fields.hour.values.length);
					continue;
				}
				if (!this.#matchHour(currentDate, dateMathVerb, reverse)) continue;
				if (!CronExpression.#matchSchedule(currentDate.getMinutes(), this.#fields.minute.values)) {
					this.#moveToNextMinute(currentDate, dateMathVerb, reverse);
					continue;
				}
				if (!CronExpression.#matchSchedule(currentDate.getSeconds(), this.#fields.second.values)) {
					this.#moveToNextSecond(currentDate, dateMathVerb, reverse);
					continue;
				}
				if (startTimestamp === currentDate.getTime()) {
					if (dateMathVerb === "Add" || currentDate.getMilliseconds() === 0) currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Second, this.#fields.hour.values.length);
					continue;
				}
				break;
			}
			/* istanbul ignore next - should be impossible under normal use to trigger the branch */
			if (stepCount > LOOP_LIMIT) throw new Error(exports.LOOPS_LIMIT_EXCEEDED_ERROR_MESSAGE);
			if (currentDate.getMilliseconds() !== 0) currentDate.setMilliseconds(0);
			this.#currentDate = currentDate;
			return currentDate;
		}
		/**
		* Returns an iterator for iterating through future CronDate instances
		*
		* @name Symbol.iterator
		* @memberof CronExpression
		* @returns {Iterator<CronDate>} An iterator object for CronExpression that returns CronDate values.
		*/
		[Symbol.iterator]() {
			return { next: () => {
				try {
					return {
						value: this.#findSchedule(),
						done: false
					};
				} catch {
					return {
						value: void 0,
						done: true
					};
				}
			} };
		}
	};
	exports.CronExpression = CronExpression;
	exports.default = CronExpression;
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/utils/random.js
var require_random = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.seededRandom = seededRandom;
	/**
	* Computes a numeric hash from a given string
	* @param {string} str A value to hash
	* @returns {number} A numeric hash computed from the given value
	*/
	function xfnv1a(str) {
		let h = 2166136261;
		for (let i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return () => h >>> 0;
	}
	/**
	* Initialize a new PRNG using a given seed
	* @param {number} seed The seed used to initialize the PRNG
	* @returns {PRNG} A random number generator
	*/
	function mulberry32(seed) {
		return () => {
			let t = seed += 1831565813;
			t = Math.imul(t ^ t >>> 15, t | 1);
			t ^= t + Math.imul(t ^ t >>> 7, t | 61);
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		};
	}
	/**
	* Generates a PRNG using a given seed. When not provided, the seed is randomly generated
	* @param {string} str A string to derive the seed from
	* @returns {PRNG} A random number generator correctly seeded
	*/
	function seededRandom(str) {
		return mulberry32(str ? xfnv1a(str)() : Math.floor(Math.random() * 1e10));
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/CronExpressionParser.js
var require_CronExpressionParser = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronExpressionParser = exports.DayOfWeek = exports.Months = exports.CronUnit = exports.PredefinedExpressions = void 0;
	const CronFieldCollection_1 = require_CronFieldCollection();
	const CronExpression_1 = require_CronExpression();
	const random_1 = require_random();
	const fields_1 = require_fields();
	var PredefinedExpressions;
	(function(PredefinedExpressions) {
		PredefinedExpressions["@yearly"] = "0 0 0 1 1 *";
		PredefinedExpressions["@annually"] = "0 0 0 1 1 *";
		PredefinedExpressions["@monthly"] = "0 0 0 1 * *";
		PredefinedExpressions["@weekly"] = "0 0 0 * * 0";
		PredefinedExpressions["@daily"] = "0 0 0 * * *";
		PredefinedExpressions["@hourly"] = "0 0 * * * *";
		PredefinedExpressions["@minutely"] = "0 * * * * *";
		PredefinedExpressions["@secondly"] = "* * * * * *";
		PredefinedExpressions["@weekdays"] = "0 0 0 * * 1-5";
		PredefinedExpressions["@weekends"] = "0 0 0 * * 0,6";
	})(PredefinedExpressions || (exports.PredefinedExpressions = PredefinedExpressions = {}));
	var CronUnit;
	(function(CronUnit) {
		CronUnit["Second"] = "Second";
		CronUnit["Minute"] = "Minute";
		CronUnit["Hour"] = "Hour";
		CronUnit["DayOfMonth"] = "DayOfMonth";
		CronUnit["Month"] = "Month";
		CronUnit["DayOfWeek"] = "DayOfWeek";
	})(CronUnit || (exports.CronUnit = CronUnit = {}));
	var Months;
	(function(Months) {
		Months[Months["jan"] = 1] = "jan";
		Months[Months["feb"] = 2] = "feb";
		Months[Months["mar"] = 3] = "mar";
		Months[Months["apr"] = 4] = "apr";
		Months[Months["may"] = 5] = "may";
		Months[Months["jun"] = 6] = "jun";
		Months[Months["jul"] = 7] = "jul";
		Months[Months["aug"] = 8] = "aug";
		Months[Months["sep"] = 9] = "sep";
		Months[Months["oct"] = 10] = "oct";
		Months[Months["nov"] = 11] = "nov";
		Months[Months["dec"] = 12] = "dec";
	})(Months || (exports.Months = Months = {}));
	var DayOfWeek;
	(function(DayOfWeek) {
		DayOfWeek[DayOfWeek["sun"] = 0] = "sun";
		DayOfWeek[DayOfWeek["mon"] = 1] = "mon";
		DayOfWeek[DayOfWeek["tue"] = 2] = "tue";
		DayOfWeek[DayOfWeek["wed"] = 3] = "wed";
		DayOfWeek[DayOfWeek["thu"] = 4] = "thu";
		DayOfWeek[DayOfWeek["fri"] = 5] = "fri";
		DayOfWeek[DayOfWeek["sat"] = 6] = "sat";
	})(DayOfWeek || (exports.DayOfWeek = DayOfWeek = {}));
	exports.CronExpressionParser = class CronExpressionParser {
		/**
		* Parses a cron expression and returns a CronExpression object.
		* @param {string} expression - The cron expression to parse.
		* @param {CronExpressionOptions} [options={}] - The options to use when parsing the expression.
		* @param {boolean} [options.strict=false] - If true, will throw an error if the expression contains both dayOfMonth and dayOfWeek.
		* @param {CronDate} [options.currentDate=new CronDate(undefined, 'UTC')] - The date to use when calculating the next/previous occurrence.
		*
		* @returns {CronExpression} A CronExpression object.
		*/
		static parse(expression, options = {}) {
			const { strict = false, hashSeed } = options;
			const rand = (0, random_1.seededRandom)(hashSeed);
			expression = PredefinedExpressions[expression] || expression;
			const rawFields = CronExpressionParser.#getRawFields(expression, strict);
			if (!(rawFields.dayOfMonth === "*" || rawFields.dayOfWeek === "*" || !strict)) throw new Error("Cannot use both dayOfMonth and dayOfWeek together in strict mode!");
			const second = CronExpressionParser.#parseField(CronUnit.Second, rawFields.second, fields_1.CronSecond.constraints, rand);
			const minute = CronExpressionParser.#parseField(CronUnit.Minute, rawFields.minute, fields_1.CronMinute.constraints, rand);
			const hour = CronExpressionParser.#parseField(CronUnit.Hour, rawFields.hour, fields_1.CronHour.constraints, rand);
			const month = CronExpressionParser.#parseField(CronUnit.Month, rawFields.month, fields_1.CronMonth.constraints, rand);
			const dayOfMonth = CronExpressionParser.#parseField(CronUnit.DayOfMonth, rawFields.dayOfMonth, fields_1.CronDayOfMonth.constraints, rand);
			const { dayOfWeek: _dayOfWeek, nthDayOfWeek } = CronExpressionParser.#parseNthDay(rawFields.dayOfWeek);
			const dayOfWeek = CronExpressionParser.#parseField(CronUnit.DayOfWeek, _dayOfWeek, fields_1.CronDayOfWeek.constraints, rand);
			const fields = new CronFieldCollection_1.CronFieldCollection({
				second: new fields_1.CronSecond(second, { rawValue: rawFields.second }),
				minute: new fields_1.CronMinute(minute, { rawValue: rawFields.minute }),
				hour: new fields_1.CronHour(hour, { rawValue: rawFields.hour }),
				dayOfMonth: new fields_1.CronDayOfMonth(dayOfMonth, { rawValue: rawFields.dayOfMonth }),
				month: new fields_1.CronMonth(month, { rawValue: rawFields.month }),
				dayOfWeek: new fields_1.CronDayOfWeek(dayOfWeek, {
					rawValue: rawFields.dayOfWeek,
					nthDayOfWeek
				})
			});
			return new CronExpression_1.CronExpression(fields, {
				...options,
				expression
			});
		}
		/**
		* Get the raw fields from a cron expression.
		* @param {string} expression - The cron expression to parse.
		* @param {boolean} strict - If true, will throw an error if the expression contains both dayOfMonth and dayOfWeek.
		* @private
		* @returns {RawCronFields} The raw fields.
		*/
		static #getRawFields(expression, strict) {
			if (strict && !expression.length) throw new Error("Invalid cron expression");
			expression = expression || "0 * * * * *";
			const atoms = expression.trim().split(/\s+/);
			if (strict && atoms.length < 6) throw new Error("Invalid cron expression, expected 6 fields");
			if (atoms.length > 6) throw new Error("Invalid cron expression, too many fields");
			const defaults = [
				"*",
				"*",
				"*",
				"*",
				"*",
				"0"
			];
			if (atoms.length < defaults.length) atoms.unshift(...defaults.slice(atoms.length));
			const [second, minute, hour, dayOfMonth, month, dayOfWeek] = atoms;
			return {
				second,
				minute,
				hour,
				dayOfMonth,
				month,
				dayOfWeek
			};
		}
		/**
		* Parse a field from a cron expression.
		* @param {CronUnit} field - The field to parse.
		* @param {string} value - The value of the field.
		* @param {CronConstraints} constraints - The constraints for the field.
		* @private
		* @returns {(number | string)[]} The parsed field.
		*/
		static #parseField(field, value, constraints, rand) {
			if (field === CronUnit.Month || field === CronUnit.DayOfWeek) value = value.replace(/[a-z]{3}/gi, (match) => {
				match = match.toLowerCase();
				const replacer = Months[match] || DayOfWeek[match];
				if (replacer === void 0) throw new Error(`Validation error, cannot resolve alias "${match}"`);
				return replacer.toString();
			});
			if (!constraints.validChars.test(value)) throw new Error(`Invalid characters, got value: ${value}`);
			value = this.#parseWildcard(value, constraints);
			value = this.#parseHashed(value, constraints, rand);
			return this.#parseSequence(field, value, constraints);
		}
		/**
		* Parse a wildcard from a cron expression.
		* @param {string} value - The value to parse.
		* @param {CronConstraints} constraints - The constraints for the field.
		* @private
		*/
		static #parseWildcard(value, constraints) {
			return value.replace(/[*?]/g, constraints.min + "-" + constraints.max);
		}
		/**
		* Parse a hashed value from a cron expression.
		* @param {string} value - The value to parse.
		* @param {CronConstraints} constraints - The constraints for the field.
		* @param {PRNG} rand - The random number generator to use.
		* @private
		*/
		static #parseHashed(value, constraints, rand) {
			const randomValue = rand();
			return value.replace(/H(?:\((\d+)-(\d+)\))?(?:\/(\d+))?/g, (_, min, max, step) => {
				if (min && max && step) {
					const minNum = parseInt(min, 10);
					const maxNum = parseInt(max, 10);
					const stepNum = parseInt(step, 10);
					if (minNum > maxNum) throw new Error(`Invalid range: ${minNum}-${maxNum}, min > max`);
					if (stepNum <= 0) throw new Error(`Invalid step: ${stepNum}, must be positive`);
					const minStart = Math.max(minNum, constraints.min);
					const offset = Math.floor(randomValue * stepNum);
					const values = [];
					for (let i = Math.floor(minStart / stepNum) * stepNum + offset; i <= maxNum; i += stepNum) if (i >= minStart) values.push(i);
					return values.join(",");
				} else if (min && max) {
					const minNum = parseInt(min, 10);
					const maxNum = parseInt(max, 10);
					if (minNum > maxNum) throw new Error(`Invalid range: ${minNum}-${maxNum}, min > max`);
					return String(Math.floor(randomValue * (maxNum - minNum + 1)) + minNum);
				} else if (step) {
					const stepNum = parseInt(step, 10);
					if (stepNum <= 0) throw new Error(`Invalid step: ${stepNum}, must be positive`);
					const offset = Math.floor(randomValue * stepNum);
					const values = [];
					for (let i = Math.floor(constraints.min / stepNum) * stepNum + offset; i <= constraints.max; i += stepNum) if (i >= constraints.min) values.push(i);
					return values.join(",");
				} else return String(Math.floor(randomValue * (constraints.max - constraints.min + 1) + constraints.min));
			});
		}
		/**
		* Parse a sequence from a cron expression.
		* @param {CronUnit} field - The field to parse.
		* @param {string} val - The sequence to parse.
		* @param {CronConstraints} constraints - The constraints for the field.
		* @private
		*/
		static #parseSequence(field, val, constraints) {
			const stack = [];
			function handleResult(result, constraints) {
				if (Array.isArray(result)) stack.push(...result);
				else if (CronExpressionParser.#isValidConstraintChar(constraints, result)) stack.push(result);
				else {
					const v = parseInt(result.toString(), 10);
					if (!(v >= constraints.min && v <= constraints.max)) throw new Error(`Constraint error, got value ${result} expected range ${constraints.min}-${constraints.max}`);
					stack.push(field === CronUnit.DayOfWeek ? v % 7 : result);
				}
			}
			val.split(",").forEach((atom) => {
				if (!(atom.length > 0)) throw new Error("Invalid list value format");
				handleResult(CronExpressionParser.#parseRepeat(field, atom, constraints), constraints);
			});
			return stack;
		}
		/**
		* Parse repeat from a cron expression.
		* @param {CronUnit} field - The field to parse.
		* @param {string} val - The repeat to parse.
		* @param {CronConstraints} constraints - The constraints for the field.
		* @private
		* @returns {(number | string)[]} The parsed repeat.
		*/
		static #parseRepeat(field, val, constraints) {
			const atoms = val.split("/");
			if (atoms.length > 2) throw new Error(`Invalid repeat: ${val}`);
			if (atoms.length === 2) {
				if (!atoms[0].includes("-")) atoms[0] = `${atoms[0]}-${constraints.max}`;
				return CronExpressionParser.#parseRange(field, atoms[0], parseInt(atoms[1], 10), constraints);
			}
			return CronExpressionParser.#parseRange(field, val, 1, constraints);
		}
		/**
		* Validate a cron range.
		* @param {number} min - The minimum value of the range.
		* @param {number} max - The maximum value of the range.
		* @param {CronConstraints} constraints - The constraints for the field.
		* @private
		* @returns {void}
		* @throws {Error} Throws an error if the range is invalid.
		*/
		static #validateRange(min, max, constraints) {
			if (!(!isNaN(min) && !isNaN(max) && min >= constraints.min && max <= constraints.max)) throw new Error(`Constraint error, got range ${min}-${max} expected range ${constraints.min}-${constraints.max}`);
			if (min > max) throw new Error(`Invalid range: ${min}-${max}, min(${min}) > max(${max})`);
		}
		/**
		* Validate a cron repeat interval.
		* @param {number} repeatInterval - The repeat interval to validate.
		* @private
		* @returns {void}
		* @throws {Error} Throws an error if the repeat interval is invalid.
		*/
		static #validateRepeatInterval(repeatInterval) {
			if (!(!isNaN(repeatInterval) && repeatInterval > 0)) throw new Error(`Constraint error, cannot repeat at every ${repeatInterval} time.`);
		}
		/**
		* Create a range from a cron expression.
		* @param {CronUnit} field - The field to parse.
		* @param {number} min - The minimum value of the range.
		* @param {number} max - The maximum value of the range.
		* @param {number} repeatInterval - The repeat interval of the range.
		* @private
		* @returns {number[]} The created range.
		*/
		static #createRange(field, min, max, repeatInterval) {
			const stack = [];
			if (field === CronUnit.DayOfWeek && max % 7 === 0) stack.push(0);
			for (let index = min; index <= max; index += repeatInterval) if (stack.indexOf(index) === -1) stack.push(index);
			return stack;
		}
		/**
		* Parse a range from a cron expression.
		* @param {CronUnit} field - The field to parse.
		* @param {string} val - The range to parse.
		* @param {number} repeatInterval - The repeat interval of the range.
		* @param {CronConstraints} constraints - The constraints for the field.
		* @private
		* @returns {number[] | string[] | number | string} The parsed range.
		*/
		static #parseRange(field, val, repeatInterval, constraints) {
			const atoms = val.split("-");
			if (atoms.length <= 1) return isNaN(+val) ? val : +val;
			const [min, max] = atoms.map((num) => parseInt(num, 10));
			this.#validateRange(min, max, constraints);
			this.#validateRepeatInterval(repeatInterval);
			return this.#createRange(field, min, max, repeatInterval);
		}
		/**
		* Parse a cron expression.
		* @param {string} val - The cron expression to parse.
		* @private
		* @returns {string} The parsed cron expression.
		*/
		static #parseNthDay(val) {
			const atoms = val.split("#");
			if (atoms.length <= 1) return { dayOfWeek: atoms[0] };
			const nthValue = +atoms[atoms.length - 1];
			const matches = val.match(/([,-/])/);
			if (matches !== null) throw new Error(`Constraint error, invalid dayOfWeek \`#\` and \`${matches?.[0]}\` special characters are incompatible`);
			if (!(atoms.length <= 2 && !isNaN(nthValue) && nthValue >= 1 && nthValue <= 5)) throw new Error("Constraint error, invalid dayOfWeek occurrence number (#)");
			return {
				dayOfWeek: atoms[0],
				nthDayOfWeek: nthValue
			};
		}
		/**
		* Checks if a character is valid for a field.
		* @param {CronConstraints} constraints - The constraints for the field.
		* @param {string | number} value - The value to check.
		* @private
		* @returns {boolean} Whether the character is valid for the field.
		*/
		static #isValidConstraintChar(constraints, value) {
			return constraints.chars.some((char) => value.toString().includes(char));
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/CronFileParser.js
var require_CronFileParser = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || (function() {
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		return function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronFileParser = void 0;
	const CronExpressionParser_1 = require_CronExpressionParser();
	exports.CronFileParser = class CronFileParser {
		/**
		* Parse a crontab file asynchronously
		* @param filePath Path to crontab file
		* @returns Promise resolving to parse results
		* @throws If file cannot be read
		*/
		static async parseFile(filePath) {
			const { readFile } = await Promise.resolve().then(() => __importStar(__require("fs/promises")));
			const data = await readFile(filePath, "utf8");
			return CronFileParser.#parseContent(data);
		}
		/**
		* Parse a crontab file synchronously
		* @param filePath Path to crontab file
		* @returns Parse results
		* @throws If file cannot be read
		*/
		static parseFileSync(filePath) {
			const { readFileSync } = __require("fs");
			const data = readFileSync(filePath, "utf8");
			return CronFileParser.#parseContent(data);
		}
		/**
		* Internal method to parse crontab file content
		* @private
		*/
		static #parseContent(data) {
			const blocks = data.split("\n");
			const result = {
				variables: {},
				expressions: [],
				errors: {}
			};
			for (const block of blocks) {
				const entry = block.trim();
				if (entry.length === 0 || entry.startsWith("#")) continue;
				const variableMatch = entry.match(/^(.*)=(.*)$/);
				if (variableMatch) {
					const [, key, value] = variableMatch;
					result.variables[key] = value.replace(/["']/g, "");
					continue;
				}
				try {
					const parsedEntry = CronFileParser.#parseEntry(entry);
					result.expressions.push(parsedEntry.interval);
				} catch (err) {
					result.errors[entry] = err;
				}
			}
			return result;
		}
		/**
		* Parse a single crontab entry
		* @private
		*/
		static #parseEntry(entry) {
			const atoms = entry.split(" ");
			return {
				interval: CronExpressionParser_1.CronExpressionParser.parse(atoms.slice(0, 5).join(" ")),
				command: atoms.slice(5, atoms.length)
			};
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/cron-parser@5.6.2/node_modules/cron-parser/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CronFileParser = exports.CronExpressionParser = exports.CronExpression = exports.CronFieldCollection = exports.CronDate = void 0;
	/* istanbul ignore file */
	const CronExpressionParser_1 = require_CronExpressionParser();
	var CronDate_1 = require_CronDate();
	Object.defineProperty(exports, "CronDate", {
		enumerable: true,
		get: function() {
			return CronDate_1.CronDate;
		}
	});
	var CronFieldCollection_1 = require_CronFieldCollection();
	Object.defineProperty(exports, "CronFieldCollection", {
		enumerable: true,
		get: function() {
			return CronFieldCollection_1.CronFieldCollection;
		}
	});
	var CronExpression_1 = require_CronExpression();
	Object.defineProperty(exports, "CronExpression", {
		enumerable: true,
		get: function() {
			return CronExpression_1.CronExpression;
		}
	});
	var CronExpressionParser_2 = require_CronExpressionParser();
	Object.defineProperty(exports, "CronExpressionParser", {
		enumerable: true,
		get: function() {
			return CronExpressionParser_2.CronExpressionParser;
		}
	});
	var CronFileParser_1 = require_CronFileParser();
	Object.defineProperty(exports, "CronFileParser", {
		enumerable: true,
		get: function() {
			return CronFileParser_1.CronFileParser;
		}
	});
	__exportStar(require_fields(), exports);
	exports.default = CronExpressionParser_1.CronExpressionParser;
}));
//#endregion
export { require_dist as t };

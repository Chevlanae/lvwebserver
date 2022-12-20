"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Temp = void 0;
var Temp;
(function (Temp) {
    /**
     * Saves given value. If this.expiry is greater than Date.now(), returns undefined.
     */
    class volatileData {
        /**
         * Saves given "data" to #value until "maxAge" has been reached. Call this.value to get the stored value, if maxAge has been reached returns undefined.
         * @param {any} value Any value
         * @param {number} maxAge Desired time to keep "data", in milliseconds.
         */
        constructor(value, maxAge) {
            this.expiry = Date.now() + maxAge;
            this.#value = value;
        }
        expiry;
        #value;
        get value() {
            if (Date.now() >= this.expiry)
                return (this.#value = undefined);
            else
                return this.#value;
        }
    }
    Temp.volatileData = volatileData;
    /**
     * Generates a Proxy object that will save any assigned property to the target Map object for a specified period of "retentionTime".
     * If the retention time has passed when a desired property's getter is called, it will return undefined and delete the property from the target Map object.
     * A property's expiration is calculated every time it's setter is called.
     * @param retentionTime Desired amount of time to retain given properties, in milliseconds. Default value is 30 minutes.
     * @returns { Map<string | symbol, any> } Proxy object that handles a blank Map object.
     */
    function handler(retentionTime = 30 * 60000) {
        return new Proxy(new Map(), {
            get: function (target, key) {
                let data = target.get(key)?.value;
                if (data === undefined)
                    target.delete(key);
                return data;
            },
            set: function (target, key, value) {
                target.set(key, new volatileData(value, retentionTime));
                return true;
            },
        });
    }
    Temp.handler = handler;
})(Temp = exports.Temp || (exports.Temp = {}));

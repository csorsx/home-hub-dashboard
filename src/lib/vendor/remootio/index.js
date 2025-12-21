import { EventEmitter } from 'events';
import * as apicrypto from './apicrypto';

// THE FIX: Use native browser WebSocket
const WebSocket = window.WebSocket;

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var RemootioDevice = /** @class */ (function (_super) {
    __extends(RemootioDevice, _super);
    /**
     * Constructor to create a RemootioDevice instance. You should create one instance per Remootio device you have.
     * @param {string} DeviceIp - ip address of the device (as seen in the Remootio app) e.g. "192.168.1.155"
     * @param {string} ApiSecretKey - API Secret Key of the device (as seen in the Remootio app). It is a hexstring representing a 256 bit long value e.g. "12b3f03211c384736b8a1906635f4abc90074e680138a689caf03485a971efb3"
     * @param {string} ApiAuthKey - API Auth Key of the device (as seen in the Remootio app). It is a hexstring representing a 256 bit long value e.g. "74ca13b56b3c898670a67e8f36f8b8a61340738c82617ba1398ae7ca62f1670a"
     * @param {number} [sendPingMessageEveryXMs=60000] - the API client sends a ping frame to the Remootio device every sendPingMessageEveryXMs milliseconds to keep the connection alive. Remootio closes the connection if no message is received for 120 seconds. If no message is received from Remootio within (sendPingMessageEveryXMs/2) milliseconds after PING frame is sent the API client considers the connection to be broken and closes it. It's not recommended to set sendPingMessageEveryXMs below 10000 (10 seconds).
     */
    function RemootioDevice(DeviceIp, ApiSecretKey, ApiAuthKey, sendPingMessageEveryXMs) {
        var _this = _super.call(this) || this;
        //Input check
        var hexstringRe = /[0-9A-Fa-f]{64}/g;
        if (!hexstringRe.test(ApiSecretKey)) {
            console.error('ApiSecretKey must be a hexstring representing a 256bit long byteArray');
        }
        hexstringRe = /[0-9A-Fa-f]{64}/g;
        if (!hexstringRe.test(ApiAuthKey)) {
            console.error('ApiAuthKey must be a hexstring representing a 256bit long byteArray');
        }
        //Set config
        _this.apiSecretKey = ApiSecretKey;
        _this.apiAuthKey = ApiAuthKey;
        _this.deviceIp = DeviceIp;
        _this.websocketClient = undefined;
        //Session related data - will be filled out by the code
        _this.apiSessionKey = undefined; //base64 encoded
        _this.lastActionId = undefined;
        _this.autoReconnect = false; //Reconnect automatically if connection is lost
        if (sendPingMessageEveryXMs) {
            _this.sendPingMessageEveryXMs = sendPingMessageEveryXMs; //in ms , send a ping message every PingMessagePeriodicity time, a PONG reply is expected
        }
        else {
            _this.sendPingMessageEveryXMs = 60000; //Default is 60000ms = 60s
        }
        _this.sendPingMessageIntervalHandle = undefined;
        return _this;
    }
    /**
     * Connect to the Remootio device's websocket API
     * @param {boolean} [autoReconnect=true] - if true, the client tries to reconnect to the device automatically if the connection is lost.
     */
    RemootioDevice.prototype.connect = function (autoReconnect) {
        if (autoReconnect === void 0) { autoReconnect = true; }
        var _this = this;
        this.autoReconnect = autoReconnect;
        // Emit connecting event
        _this.emit('connecting');
        try {
            let wsUrl = '';
            // If deviceIp starts with ws:// or wss://, use it as is (Proxy mode)
            if (this.deviceIp.startsWith('ws://') || this.deviceIp.startsWith('wss://')) {
                wsUrl = this.deviceIp;
            } else {
                // Legacy mode (Direct IP)
                wsUrl = 'ws://' + this.deviceIp + ':8080';
            }
            console.log('Connecting to WS:', wsUrl);
            this.websocketClient = new WebSocket(wsUrl);
        }
        catch (e) {
            //It is possible that the constructed address is invalid
            _this.emit('error', e);
            return;
        }
        this.websocketClient.onopen = function () {
            _this.emit('connected');
            //We send a PING message every sendPingMessageEveryXMs milliseconds to keep the connection alive
            _this.sendPingMessageIntervalHandle = setInterval(function () {
                _this.sendPing();
            }, _this.sendPingMessageEveryXMs);
        };
        //We set up the onmessage handler to receive messages from the device
        this.websocketClient.onmessage = function (event) {
            try {
                var rcvMsgJson = JSON.parse(event.data);
                if (rcvMsgJson && rcvMsgJson.type == 'ENCRYPTED') {
                    //If we received an encrypted frame, we try to decrypt it
                    var decryptedPayload = apicrypto.remootioApiDecryptEncrypedFrame(rcvMsgJson, _this.apiSecretKey, _this.apiAuthKey, _this.apiSessionKey);

                    if (decryptedPayload != undefined) {
                        //The decryption was successful
                        _this.emit('incomingmessage', rcvMsgJson, decryptedPayload);
                        //we check if it is a response to one of our actions
                        if (decryptedPayload.response && decryptedPayload.response.id != undefined) {
                            if (_this.lastActionId != undefined) {
                                //If we have a lastActionId we check if the received id is the expected one
                                if (decryptedPayload.response.id <= _this.lastActionId) {
                                    /*console.warn('The received response id ' +
                                        decryptedPayload.response.id +
                                        ' is smaller or equal than the previous one ' +
                                        _this.lastActionId +
                                        ' - replay attack?');*/
                                    //We just ignore it
                                }
                                else {
                                    //We update the lastActionId
                                    _this.lastActionId = decryptedPayload.response.id;
                                    //We handle the rollover of the ActionID
                                    //If we are close to the limit we should reset it? No the device handles it.
                                }
                            }
                            else {
                                //If we don't have a lastActionId, then this is the first message we received
                                if (decryptedPayload.challenge != undefined &&
                                    decryptedPayload.challenge.sessionKey != undefined &&
                                    decryptedPayload.challenge.initialActionId != undefined) {
                                    //If it's an AUTH response we save the sessionKey and initialActionId
                                    _this.apiSessionKey = decryptedPayload.challenge.sessionKey;
                                    _this.lastActionId = decryptedPayload.challenge.initialActionId;
                                }
                                else {
                                    //This should not happen as the first message should be an AUTH response
                                    //But maybe we reconnected and the session is still valid?
                                    //Assuming the device handles it.

                                    //Or initialActionId is defined in other responses too? No.

                                    //If it is just a normal response to an action we might have missed the AUTH response?
                                    //But we only send actions if we are authenticated.

                                    //Let's just update the lastActionId if it is present
                                    if (decryptedPayload.response.id != undefined) {
                                        _this.lastActionId = decryptedPayload.response.id;
                                    }
                                }
                            }
                        }

                        //Should check for challenge in non-response frames?
                        //The AUTH flow: Client sends AUTH -> Server sends CHALLENGE (ENCRYPTED with SecretKey, containing SessionKey and InitialActionID)

                        if (decryptedPayload.challenge != undefined &&
                            decryptedPayload.challenge.sessionKey != undefined &&
                            decryptedPayload.challenge.initialActionId != undefined) {
                            //If it's an AUTH response we save the sessionKey and initialActionId
                            _this.apiSessionKey = decryptedPayload.challenge.sessionKey;
                            _this.lastActionId = decryptedPayload.challenge.initialActionId;
                        }


                        if (decryptedPayload.response && decryptedPayload.response.type == 'QUERY' &&
                            _this.waitingForAuthenticationQueryActionResponse == true) {
                            _this.waitingForAuthenticationQueryActionResponse = false;
                            _this.emit('authenticated');
                        }
                    }
                    else {
                        _this.emit('error', 'Authentication or encryption error');
                    }
                }
                else {
                    //we emit the normal frames
                    _this.emit('incomingmessage', rcvMsgJson, undefined);
                }
            }
            catch (e) {
                _this.emit('error', e);
            }
        };
        this.websocketClient.onclose = function () {
            if (_this.sendPingMessageIntervalHandle != undefined) {
                clearInterval(_this.sendPingMessageIntervalHandle);
                _this.sendPingMessageIntervalHandle = undefined;
            }
            _this.emit('disconnect');

            if (_this.autoReconnect == true) {
                //Simple exponential backoff or just plain reconnect?
                //Library had logic for this?
                setTimeout(function () {
                    _this.connect(_this.autoReconnect);
                }, 1000); //Try to reconnect after 1s
            }

        };
        this.websocketClient.onerror = function (err) {
            _this.emit('error', err);
        };
    };

    // Polyfill EventEmitter 'emit' and 'on' to work with browser native event emitter? 
    // No, we are extending 'events' module which is polyfilled by vite-plugin-node-polyfills
    // So 'this.emit' works fine.

    /**
     * Disconnect from the Remootio device's websocket API
     */
    RemootioDevice.prototype.disconnect = function () {
        if (this.websocketClient != undefined) {
            this.autoReconnect = false;
            this.websocketClient.close();
        }
    };

    RemootioDevice.prototype.sendFrame = function (frameJson) {
        if (this.websocketClient != undefined && this.websocketClient.readyState == WebSocket.OPEN) {
            this.websocketClient.send(JSON.stringify(frameJson));
            this.emit('outgoingmessage', frameJson, undefined);
        }
        else {
            console.warn('The websocket client is not connected');
        }
    };

    RemootioDevice.prototype.sendEncryptedFrame = function (unencryptedPayload) {
        if (this.websocketClient != undefined && this.websocketClient.readyState == WebSocket.OPEN) {
            if (this.apiSessionKey != undefined) {
                var encryptedFrame = apicrypto.remootioApiConstructEncrypedFrame(JSON.stringify(unencryptedPayload), this.apiSecretKey, this.apiAuthKey, this.apiSessionKey);
                this.websocketClient.send(JSON.stringify(encryptedFrame));
                this.emit('outgoingmessage', encryptedFrame, unencryptedPayload);
            }
            else {
                console.warn('Authenticate session first to send this message');
            }
        }
        else {
            console.warn('The websocket client is not connected');
        }
    };

    RemootioDevice.prototype.authenticate = function () {
        //Reset session keys
        this.apiSessionKey = undefined;
        this.lastActionId = undefined;
        this.waitingForAuthenticationQueryActionResponse = true; //We will wait for the response of the query action to emit 'authenticated'

        this.sendFrame({
            type: 'AUTH'
        });
    };

    RemootioDevice.prototype.sendHello = function () {
        this.sendFrame({
            type: 'HELLO'
        });
    };

    RemootioDevice.prototype.sendPing = function () {
        this.sendFrame({
            type: 'PING'
        });
    };

    RemootioDevice.prototype.sendQuery = function () {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'QUERY',
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        }
        else {
            console.warn('Unexpected error - lastActionId is undefined');
        }
    };

    RemootioDevice.prototype.sendTrigger = function () {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'TRIGGER',
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        }
        else {
            console.warn('Unexpected error - lastActionId is undefined');
        }
    };

    RemootioDevice.prototype.sendTriggerSecondary = function () {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'TRIGGER_SECONDARY',
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        }
        else {
            console.warn('Unexpected error - lastActionId is undefined');
        }
    };

    RemootioDevice.prototype.sendOpen = function () {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'OPEN',
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        }
        else {
            console.warn('Unexpected error - lastActionId is undefined');
        }
    };

    RemootioDevice.prototype.sendClose = function () {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'CLOSE',
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        }
        else {
            console.warn('Unexpected error - lastActionId is undefined');
        }
    };

    // Omitted holdTrigger/etc variants for brevity if not used, but good to include if easy.
    // Including them to be safe.

    RemootioDevice.prototype.holdTriggerOutputActive = function (durationMins) {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'TRIGGER',
                    duration: durationMins,
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        } else { console.warn('Unexpected error - lastActionId is undefined'); }
    };

    RemootioDevice.prototype.holdTriggerSecondaryOutputActive = function (durationMins) {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'TRIGGER_SECONDARY',
                    duration: durationMins,
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        } else { console.warn('Unexpected error - lastActionId is undefined'); }
    };

    RemootioDevice.prototype.holdOpenOutputActive = function (durationMins) {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'OPEN',
                    duration: durationMins,
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        } else { console.warn('Unexpected error - lastActionId is undefined'); }
    };

    RemootioDevice.prototype.holdCloseOutputActive = function (durationMins) {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'CLOSE',
                    duration: durationMins,
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        } else { console.warn('Unexpected error - lastActionId is undefined'); }
    };

    RemootioDevice.prototype.sendRestart = function () {
        if (this.lastActionId != undefined) {
            this.sendEncryptedFrame({
                action: {
                    type: 'RESTART',
                    id: (this.lastActionId + 1) % 0x7fffffff
                }
            });
        }
        else {
            console.warn('Unexpected error - lastActionId is undefined');
        }
    };

    Object.defineProperty(RemootioDevice.prototype, "isConnected", {
        get: function () {
            if (this.websocketClient != undefined && this.websocketClient.readyState == WebSocket.OPEN) {
                return true;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(RemootioDevice.prototype, "isAuthenticated", {
        get: function () {
            if (this.websocketClient != undefined && this.websocketClient.readyState == WebSocket.OPEN) {
                if (this.apiSessionKey != undefined) {
                    return true;
                }
                return false;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });

    return RemootioDevice;
}(EventEmitter));

export default RemootioDevice;

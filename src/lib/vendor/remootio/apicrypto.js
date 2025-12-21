import CryptoJS from 'crypto-js';

/**
 * This function decrypts the payload of an ENCRYPTED frame.
 */
export function remootioApiDecryptEncrypedFrame(frame, ApiSecretKey, ApiAuthKey, ApiSessionKey) {
    if (!frame || frame.type != 'ENCRYPTED' || !frame.data || !frame.mac || !frame.data.payload || !frame.data.iv) {
        return undefined;
    }
    //STEP 0 - Get the relevant keys used for encryption
    var CurrentlyUsedSecretKeyWordArray = undefined;

    if (ApiSessionKey == undefined) {
        CurrentlyUsedSecretKeyWordArray = CryptoJS.enc.Hex.parse(ApiSecretKey); //Parse hexstring
    }
    else {
        CurrentlyUsedSecretKeyWordArray = CryptoJS.enc.Base64.parse(ApiSessionKey); //Parse hexstring
    }

    var ApiAuthKeyWordArray = CryptoJS.enc.Hex.parse(ApiAuthKey); //Parse hexstring

    //Step 1 verify MAC
    var mac = CryptoJS.HmacSHA256(JSON.stringify(frame.data), ApiAuthKeyWordArray);
    var base64mac = CryptoJS.enc.Base64.stringify(mac);

    var macMatches = true;
    if (base64mac != frame.mac) {
        console.warn('Decryption error: calculated MAC ' + base64mac + ' does not match the MAC from the API ' + frame.mac);
        macMatches = false;
    }

    //STEP 2 decrypt the payload
    var payloadWordArray = CryptoJS.enc.Base64.parse(frame.data.payload);
    var ivWordArray = CryptoJS.enc.Base64.parse(frame.data.iv);
    var decryptedPayloadWordArray = CryptoJS.AES.decrypt({ ciphertext: payloadWordArray }, CurrentlyUsedSecretKeyWordArray, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    var decryptedPayload = CryptoJS.enc.Latin1.stringify(decryptedPayloadWordArray);
    var decryptedPayloadJSON = undefined;
    try {
        decryptedPayloadJSON = JSON.parse(decryptedPayload);
    }
    catch (e) {
        console.warn('The decrypted frame.data is not a valid JSON: ', decryptedPayload);
    }
    if (macMatches == true) {
        return decryptedPayloadJSON;
    }
    else {
        return undefined;
    }
}

/**
 * This function encrypts the payload of an ENCRYPTED frame.
 */
export function remootioApiConstructEncrypedFrame(unencryptedPayload, _ApiSecretKey, ApiAuthKey, ApiSessionKey) {
    var CurrentlyUsedSecretKeyWordArray = undefined;
    if (ApiSessionKey == undefined) {
        return undefined;
    }
    else {
        CurrentlyUsedSecretKeyWordArray = CryptoJS.enc.Base64.parse(ApiSessionKey);
    }

    var ApiAuthKeyWordArray = CryptoJS.enc.Hex.parse(ApiAuthKey);

    //STEP 1 encrypt the payload
    var ivWordArray = CryptoJS.lib.WordArray.random(16);
    var unencryptedPayloadWordArray = CryptoJS.enc.Latin1.parse(unencryptedPayload);
    var encryptedData = CryptoJS.AES.encrypt(unencryptedPayloadWordArray, CurrentlyUsedSecretKeyWordArray, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    var encryptedPayloadWordArray = encryptedData.ciphertext;

    var toHMACObj = {
        iv: CryptoJS.enc.Base64.stringify(ivWordArray),
        payload: CryptoJS.enc.Base64.stringify(encryptedPayloadWordArray)
    };

    var toHMAC = JSON.stringify(toHMACObj);
    var mac = CryptoJS.HmacSHA256(toHMAC, ApiAuthKeyWordArray);
    var base64mac = CryptoJS.enc.Base64.stringify(mac);

    return {
        type: 'ENCRYPTED',
        data: toHMACObj,
        mac: base64mac
    };
}

    
export function createRandomString(bytes: number) {
    const bytesArray = new Uint8Array(bytes);
    return String.fromCharCode(...crypto.getRandomValues(bytesArray));
}

export function base64urlEncode(str: string) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function hashSHA256(str: string) {
    return String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))));
}
export function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then().catch(e => console.error(e));
 }
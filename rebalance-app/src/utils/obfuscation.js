/**
 * Base64 obfuscated stringleri decode eder.
 */
export const decode = (encoded) => {
    try {
        // React Native ortamında global.buffer veya btoa/atob desteğine göre
        return decodeURIComponent(atob(encoded).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        // Basit atob (React Native bazen tam desteği lib ile sağlar)
        return atob(encoded);
    }
};

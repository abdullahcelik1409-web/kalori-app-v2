import { decode } from '../utils/obfuscation';

// Base64 Obfuscated Keys
const _SURL = "aHR0cHM6Ly9jbWt4dW1xYnZnZWhldmJpaXJkei5zdXBhYmFzZS5jbw==";
const _SKEY = "c2JfcHVibGlzaGFibGVfeUJyQkp6Q0tRaHA4QkZyMk5jdjNTZ19EMkRHSG1vRQ==";
const _GKEY = "QUl6YVN5Q3NzMEU1czVIQXIwOG1KdU9XY3Z6dk01cGdPV2Z2azlZ";

export const CONFIG = {
    SUPABASE_URL: decode(_SURL),
    SUPABASE_ANON_KEY: decode(_SKEY),
    GEMINI_API_KEY: decode(_GKEY)
};

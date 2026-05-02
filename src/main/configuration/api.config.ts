function getEnvOrThrow(key: string): string {
    console.log(process.env);
    const value = process.env[key];
    if (!value) {
        throw new Error(`missing environment variable : ${key}`);
    }
    return value;
}

export const apiConfig = {
    authApiBaseUrl: getEnvOrThrow("AUTH_API_BASE_URL"),
} as const;


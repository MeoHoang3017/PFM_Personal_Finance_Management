// src/config/googleLogin.config.ts
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Get all Google Client IDs from environment
 * Supports: GOOGLE_CLIENT_ID (alias, same as Flutter serverClientId), GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID
 * Flutter app sends ID token with audience = serverClientId (Web Client ID) → backend must verify with that same value
 */
function getGoogleClientIds(): string[] {
    const seen = new Set<string>();
    const clientIds: string[] = [];

    const add = (id: string | undefined) => {
        const trimmed = id?.trim();
        if (trimmed && !seen.has(trimmed)) {
            seen.add(trimmed);
            clientIds.push(trimmed);
        }
    };

    add(process.env.GOOGLE_CLIENT_ID);
    add(process.env.GOOGLE_WEB_CLIENT_ID);
    add(process.env.GOOGLE_IOS_CLIENT_ID);
    add(process.env.GOOGLE_ANDROID_CLIENT_ID);

    return clientIds;
}

/**
 * Verify Google ID Token from Flutter
 * Supports multiple client IDs for different platforms (iOS, Android, Web)
 */
export const verifyGoogleToken = async (idToken: string): Promise<{
    email: string;
    name?: string | undefined;
    picture?: string | undefined;
    sub: string; // Google user ID
    email_verified?: boolean | undefined;
}> => {
    try {
        const clientIds = getGoogleClientIds();
        
        if (clientIds.length === 0) {
            throw new Error(
                'No Google Client IDs configured. Set GOOGLE_WEB_CLIENT_ID or GOOGLE_CLIENT_ID in .env to the Web Client ID from Google Cloud Console (same value as Flutter GOOGLE_SERVER_CLIENT_ID).'
            );
        }

        // Try to verify with each client ID (for multi-platform support)
        let lastError: Error | null = null;
        
        for (const clientId of clientIds) {
            try {
                const client = new OAuth2Client(clientId);
                const ticket = await client.verifyIdToken({
                    idToken: idToken,
                    audience: clientId,
                });
                
                const payload = ticket.getPayload();
                
                if (!payload) {
                    throw new Error('No payload received from Google');
                }
                
                if (!payload.email) {
                    throw new Error('Email not found in Google token');
                }
                
                const result: {
                    email: string;
                    name?: string | undefined;
                    picture?: string | undefined;
                    sub: string;
                    email_verified?: boolean | undefined;
                } = {
                    email: payload.email,
                    sub: payload.sub,
                };
                
                if (payload.name) {
                    result.name = payload.name;
                }
                
                if (payload.picture) {
                    result.picture = payload.picture;
                }
                
                if (payload.email_verified !== undefined) {
                    result.email_verified = payload.email_verified;
                }
                
                return result;
            } catch (error: any) {
                lastError = error;
                // Continue to next client ID if this one fails
                continue;
            }
        }
        
        // If all client IDs failed, throw the last error
        throw lastError || new Error('Failed to verify Google token with any client ID');
    } catch (error: any) {
        console.error("Google Token Verification Error:", error.message);
        throw new Error(error.message || "Invalid Google Token");
    }
};
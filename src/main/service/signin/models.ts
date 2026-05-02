export interface ValidateResult {
    status: number;
}

export interface SignedUser {
    name: string;
    sessionKey: string;
    expiredAt: Date;
}

export interface SigninResult {
    status: number;
    user?: SignedUser;
}

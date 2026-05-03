export interface ValidateResult {
    status: number;
}

export interface SignedUser {
    srl: number;
    name: string;
    sessionKey: string;
    expiredAt: Date;
}

export interface SigninResult {
    status: number;
    user?: SignedUser;
}

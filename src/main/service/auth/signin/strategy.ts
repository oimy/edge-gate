import express from "express";
import {SigninResult, ValidateResult} from "./models";


export interface SigninStrategy {
    validate(request: express.Request): ValidateResult;

    do(request: express.Request): Promise<SigninResult>;

    after(result: SigninResult, response: express.Response): Promise<void>;
}

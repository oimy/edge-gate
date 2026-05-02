import express from "express";
import {SigninStrategy} from "./strategy";
import UserApiSigninStrategy from "./strategies/user-api.strategy";
import {SigninResult, ValidateResult} from "./models";

const SIGNIN_STRATEGY: SigninStrategy = new UserApiSigninStrategy();

export default async (request: express.Request, response: express.Response): Promise<void> => {
    const validateResult: ValidateResult = SIGNIN_STRATEGY.validate(request);
    if (validateResult.status !== 200) {
        response.status(validateResult.status).send();
    }

    const signinResult: SigninResult = await SIGNIN_STRATEGY.do(request);
    if (signinResult.status !== 200) {
        response.status(signinResult.status).send();
    }

    await SIGNIN_STRATEGY.after(signinResult, response);
    response.send();
}
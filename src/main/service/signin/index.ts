import express from "express";
import {SigninStrategy} from "./strategy";
import {SigninResult, ValidateResult} from "./models";
import {RoleUserSigninStrategy} from "@/service/signin/strategies/role-user.strategy";

const strategy: SigninStrategy = new RoleUserSigninStrategy();
export const getStrategy = () => strategy;

export default async (request: express.Request, response: express.Response): Promise<void> => {
    const validateResult: ValidateResult = strategy.validate(request);
    if (validateResult.status !== 200) {
        response.status(validateResult.status).send();
        return;
    }

    const signinResult: SigninResult = await strategy.do(request);
    if (signinResult.status !== 200) {
        response.status(signinResult.status).send();
        return;
    }

    await strategy.after(signinResult, response);
    response.send();
}
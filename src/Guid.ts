import { validate } from "uuid";

export  class Guid{
    static isGuid(value: string | undefined | null): boolean {
        if (value === undefined) { return false; }
        if (value === null     ) { return false; }
        if (value === ''       ) { return false; }

        return validate(value);
    }
}
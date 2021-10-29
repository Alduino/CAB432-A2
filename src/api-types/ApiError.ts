interface BasicError {
    error: "NOT_FOUND" | "INTERNAL_ERROR" | "CONNECTION_ERROR";
}

interface ParamError {
    error: "MISSING_PARAM" | "INVALID_PARAM";
    param: `query.${string}` | `params.${string}` | "body";
}

interface FieldError {
    error: "MISSING_FIELD";
    field: string;
}

type ApiError = BasicError | ParamError | FieldError;
export default ApiError;

export function isApiError(res: unknown): res is ApiError {
    if (typeof res !== "object") return false;
    return typeof (res as {error: unknown}).error === "string";
}

export function stringifyApiError(err: ApiError) {
    switch (err.error) {
        case "NOT_FOUND":
        case "INTERNAL_ERROR":
        case "CONNECTION_ERROR":
            return err.error;
        case "MISSING_PARAM":
        case "INVALID_PARAM":
            return `${err.error}:${err.param}`;
        case "MISSING_FIELD":
            return `${err.error}:${err.field}`;
        default:
            return `INVALID_ERROR`;
    }
}

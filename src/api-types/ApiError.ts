interface BasicError {
    error: "NOT_FOUND" | "INTERNAL_ERROR";
}

interface ParamError {
    error: "MISSING_PARAM" | "INVALID_PARAM";
    param: `query.${string}` | `params.${string}` | "body";
}

type ApiError = BasicError | ParamError;
export default ApiError;

export function isApiError(res: unknown): res is ApiError {
    if (typeof res !== "object") return false;
    return typeof (res as {error: unknown}).error === "string";
}

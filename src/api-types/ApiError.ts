interface BasicError {
    error: "NOT_FOUND";
}

interface ParamError {
    error: "MISSING_PARAM" | "INVALID_PARAM";
    param: `query.${string}` | `params.${string}` | "body";
}

type ApiError = BasicError | ParamError;
export default ApiError;

export function isApiError(res: unknown): res is ApiError {
    return typeof (res as {error: unknown}).error === "string";
}

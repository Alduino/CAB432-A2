import {NextApiRequest, NextApiResponse} from "next";
import ApiError, {isApiError} from "../api-types/ApiError";
import Article from "../api-types/Article";
import {getArticleById} from "../utils/database";

export async function getArticleResult(
    query: Record<string, string | string[]>
): Promise<Article | ApiError> {
    const {id} = query;

    if (!id) {
        return {
            error: "MISSING_PARAM",
            param: "query.id"
        };
    }

    if (Array.isArray(id)) {
        return {
            error: "INVALID_PARAM",
            param: "query.id"
        };
    }

    try {
        return await getArticleById(id);
    } catch {
        return {
            error: "INVALID_PARAM",
            param: "query.id"
        };
    }
}

export async function doArticle(req: NextApiRequest, res: NextApiResponse) {
    const result = await getArticleResult(req.query);

    if (isApiError(result)) {
        res.status(result.error === "NOT_FOUND" ? 404 : 400);
    }

    res.json(result);
}

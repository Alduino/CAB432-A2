import {NextApiRequest, NextApiResponse} from "next";
import ApiError, {isApiError} from "../../api-types/ApiError";
import ImportResponse from "../../api-types/ImportResponse";
import {resolveArticleBySource} from "../../utils/api/resolveArticleBySource";
import article from "./article";

export default async function handleImport(req: NextApiRequest, res: NextApiResponse) {
    const urlParam = req.query.url;

    if (urlParam == null) {
        res.json({
            error: "MISSING_PARAM",
            param: "query.url"
        } as ApiError);
        return;
    }

    if (typeof urlParam !== "string") {
        res.json({
            error: "INVALID_PARAM",
            param: "query.url"
        } as ApiError);
        return;
    }

    let url: URL;

    try {
        url = new URL(urlParam);
    } catch {
        res.json({
            error: "INVALID_PARAM",
            param: "query.url"
        } as ApiError);
        return;
    }

    const articleId = await resolveArticleBySource({
        id: "scraper",
        sourceArticleId: url
    });

    if (isApiError(articleId)) {
        res.json(articleId);
    } else if (articleId) {
        res.json({
            success: true,
            id: articleId
        } as ImportResponse);
    } else {
        res.json({
            error: "INTERNAL_ERROR"
        } as ApiError);
    }
}

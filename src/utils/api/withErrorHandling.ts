import {NextApiResponse} from "next";
import ApiError from "../../api-types/ApiError";
import createLogger from "../createLogger";

const logger = createLogger("error-handler");

export async function withErrorHandling(
    res: NextApiResponse,
    cb: () => void | Promise<void>
) {
    try {
        return await cb();
    } catch (err) {
        logger.error(err, "An error occurred while responding to a request");

        if (!res.headersSent) {
            res.statusCode = 500;
        }

        res.json({
            error: "INTERNAL_ERROR"
        } as ApiError);
    }
}

import {NextApiRequest, NextApiResponse} from "next";
import {doArticle} from "../../backend/article";
import {mockArticle} from "../../utils/api-mock";
import shouldMock from "../../utils/shouldMock";

export default function search(req: NextApiRequest, res: NextApiResponse) {
    if (shouldMock()) {
        return mockArticle(req, res);
    } else {
        return doArticle(req, res);
    }
}

import {NextApiRequest, NextApiResponse} from "next";
import {mockArticle} from "../../utils/api-mock";

export default function search(req: NextApiRequest, res: NextApiResponse) {
    return mockArticle(req, res);
}

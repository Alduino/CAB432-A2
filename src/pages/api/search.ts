import {NextApiRequest, NextApiResponse} from "next";
import {mockSearch} from "../../utils/api-mock";

export default function search(req: NextApiRequest, res: NextApiResponse) {
    return mockSearch(req, res);
}

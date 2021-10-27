import {NextApiRequest, NextApiResponse} from "next";
import {doSearch} from "../../backend/search";
import {mockSearch} from "../../utils/api-mock";
import shouldMock from "../../utils/shouldMock";

export default async function search(req: NextApiRequest, res: NextApiResponse) {
    if (shouldMock()) {
        return mockSearch(req, res);
    } else {
        return doSearch(req, res);
    }
}

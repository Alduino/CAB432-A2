import {NextApiRequest, NextApiResponse} from "next";
import {doSearch} from "../../backend/search";
import {mockSearch} from "../../utils/api-mock";
import {withErrorHandling} from "../../utils/api/withErrorHandling";
import shouldMock from "../../utils/shouldMock";

export default function search(req: NextApiRequest, res: NextApiResponse) {
    return withErrorHandling(res, async () => {
        if (shouldMock()) {
            return mockSearch(req, res);
        } else {
            return doSearch(req, res);
        }
    });
}

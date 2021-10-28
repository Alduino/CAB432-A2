import {NextApiRequest, NextApiResponse} from "next";
import getStats from "../../backend/stats";

export default async function stats(req: NextApiRequest, res: NextApiResponse) {
    const result = await getStats();
    res.json(result);
}

import express, { Request, Response } from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import { getMatchData, getMatchPreviews } from './service';

dotenv.config();

const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());

app.use(cors())

// Rou

app.get('/matchPreviews', async (req: Request, res: Response) => {
    const name = req.query['name'] || 'mcnutt';
    const tag = req.query['tag'] || 'nutt';

    const matchPreviews = await getMatchPreviews(name, tag);

    res.send(matchPreviews);
});

app.get('/match', async (req: Request, res: Response) => {

    const id = req.query['id'];
    const accountId = req.query['accountId'];

    const matchTimeline = await getMatchData(id, accountId);

    res.send(matchTimeline);

});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
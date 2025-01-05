import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import { getBreakdownForMatch, getEventTimelineDetailsForMatch, getMatchData, getMatchPreview, getMatchPreviews, getTrendData } from './service';
import { getAccountIdFromRiot } from './riot-service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000

// Middleware
app.use(express.json());

app.use(cors())

// Route

app.get('/matchPreviews', async (req: Request, res: Response, next: NextFunction) => {

  try {

    const name = req.query['name']

    if (!name) {
      const err = new Error('Missing name query');
      next(err);
    }

    const tag = req.query['tag']

    if (!tag) {
      const err = new Error('Missing tag query');
      next(err)
    }

    const matchPreviews = await getMatchPreviews(name, tag);

    res.send(matchPreviews);

  } catch (error) {
    next(error);
  }
});

app.get('/matchPreview', async (req: Request, res: Response, next: NextFunction) => {

  try {

    const matchId = req.query['matchId'] as string;

    if (!matchId) {
      const err = new Error('Missing matchId query');
      next(err);
    }

    const name = req.query['name']

    if (!name) {
      const err = new Error('Missing name query');
      next(err);
    }

    const tag = req.query['tag']

    if (!tag) {
      const err = new Error('Missing tag query');
      next(err)
    }

    const accountId = await getAccountIdFromRiot(name, tag);

    const matchPreview = await getMatchPreview(matchId, accountId);

    res.send(matchPreview);

  } catch (error) {
    next(error);
  }
});

app.get('/match', async (req: Request, res: Response, next: NextFunction) => {

    try {

      const id = req.query['id'];

      if (!id) {
        const err = new Error('Missing id query');
        next(err);
      }

      const name = req.query['name']

      if (!name) {
        const err = new Error('Missing name query');
        next(err);
      }

      const tag = req.query['tag']

      if (!tag) {
        const err = new Error('Missing tag query');
        next(err)
      }

      const accountId = await getAccountIdFromRiot(name, tag);

      const matchTimeline = await getMatchData(id, accountId);

      res.send(matchTimeline);
      
    } catch (error) {
      next(error);
    }

});

app.get('/trends', async (req: Request, res: Response, next: NextFunction) => {

  try {
    
    const name = req.query['name']

    if (!name) {
      const err = new Error('Missing name query');
      next(err);
    }

    const tag = req.query['tag']

    if (!tag) {
      const err = new Error('Missing tag query');
      next(err)
    }

    const sampleSize = Number(req.query['sampleSize']);

    if (!sampleSize) {
      const err = new Error('Missing sampleSize query');
      next(err);
    }

    const accountId = await getAccountIdFromRiot(name, tag);

    const trendData = await getTrendData(accountId, sampleSize);
    
    res.send(trendData);

  } catch (error) {
    
  }
})

app.get('/breakdown', async (req: Request, res: Response, next: NextFunction) => {

  try {
    
    const name = req.query['name']

    if (!name) {
      const err = new Error('Missing name query');
      next(err);
    }

    const tag = req.query['tag']

    if (!tag) {
      const err = new Error('Missing tag query');
      next(err)
    }

    const matchId = req.query['matchId'] as string;

    if (!matchId) {
      const err = new Error('Missing matchId query');
      next(err);
    }

    const accountId = await getAccountIdFromRiot(name, tag);

    const breakdownData = await getBreakdownForMatch(matchId, accountId);

    res.send(breakdownData);

  } catch (error) {
    
  }
})

app.get('/eventTimeline', async (req: Request, res: Response, next: NextFunction) => {

  try {
    
    const name = req.query['name']

    if (!name) {
      const err = new Error('Missing name query');
      next(err);
    }

    const tag = req.query['tag']

    if (!tag) {
      const err = new Error('Missing tag query');
      next(err)
    }

    const matchId = req.query['matchId'] as string;

    if (!matchId) {
      const err = new Error('Missing matchId query');
      next(err);
    }

    const accountId = await getAccountIdFromRiot(name, tag);

    const timelineData = await getEventTimelineDetailsForMatch(matchId, accountId);

    res.send(timelineData);

  } catch (error) {
    
  }
})


// Start server
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
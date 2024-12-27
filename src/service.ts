import axios from 'axios';
import { Data, MatchDto, Participant, RoleKey, ROLES, Team, Event, EventType, TrendData, Stat, StatGroup} from './types';
import { 
    getAverageTotalAdvantage, 
    getAverageGrowthRateAdvantage, 
    getTotalMatchesInRole, 
    getAverageResourcePerMinuteAdvantage, 
    getAverageResourceShare, 
    getAverageResourceShareAdvantage, 
    getAverageTotal,
    getAverageGrowthRate,
    getAverageResourcePerMinute
} from './stat-calculator';
import { wait } from './timeout-util';
import { matchIdsArr } from './manual-data';

export async function getAccountIdFromNameAndTag(name:any , tag: any) {

    try {
        const response = await axios.get(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${process.env.RIOT_API_KEY}`);
        const accountId = response.data.puuid;
        return accountId;  
    } catch (error) {
        console.log(error);
        throw error;   
    }
}

export async function getMatchListFromAccountId(accountId: any, limit: number = 20, start = 0) {

    try {
        const response = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${accountId}/ids?api_key=${process.env.RIOT_API_KEY}&count=${limit}&start=${start}`);
        const matchIds = response.data;
        return matchIds; 
    } catch (error) {
        console.log(error);
        throw error;   
    }
}

function formatChampionName(champion: string) {
   const regex = /([a-z])([A-Z])/;
   return champion.replace(regex, '$1 $2');
}

export async function getMatchPreview(matchId: string, accountId: string) {

    const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`;
    const matchResponse = await axios.get(url);
    const matchData = matchResponse.data;

    if (matchData['info']['gameMode'] !== 'CLASSIC') {
        return null;
    }

    const playerData = matchData['info']['participants'];

    let playerChampion: string = '';
    let enemyChampion: string = '';
    let role = '';
    let win = false;

    let playerParticipantId = accountId;
    let enemyParticipantId = '';

    for (const player of playerData) {
        if (player['puuid'] === accountId) {

            playerChampion = player['championName'];
            // Track role 
            const playerRole: RoleKey = player['teamPosition'];

            role = ROLES[playerRole];

            for (const player of playerData) {
            if (player['teamPosition'] === playerRole && player['puuid'] !== accountId) {
                enemyChampion = player['championName']
                enemyParticipantId = player['puuid'];
            }
            }

            // Determine if win or lose
            const playerTeamId = player['teamId'];

            const winningTeamId = matchData['info']['teams'][0]['win'] ? '100' : '200';

            if (playerTeamId.toString() === winningTeamId.toString()) {
                win = true;
            } else {
                win = false;
            }
        }
    }

    playerChampion = formatChampionName(playerChampion);
    enemyChampion = formatChampionName(enemyChampion);

    return {
        accountId,
        matchId,
        playerChampion,
        enemyChampion,
        role,
        win,
        playerParticipantId,
        enemyParticipantId
    }
}

export async function getMatchPreviews(name: any, tag: any) {

    const accountId = await getAccountIdFromNameAndTag(name, tag);

    const matchIds = await getMatchListFromAccountId(accountId);

    let matchPreviews = [];

    for (let i = 0; i < matchIds.length; i++) {
        const matchPreview = await getMatchPreview(matchIds[i], accountId);
        
        if (matchPreview) {
            matchPreviews.push(matchPreview);
        }
    }
    
    return matchPreviews;
}

export async function getMatchData(id: any, playerId: any) {

    const matchDataDTO: MatchDto = {
        participants: [],
        events: [],
        data: [],
    };

    let matchTimelineResponse;

    try {
        matchTimelineResponse = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${id}/timeline?api_key=${process.env.RIOT_API_KEY}`);
    } catch (error) {
        console.log(error);
        throw error;
    }

    const matchTimeline = matchTimelineResponse.data;

    const matchDataResponse = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${id}?api_key=${process.env.RIOT_API_KEY}`);

    const matchData = matchDataResponse.data;

    // Register Participants
    const matchDataParticipants = matchData['info']['participants'];

    // Find which team player belongs to
    const player = matchDataParticipants.find((p: any) => p['puuid'] === playerId);
    const playerTeam = player['teamId'];

    for (const p of matchDataParticipants) {

        const participant: Participant = {
            id: p['puuid'],
            champion: p['championName'],
            role: ROLES[p['teamPosition'] as RoleKey],
            team: (playerTeam === p['teamId']) ? Team.ALLY : Team.ENEMY
        }

        matchDataDTO.participants.push(participant);

    }

    const data: Data[] = [
        {
           id: matchDataDTO.participants[0].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
        {
           id: matchDataDTO.participants[1].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
        {
           id: matchDataDTO.participants[2].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
        {
           id: matchDataDTO.participants[3].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
           
        },
        {
           id: matchDataDTO.participants[4].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
        {
           id: matchDataDTO.participants[5].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
        {
           id: matchDataDTO.participants[6].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
        {
           id: matchDataDTO.participants[7].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
        {
           id: matchDataDTO.participants[8].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
        {
           id: matchDataDTO.participants[9].id, 
           gold: [],
           xp: [],
           level: [],
           cs: []
        },
    ]

    // Retrieve Frame Data
    const matchTimelineFrames = matchTimeline['info']['frames'];

    // Parse Frame Data
    for (const frame of matchTimelineFrames) {

        // Parse Data & Gold XP For Each Player
        const participantFrames = frame['participantFrames'];

        for (let i = 1; i < 11; i++) {

            const participantFrame = participantFrames[i.toString()];

            const gold = participantFrame['totalGold'];
            const xp = participantFrame['xp'];
            const level = participantFrame['level'];
            const cs = participantFrame['jungleMinionsKilled'] + participantFrame['minionsKilled'];


            data[i-1].gold.push(gold);
            data[i-1].xp.push(xp);
            data[i-1].level.push(level);
            data[i-1].cs.push(cs);
            
        }

    }

    // Set Updated Data
    matchDataDTO.data = data;

    const events: Event[] = [];

    let numOfEvents = 0;
    let frameNumber = 0;

    // Parse Event Data From Frames
    for (const frame of matchTimelineFrames) {

        const eventFrames = frame['events'];

        for (const event of eventFrames) {

            if (event['type'] === 'CHAMPION_KILL') {

                const eventNumber = numOfEvents + 1;
                numOfEvents++;

                const killerId = matchDataDTO.participants[event['killerId'] - 1]?.id;

                if (!killerId) {
                    continue;
                }

                const victimId = matchDataDTO.participants[event['victimId'] - 1].id;

                const killerTeam = matchDataDTO.participants[event['killerId'] - 1].team

                const killEvent: Event = {
                    id: eventNumber.toString(),
                    type: EventType.KILL,
                    subtype: victimId,
                    timestamp: event['timestamp'],
                    frame: frameNumber,
                    team: killerTeam,
                    killer: killerId,
                    // TODO: Assists
                }

                events.push(killEvent);
            }

            if (event['type'] === 'BUILDING_KILL') {

                const eventNumber = numOfEvents + 1;
                numOfEvents++;

                const killerId = matchDataDTO.participants[event['killerId']]?.id;

                if (!killerId) {
                    continue;
                }

                const killerTeam = matchDataDTO.participants[event['killerId']].team

                const turretEvent: Event = {
                    id: eventNumber.toString(),
                    type: EventType.TURRET,
                    subtype: event['towerType'],
                    timestamp: event['timestamp'],
                    frame: frameNumber,
                    team: killerTeam,
                    killer: killerId,
                    // TODO: Assists
                }

                events.push(turretEvent);

            }

            if (event['type'] === 'ELITE_MONSTER_KILL') {

                const eventNumber = numOfEvents + 1;
                numOfEvents++;

                const killerId = matchDataDTO.participants[event['killerId']]?.id;

                if (!killerId) {
                    continue;
                }

                const killerTeam = matchDataDTO.participants[event['killerId']].team;

                const objectiveEvent: Event = {
                    id: eventNumber.toString(),
                    type: EventType.OBJECTIVE,
                    subtype: event['monsterType'],
                    timestamp: event['timestamp'],
                    frame: frameNumber,
                    team: killerTeam,
                    killer: killerId,
                    // TODO: Assists
                }

                events.push(objectiveEvent)
            }

        }

        frameNumber ++;

    } 

    matchDataDTO.events = events;

    // Return Data
    return matchDataDTO;
    
}

export async function getTrendData(accountId: any, sampleSize: number) {

    let processedMatchDataArr: any[] = [];

    let matchCount = 0;

    if (process.env.FULL_REPORT === 'true') {
        
        for (let i = 0; i < 10; i++) {

            const matchIds = matchIdsArr[i];

            for (const id of matchIds) {

                matchCount++;
                console.log(`Retrieving match ${matchCount} out of 1000`)
        
                const processedMatchData = await getMatchData(id, accountId);
        
                console.log(`Waiting ${process.env.API_BUFFER} milliseconds..`)
                await wait(Number(process.env.API_BUFFER) || 2000);
                console.log('Moving on..!')
        
                processedMatchDataArr.push(processedMatchData);
            }
        }

    } else {
        const matchIds = await getMatchListFromAccountId(accountId, sampleSize);

        for (const id of matchIds) {

            matchCount++;
            console.log(`Retrieving match ${matchCount} out of ${sampleSize}`)
    
            const processedMatchData = await getMatchData(id, accountId);
    
            await wait(Number(process.env.BUFFER) || 3000);
    
            processedMatchDataArr.push(processedMatchData);
        }
    }
    
    const processedTrendData = {
        top: await processTrendDataTest(processedMatchDataArr, accountId, 'Top'),
        jungle: await processTrendDataTest(processedMatchDataArr, accountId, 'Jungle'),
        mid: await processTrendDataTest(processedMatchDataArr, accountId, 'Mid'),
        adc: await processTrendDataTest(processedMatchDataArr, accountId, 'ADC'),
        support: await processTrendDataTest(processedMatchDataArr, accountId, 'Support'),
    }

    return processedTrendData;
}



export async function processTrendDataTest(matchDataArr: MatchDto[], accountId: string, role: string) {

    const context = {
        data: matchDataArr,
        accountId,
        role
    }

    const statGroups: StatGroup[] = [];

    const totalMatches = getTotalMatchesInRole(context);

    await processSharedStats(statGroups, context);
    
    return {
        totalMatches,
        stats: statGroups
    };

}

export async function processSharedStats(statGroups: StatGroup[], context: any) {

    const RESOURCES = ['gold', 'xp', 'cs'];

    RESOURCES.forEach((resource) => {

        const resourceTitle = resource.toUpperCase();

        // TOTAL
        const totalStatGroup: StatGroup = {
            id: `${resourceTitle}_TOTAL`,
            stats: [
                {
                    id: `${resourceTitle}_TOTAL_PLAYER`,
                    value: getAverageTotal(context, resource, undefined, undefined, 'ally')
                },
                {
                    id: `${resourceTitle}_TOTAL_EARLY_PLAYER`,
                    value: getAverageTotal(context, resource, 0, 14, 'ally')
                },
                {
                    id: `${resourceTitle}_TOTAL_MID_PLAYER`,
                    value: getAverageTotal(context, resource, 14, 28, 'ally')
                },
                {
                    id: `${resourceTitle}_TOTAL_LATE_PLAYER`,
                    value: getAverageTotal(context, resource, 28, undefined, 'ally')
                },
                {
                    id: `${resourceTitle}_TOTAL_ENEMY`,
                    value: getAverageTotal(context, resource, undefined, undefined, 'enemy')
                },
                {
                    id: `${resourceTitle}_TOTAL_EARLY_ENEMY`,
                    value: getAverageTotal(context, resource, 0, 14, 'enemy')
                },
                {
                    id: `${resourceTitle}_TOTAL_MID_ENEMY`,
                    value: getAverageTotal(context, resource, 14, 28, 'enemy')
                },
                {
                    id: `${resourceTitle}_TOTAL_LATE_ENEMY`,
                    value: getAverageTotal(context, resource, 28, undefined, 'enemy')
                },
                {
                    id: `${resourceTitle}_TOTAL_ADV`,
                    value: getAverageTotalAdvantage(context, resource)
                },
                {
                    id: `${resourceTitle}_TOTAL_EARLY_ADV`,
                    value: getAverageTotalAdvantage(context, resource, 0, 14)
                },
                {
                    id: `${resourceTitle}_TOTAL_MID_ADV`,
                    value: getAverageTotalAdvantage(context, resource, 14, 28)
                },
                {
                    id: `${resourceTitle}_TOTAL_LATE_ADV`,
                    value: getAverageTotalAdvantage(context, resource, 28)
                }
            ]
        }

        statGroups.push(totalStatGroup);

        const growthRateStatGroup: StatGroup = {
            id: `${resourceTitle}_GROWTH_RATE`,
            stats: [
                {
                    id: `${resourceTitle}_GROWTH_RATE_PLAYER`,
                    value: getAverageGrowthRate(context, resource, undefined, undefined, 'ally')
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_EARLY_PLAYER`,
                    value: getAverageGrowthRate(context, resource, 0, 14, 'ally')
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_MID_PLAYER`,
                    value: getAverageGrowthRate(context, resource, 14, 28, 'ally')
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_LATE_PLAYER`,
                    value: getAverageGrowthRate(context, resource, 28, undefined, 'ally')
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_ENEMY`,
                    value: getAverageGrowthRate(context, resource, undefined, undefined, 'enemy')
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_EARLY_ENEMY`,
                    value: getAverageGrowthRate(context, resource, 0, 14, 'enemy')
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_MID_ENEMY`,
                    value: getAverageGrowthRate(context, resource, 14, 28, 'enemy')
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_LATE_ENEMY`,
                    value: getAverageGrowthRate(context, resource, 28, undefined, 'enemy')
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_ADV`,
                    value: getAverageGrowthRateAdvantage(context, resource)
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_EARLY_ADV`,
                    value: getAverageGrowthRateAdvantage(context, resource, 0, 14)
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_MID_ADV`,
                    value: getAverageGrowthRateAdvantage(context, resource, 14, 28)
                },
                {
                    id: `${resourceTitle}_GROWTH_RATE_LATE_ADV`,
                    value: getAverageGrowthRateAdvantage(context, resource, 28)
                }
            ]
        }

        statGroups.push(growthRateStatGroup);

        // PER MINUTE STAT GROUP
        const perMinuteStatGroup: StatGroup = {
            id: `${resourceTitle}_PER_MINUTE`,
            stats: [
                {
                    id: `${resourceTitle}_PER_MINUTE_PLAYER`,
                    value: getAverageResourcePerMinute(context, resource, undefined, undefined, 'ally')
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_EARLY_PLAYER`,
                    value: getAverageResourcePerMinute(context, resource, 0, 14, 'ally')
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_MID_PLAYER`,
                    value: getAverageResourcePerMinute(context, resource, 14, 28, 'ally')
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_LATE_PLAYER`,
                    value: getAverageResourcePerMinute(context, resource, 28, undefined, 'ally')
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_ENEMY`,
                    value: getAverageResourcePerMinute(context, resource, undefined, undefined, 'enemy')
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_EARLY_ENEMY`,
                    value: getAverageResourcePerMinute(context, resource, 0, 14, 'enemy')
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_MID_ENEMY`,
                    value: getAverageResourcePerMinute(context, resource, 14, 28, 'enemy')
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_LATE_ENEMY`,
                    value: getAverageResourcePerMinute(context, resource, 28, undefined, 'enemy')
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_ADV`,
                    value: getAverageResourcePerMinuteAdvantage(context, resource)
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_EARLY_ADV`,
                    value: getAverageResourcePerMinuteAdvantage(context, resource, 0, 14)
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_MID_ADV`,
                    value: getAverageResourcePerMinuteAdvantage(context, resource, 14, 28)
                },
                {
                    id: `${resourceTitle}_PER_MINUTE_LATE_ADV`,
                    value: getAverageResourcePerMinuteAdvantage(context, resource, 28)
                }
            ]
        } 

        statGroups.push(perMinuteStatGroup);

        const resourceShareStatGroup = {
            id: `${resourceTitle}_SHARE`,
            stats: [
                {
                    id: `${resourceTitle}_SHARE_PLAYER`,
                    value: getAverageResourceShare(context, resource, 'ally')
                },
                {
                    id: `${resourceTitle}_SHARE_ENEMY`,
                    value: getAverageResourceShare(context, resource, 'enemy')
                },
                {
                    id: `${resourceTitle}_SHARE_ADV`,
                    value: getAverageResourceShareAdvantage(context, resource)
                }
            ]
        }

        statGroups.push(resourceShareStatGroup);

    })
}

export async function processGoldData(stats: Stat[], context: any) {
    
}

export async function processXpData(stats: Stat[], context: any) {
    
}

export async function processCsData(stats: Stat[], context: any) {
   
}

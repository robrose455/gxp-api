import { Data, MatchDto, Participant, RoleKey, ROLES, Team, Event, EventType, Stat, StatGroup, ParticipantSnapshot} from './types';
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
import { getAccountIdFromRiot, getMatchFromRiot, getMatchListFromRiot, getMatchTimelineFromRiot } from './riot-service';

function formatChampionName(champion: string) {
   const regex = /([a-z])([A-Z])/;
   return champion.replace(regex, '$1 $2');
}

export async function getMatchPreview(matchId: string, accountId: string) {

    const matchData = await getMatchFromRiot(matchId);

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

    const accountId = await getAccountIdFromRiot(name, tag);

    const matchIds = await getMatchListFromRiot(accountId, 20);

    let matchPreviews = [];

    for (let i = 0; i < matchIds.length; i++) {
        const matchPreview = await getMatchPreview(matchIds[i], accountId);
        
        if (matchPreview) {
            matchPreviews.push(matchPreview);
        }
    }
    
    return matchPreviews;
}

export async function getParticipantsFromMatch(matchId: string, playerId: string) {

    const matchData = await getMatchFromRiot(matchId);

    // Register Participants
    const matchDataParticipants = matchData['info']['participants'];

    // Find which team player belongs to
    const player = matchDataParticipants.find((p: any) => p['puuid'] === playerId);
    const playerTeam = player['teamId'];
    const participants = [];

    for (const p of matchDataParticipants) {

        const participant: Participant = {
            id: p['puuid'],
            champion: p['championName'],
            role: ROLES[p['teamPosition'] as RoleKey],
            team: (playerTeam === p['teamId']) ? Team.ALLY : Team.ENEMY
        }

        participants.push(participant);

    }
    
    return participants;
}

export async function getMatchData(matchId: any, playerId: any) {

    const matchDataDTO: MatchDto = {
        participants: [],
        events: [],
        data: [],
    };

    const matchTimeline = await getMatchTimelineFromRiot(matchId);

    matchDataDTO.participants = await getParticipantsFromMatch(matchId, playerId);

    const data: Data[] = [
        {
           id: matchDataDTO.participants[0].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
        },
        {
           id: matchDataDTO.participants[1].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
        },
        {
           id: matchDataDTO.participants[2].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
        },
        {
           id: matchDataDTO.participants[3].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
           
        },
        {
           id: matchDataDTO.participants[4].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
        },
        {
           id: matchDataDTO.participants[5].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
        },
        {
           id: matchDataDTO.participants[6].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
        },
        {
           id: matchDataDTO.participants[7].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
        },
        {
           id: matchDataDTO.participants[8].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
        },
        {
           id: matchDataDTO.participants[9].id, 
           gold: [],
           xp: [],
           level: [],
           cs: [],
           damage: []
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
            const damage = participantFrame['damageStats']['totalDamageDoneToChampions']


            data[i-1].gold.push(gold);
            data[i-1].xp.push(xp);
            data[i-1].level.push(level);
            data[i-1].cs.push(cs);
            data[i-1].damage.push(damage);
            
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

function getParticipantResourceData(matchTimeline: any) {
    
    const participantResourceData: Data[] = []

    // Retrieve Frame Data
    const matchTimelineFrames = matchTimeline['info']['frames'];

    // Parse Frame Data
    for (const frame of matchTimelineFrames) {

        // Parse Data & Gold XP For Each Player
        const participantFrames = frame['participantFrames'];

        for (let i = 1; i < 11; i++) {

            if (!participantResourceData[i - 1]) {
                participantResourceData[i - 1] = {
                  id: matchTimeline['metadata']['participants'][i - 1],
                  gold: [],
                  xp: [],
                  level: [],
                  cs: [],
                  damage: [],
                };
              }

            const participantFrame = participantFrames[i.toString()];

            const gold = participantFrame['totalGold'];
            const xp = participantFrame['xp'];
            const level = participantFrame['level'];
            const cs = participantFrame['jungleMinionsKilled'] + participantFrame['minionsKilled'];
            const damage = participantFrame['damageStats']['totalDamageDoneToChampions']

            participantResourceData[i-1].gold.push(gold);
            participantResourceData[i-1].xp.push(xp);
            participantResourceData[i-1].level.push(level);
            participantResourceData[i-1].cs.push(cs);
            participantResourceData[i-1].damage.push(damage);
            
        }

    }

    return participantResourceData;

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
        const matchIds = await getMatchListFromRiot(accountId, sampleSize);

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

export async function getBreakdownForMatch(matchId: string, playerId: string) {

    try {

        // Get Match Timeline
        const matchTimeline = await getMatchTimelineFromRiot(matchId);

        const participantResourceData = getParticipantResourceData(matchTimeline);

        // Get Match Metadata
        const participants: Participant[] = await getParticipantsFromMatch(matchId, playerId);

        const frames = matchTimeline['info']['frames'];

        const matchLength = frames.length;

        const snapshots = [];

        for (let i = 0; i < matchLength - 1; i++) {

            const snapshot = {
                frame: i + 1,
                participants: [] as ParticipantSnapshot[]
            }

            const events = frames[i]['events']

            // Create a participant snapshot for each player
            for (let j = 0; j < 10; j++) {

                const participantSnapshot: ParticipantSnapshot = {
                    id: participants[j].id,
                    metadata: {
                        champion: participants[j].champion,
                        role: participants[j].role,
                        team: participants[j].team,
                    },
                    gold: participantResourceData[j].gold[i + 1] - participantResourceData[j].gold[i],
                    xp: participantResourceData[j].xp[i + 1] - participantResourceData[j].xp[i], 
                    cs: participantResourceData[j].cs[i + 1] - participantResourceData[j].cs[i],
                    damage: participantResourceData[j].damage[i + 1] - participantResourceData[j].damage[i],
                    kills: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'kill'),
                    deaths: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'death'),
                    assists: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'assist'),
                    outerTurrets: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'turret', 'OUTER_TURRET'),
                    innerTurrets: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'turret', 'INNER_TURRET'),
                    inhibTurrets: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'turret', 'BASE_TURRET'),
                    nexusTurrets: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'turret', 'NEXUS_TURRET'),
                    dragons: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'neutral', 'DRAGON'),
                    barons: getNumberOfEventsForParticipant(events, participants, participants[j].id, 'neutral', 'BARON_NASHOR'),

                }

                snapshot.participants.push(participantSnapshot);

            }

            snapshot.participants.sort((a, b) => {
                const aTotal = a.gold + a.xp;
                const bTotal = b.gold + b.xp;
                return bTotal - aTotal; // Descending order
            }); 

            snapshot.participants.forEach((participant, index) => {
                participant['rank'] = index + 1;
            })

            snapshots.push(snapshot);
        
        }

        const bonusStars = getBonusStarsFromSnapshots(snapshots);

        return {
            snapshots,
            bonusStars,
        }
        
    } catch (error) {
       console.log(error);
       return [];
    }
}

function getBonusStarsFromSnapshots(snapshots: any[]) {


    // Leaders

    // Overall Leader
    const overallLeader = getRanksForRange(snapshots);

    // Early Leader
    const earlyLeader = getRanksForRange(snapshots, 0, 14);

    // Mid Leader
    const midLeader = getRanksForRange(snapshots, 14, 28);

    // Late Leader
    const lateLeader = getRanksForRange(snapshots, 28);

    return {
        overallLeader,
        earlyLeader,
        midLeader,
        lateLeader,
    }
  
}

function getRanksForRange(snapshots: any[], start?: number, end?: number) {

    try {

        let rankTotals: any[] = [];

    let min = 0;
    let max = snapshots.length;

    if (start && start > max) {
        return null;
    }

    if (start !== undefined) {
        min = start;
    }

    if (end !== undefined && end < max) {
        max = end;
    }

    for (let i = min; i < max; i++) {

        const participantData = snapshots[i].participants;

        participantData.forEach((participant: any) => {

            const id = participant.id;
            const champion = participant.metadata.champion;
            const singleRank = participant.rank;

            const existingRankTotal = rankTotals.find((rankTotal) => rankTotal?.id === id )

            if (existingRankTotal) {
                existingRankTotal.rank += singleRank;
            } else {
                let rankTotal = {
                    id,
                    champion,
                    rank: singleRank
                }
    
                rankTotals.push(rankTotal); 
            }
        })
    }

    rankTotals.sort((a, b) => a.rank - b.rank)
    
    return rankTotals.map((rankTotal: any) => {
        return rankTotal.champion;
    })
        
    } catch (error) {
        console.log(error);   
    }
}

function getNumberOfEventsForParticipant(events: any[], participants: any[], participantId: string, type: string, subtype?: string): number {

    switch (type) {
        case 'kill': 
            const killEvents = events.filter((event) => event['type'] === 'CHAMPION_KILL' && participants[Number(event['killerId']) - 1].id === participantId); 
            return killEvents.length;
        case 'death':
            const deathEvents = events.filter((event) => event['type'] === 'CHAMPION_KILL' && participants[Number(event['victimId']) - 1].id === participantId);
            return deathEvents.length;
        case 'assist':
            
            try {
                let assistEvents = [];
                const allKillEvents = events.filter((event) => event['type'] === 'CHAMPION_KILL');
                allKillEvents.forEach((killEvent: any) => {
    
                    let isAssist = false;
    
                    if (killEvent['assistingParticipantIds']) {
                        killEvent['assistingParticipantIds'].forEach((assistId: number) => {
                            if (participants[Number(assistId) - 1].id === participantId) {
                                isAssist = true;
                            }
                        })
                    }
    
                    if (isAssist) {
                        assistEvents.push(killEvent);
                    }
                })
                return assistEvents.length;
            } catch (error) {
                console.log(error);
            }
        case 'turret':
            try {

                const turretEvents = events.filter((event) => event['type'] === 'BUILDING_KILL' 
                && participants[Number(event['killerId']) - 1]?.id === participantId
                && event['towerType'] === subtype)
                return turretEvents?.length || 0
            } catch (error) {
                console.log(error);
            }
        case 'neutral':
            try {
                const participantTeam = participants.find((part) => part.id === participantId)?.team;
                const neutralEvents = events.filter((event) => event['type'] === 'ELITE_MONSTER_KILL' 
                && participants[Number(event['killerId'])]?.team === participantTeam
                && event['monsterType'] === subtype)
                return neutralEvents?.length || 0
            } catch (error) {
                console.log(error);
            }
        default:
            return 0;
    }
}

export async function getEventTimelineDetailsForMatch(matchId: string, accountId: string) {

    let timeline = await getMatchTimelineFromRiot(matchId);
    let rawParticipants = timeline.info.participants; 
    const matchParticipants = await getParticipantsFromMatch(matchId, accountId)
    const completeParticipants = [];

    for (const participant of rawParticipants) {

        const mp = matchParticipants.find((mp: Participant) => participant.puuid === mp.id);
        const completeParticipant = {
            ...participant,
            role: mp?.role,
            champion: mp?.champion,
            team: mp?.team,
        }

        completeParticipants.push(completeParticipant);
    }

    console.log(completeParticipants);

    timeline.info.participants = completeParticipants;

    return timeline;

}

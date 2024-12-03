import axios from 'axios';
import { Data, MatchDto, Participant, RoleKey, ROLES, Team, Event, EventType} from './types';

export async function getAccountIdFromNameAndTag(name:any , tag: any) {
    const response = await axios.get(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${process.env.RIOT_API_KEY}`);
    const accountId = response.data.puuid;
    return accountId;
}

export async function getMatchListFromAccountId(accountId: any) {
    const response = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${accountId}/ids?api_key=${process.env.RIOT_API_KEY}`);
    const matchIds = response.data;
    return matchIds;
}

function formatChampionName(champion: string) {
   const regex = /([a-z])([A-Z])/;
   return champion.replace(regex, '$1 $2');
}

export async function getMatchPreviews(name: any, tag: any) {

    const accountId = await getAccountIdFromNameAndTag(name, tag);

    const matchIds = await getMatchListFromAccountId(accountId);

    let matchPreviews = [];

    for (let i = 0; i < matchIds.length; i++) {

      const matchId = matchIds[i];
      const matchResponse = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`);
      const matchData = matchResponse.data;

      if (matchData['info']['gameMode'] !== 'CLASSIC') {
          continue;
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

      const matchPreview = {
        accountId,
        matchId,
        playerChampion,
        enemyChampion,
        role,
        win,
        playerParticipantId,
        enemyParticipantId
      }

      matchPreviews.push(matchPreview);
    }
    
    return matchPreviews;
}

export async function getMatchData(id: any, playerId: any) {

    const matchDataDTO: MatchDto = {
        participants: [],
        events: [],
        data: [],
    };

    // Get Timeline Data
    const matchTimelineResponse = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${id}/timeline?api_key=${process.env.RIOT_API_KEY}`);

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
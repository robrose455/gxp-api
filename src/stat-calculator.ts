import { MatchDto } from "./types";

export function getTotalMatchesInRole(context: any) {

    let totalMatches = 0;

    const matches = context['data'];

    for (const match of matches) {
        const { role } = getPlayerAndEnemyDataFromMatch(match, context['accountId']); 
        if (role === context['role']) {
            totalMatches++;
        }
    }

    return totalMatches;
}
export function getPlayerAndEnemyDataFromMatch(matchData: MatchDto, accountId: string) {
    const playerData = matchData.data.find((data) => data.id === accountId);
    const playerParticipantData = matchData.participants.find((player) => player.id === accountId && player.team === 'ally');
    const playerRole = playerParticipantData?.role;
    const enemyParticipantData = matchData.participants.find((player) => player.role === playerRole && player.team === 'enemy');
    const enemyId = enemyParticipantData?.id;
    const enemyData = matchData.data.find((data) => data.id === enemyId);
    return { playerData, enemyData, role: playerRole };
}

export function getPlayerAndEnemyResourceMatrix(context: any, resource: string) {

    let playerResourceMatrix = [];
    let enemyResourceMatrix = [];

    for (const match of context.data) {
        const { playerData, enemyData, role } = getPlayerAndEnemyDataFromMatch(match, context['accountId']);
        
        if (playerData && enemyData && role === context['role']) {

            let playerResources: number[] = [];
            let enemyResources: number[] = [];

            if (resource === 'gold') {
                playerResources = playerData.gold;
                enemyResources = enemyData.gold;
            }

            if (resource === 'xp') {
                playerResources = playerData.xp;
                enemyResources = enemyData.xp;
            }

            if (resource === 'cs') {
                playerResources = playerData.cs;
                enemyResources = enemyData.cs;
            }

            playerResourceMatrix.push(playerResources);
            enemyResourceMatrix.push(enemyResources);
        }
    }

    return { playerResourceMatrix, enemyResourceMatrix };
}

export function getMatchDataWithParticipants(context: any) {

    const matchDataArrWithParticipants: any[] = [];

    const matchDataArr = context['data'];

    matchDataArr.forEach((match: MatchDto) => {
        const matchDataWithParticipants: any[] = [];

        match.data.forEach((stat) => {
            const participantaData = match.participants.find((p) => p.id === stat.id);
            const enhancedData = {
                ...stat,
                role: participantaData?.role,
                champion: participantaData?.champion,
                team: participantaData?.team,
            }
            matchDataWithParticipants.push(enhancedData);
        })

        matchDataArrWithParticipants.push(matchDataWithParticipants);
    })

    return matchDataArrWithParticipants;
}


export function calculateTotal(data: number[]) {
    return data.reduce((acc, value) => acc + value, 0);
}

export function calculateAverageTotal(data: number[]) {

    if (data.length === 0) {
        return 0;
    }

    return calculateTotal(data) / data.length;
}


export function calculateAverageFromMatrix(resourceMatrix: number[][], start?: number, end?: number) {
    let totals: number[] = [];

    resourceMatrix.forEach((match) => {

        const matchLength = match.length;
        let matchStart = 0;
        let matchEnd = matchLength - 1
        let skip = false;

        if (start !== undefined) {
            if (start > matchLength - 1) {
                skip = true;
            } else {
                matchStart = start;
            }
        }

        if (end !== undefined) {
            matchEnd = matchLength - 1 < end ? matchLength - 1 : end;
        }

        match = match.splice(matchStart, matchEnd);

        if (!skip) {
            totals.push(calculateAverageTotal(match))
        }

    })

    const average = calculateAverageTotal(totals);

    return average;

}

export function calculateGrowthRateFromMatrix(resourceMatrix: number[][]) {

    const growthRateMatrix: number[][] = []
    resourceMatrix.forEach((match) => {
        const growthRates: number[] = [];
        for (let i = 1; i < match.length; i++) {
            if (match[i - 1] !== 0) {
                const growthRate = ((match[i] - match[i - 1]) / match[i - 1]) * 100;
                growthRates.push(growthRate);
            }
        }
        growthRateMatrix.push(growthRates);
    });

    return growthRateMatrix

}

export function calculateResourcePerMinuteFromMatrix(resourceMatrix: number[][]) {

    let resourcePerMinuteMatrix: number[][] = []
    resourceMatrix.forEach((match) => {
        const resourcePerMinutes: number[] = [];
        for (let i = 1; i < match.length; i++) {
            if (match[i - 1] !== 0) {
                const resourcePerMinute = (match[i] - match[i - 1])
                resourcePerMinutes.push(resourcePerMinute);
            }
        }
        resourcePerMinuteMatrix.push(resourcePerMinutes);
    });

    return resourcePerMinuteMatrix
}

export function calculateAverageResourceShareForTeam(context: any, matchData: any[], resource: string, team: string) {

    let playerId = context['accountId'];

    let activeId = playerId;

    const resourceShareData: number[] = [];

    matchData.forEach((match) => {

        const playerData = match.find((player: any) => player['id'] === playerId);
        const playerRole = playerData['role'];

        const enemyData = match.find((player: any) => player['role'] === playerRole && player['id'] !== playerId);
        const enemyId = enemyData['id'];

        if (team === 'enemy') {
            activeId = enemyId
        }

        if ( playerRole === context['role']) {
            let totalResources = 0;
            let playerResources = 0;

            match.forEach((participant: any) => {
                
                if (participant['team'] === team) {

                    const resourceValue = participant[resource][participant[resource].length - 1]

                    if (activeId === participant['id']) {
                        playerResources = resourceValue;
                    }

                    totalResources += resourceValue;
                }

            })

            const resourceShare = (playerResources / totalResources) * 100;

            resourceShareData.push(resourceShare);
        }
    })

    const averageResourceShare = calculateAverageTotal(resourceShareData);

    return averageResourceShare;

}

export function getAverageTotal(context: any, resource: string, start?: number, end?: number, team: string = 'ally'): number {

    const { playerResourceMatrix, enemyResourceMatrix } = getPlayerAndEnemyResourceMatrix(context, resource);

    let activeResourceMatrix = (team === 'ally') ? playerResourceMatrix : enemyResourceMatrix;

    let endTotals: number[] = [];
    activeResourceMatrix.forEach((match) => {

        let matchStart = 0;
        let matchEnd = match.length - 1
        let skip = false;

        if (start !== undefined) {
            if (start > match.length - 1) {
                skip = true;
            } else {
                matchStart = start;
            }
        }

        if (end !== undefined) {
            matchEnd = match.length - 1 < end ? match.length - 1 : end;
        }

        if (!skip) {
            endTotals.push(match[matchEnd] - match[matchStart]) 
        }
        
    });

    const averageEndTotals = calculateAverageTotal(endTotals)

    return Number(averageEndTotals.toFixed(2));

}

export function getAverageTotalAdvantage(context: any, resource: string, start?: number, end?: number): number {

    const playerAverageEndTotals = getAverageTotal(context, resource, start, end, 'ally')

    const enemyAverageEndTotals = getAverageTotal(context, resource, start, end, 'enemy')

    return Number((playerAverageEndTotals - enemyAverageEndTotals).toFixed(2));
}

export function getAverageGrowthRate(context: any, resource: string, start?: number, end?: number, team: string = 'ally') {

    const { playerResourceMatrix, enemyResourceMatrix } = getPlayerAndEnemyResourceMatrix(context, resource);

    let activeResourceMatrix = (team === 'ally') ? playerResourceMatrix : enemyResourceMatrix;

    const growthRateMatrix = calculateGrowthRateFromMatrix(activeResourceMatrix);

    const averageGrowthRate = calculateAverageFromMatrix(growthRateMatrix, start, end);

    return Number(averageGrowthRate.toFixed(2));

}

export function getAverageGrowthRateAdvantage(context: any, resource: string, start?: number, end?: number): number {

    const playerAverage = getAverageGrowthRate(context, resource, start, end, 'ally');

    const enemyAverage = getAverageGrowthRate(context, resource, start, end, 'enemy');

    return Number((playerAverage - enemyAverage).toFixed(2))

}

export function getAverageResourcePerMinute(context: any, resource: string, start?: number, end?: number, team = 'ally'): number {

    const { playerResourceMatrix, enemyResourceMatrix } = getPlayerAndEnemyResourceMatrix(context, resource);

    let activeResourceMatrix = (team === 'ally') ? playerResourceMatrix : enemyResourceMatrix;

    const resourcePerMinuteMatrix = calculateResourcePerMinuteFromMatrix(activeResourceMatrix);

    const averageResourcePerMinute = calculateAverageFromMatrix(resourcePerMinuteMatrix, start, end);

    return Number(averageResourcePerMinute.toFixed(2));
}

export function getAverageResourcePerMinuteAdvantage(context: any, resource: string, start?: number, end?: number): number {

    const playerAverage = getAverageResourcePerMinute(context, resource, start, end, 'ally');

    const enemyAverage = getAverageResourcePerMinute(context, resource, start, end, 'enemy');

    return Number((playerAverage - enemyAverage).toFixed(2))

}

export function getAverageResourceShare(context: any, resource: string, team: string = 'ally'): number {

    const enhancedMatchData = getMatchDataWithParticipants(context);

    const averageResourceShare = calculateAverageResourceShareForTeam(context, enhancedMatchData, resource, team);

    return Number(averageResourceShare.toFixed(2));

}

export function getAverageResourceShareAdvantage(context: any, resource: string): number {

    const playerAverageResourceShare = getAverageResourceShare(context, resource, 'ally');

    const enemyAverageResourceShare = getAverageResourceShare(context, resource, 'enemy')

    return Number((playerAverageResourceShare - enemyAverageResourceShare).toFixed(2))
}
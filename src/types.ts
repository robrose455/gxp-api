export const ROLES = {
    'BOTTOM': 'ADC',
    'UTILITY': 'Support',
    'MIDDLE': 'Mid',
    'TOP': 'Top',
    'JUNGLE': 'Jungle',
} as const

export type RoleKey = keyof typeof ROLES;

export enum Team {
    ALLY = 'ally',
    ENEMY = 'enemy'
}

export enum EventType {
    KILL = 'kill',
    TURRET = 'turret',
    OBJECTIVE = 'objective'
}

export type Participant = {
    id: string,
    champion: string,
    role: string,
    team: Team
}

export type Event = {
    id: string,
    type: EventType
    subtype?: string
    timestamp: number,
    frame: number,
    team: Team,
    killer: string,
    assists?: string[]
}

export type Data = {
    id: string,
    gold: number[],
    xp: number[],
    level: number[],
    cs: number[]
}

export type MatchDto = {
    participants: Participant[],
    events: Event[],
    data: Data[]
}

export type TrendData = {
    gold: {
        averageEarlyGrowthRate: number,
        averageEarlyGrowthRateAdvantage: number,
        averageMidGrowthRate: number,
        averageMidGrowthRateAdvantage: number,
        averageLateGrowthRate: number,
        averageLateGrowthRateAdvantage: number,
        averageTotal: number, //
        averageTotalAdvantage: number, //
        averageAtTen: number, //
        averageAtTenAdvantage: number, //
        averageGPM: number, //
        averageGPMAdvantage: number, //
        averageShare: number,
        averageShareAdvantage: number,
        averageBaronSwing: number,
        averageBaronSwingAdvantage: number
    },
    xp: {
        averageEarlyGrowthRate: number,
        averageEarlyGrowthRateAdvantage: number,
        averageMidGrowthRate: number,
        averageMidGrowthRateAdvantage: number,
        averageLateGrowthRate: number,
        averageLateGrowthRateAdvantage: number,
        averageTimeToSix: number,
        averageTimeToSixAdvantage: number,
        averageTotal: number,
        averageTotalAdvantage: number,
        averageAtTen: number,
        averageAtTenAdvantage: number,
        averageXPM: number,
        averageXPMAdvantage: number,
        averageShare: number,
        averageShareAdvantage: number,
        averageBaronSwing: number,
        averageBaronSwingAdvantage: number,
        averageLevelAdvantageInLoss: number,
        averageLevelAdvantageInWin: number
    },
    cs: {
        averageEarlyGrowthRate: number,
        averageEarlyGrowthRateAdvantage: number,
        averageMidGrowthRate: number,
        averageMidGrowthRateAdvantage: number,
        averageLateGrowthRate: number,
        averageLateGrowthRateAdvantage: number,
        averageTimeToHundred: number,
        averageTimeToHundredAdvantage: number,
        averageTotal: number,
        averageTotalAdvantage: number,
        averageAtTen: number,
        averageAtTenAdvantage: number,
        averageXPM: number,
        averageXPMAdvantage: number,
        averageShare: number,
        averageShareAdvantage: number,
        averageBaronSwing: number,
        averageBaronSwingAdvantage: number
    },

}

// GOLD_PER_MINUTE
export type StatGroup = {
    id: string,
    stats: Stat[]
}

export type Stat = {
    id: string,
    value: number
}



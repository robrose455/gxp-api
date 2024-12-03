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


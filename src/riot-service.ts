import { match } from "assert";
import axios from "axios";

export async function getAccountIdFromRiot(name:any , tag: any) {

    try {
        const response = await axios.get(`https://${process.env.SERVER}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${process.env.RIOT_API_KEY}`);
        const accountId = response.data.puuid;
        return accountId;  
    } catch (error) {
        console.log(error);
        throw error;   
    }
}

export async function getMatchListFromRiot(accountId: any, limit: number = 20, start = 0) {

    try {
        const response = await axios.get(`https://${process.env.SERVER}.api.riotgames.com/lol/match/v5/matches/by-puuid/${accountId}/ids?api_key=${process.env.RIOT_API_KEY}&count=${limit}&start=${start}`);
        const matchIds = response.data;
        return matchIds; 
    } catch (error) {
        console.log(error);
        throw error;   
    }
}

export async function getMatchFromRiot(matchId: string) {
    try {
        const url = `https://${process.env.SERVER}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`;
        const matchResponse = await axios.get(url);
        return matchResponse.data;
    } catch (error) {
        console.log(error);
        throw error;   
    }
}

export async function getMatchTimelineFromRiot(matchId: string) {

    try {
        const matchDataResponse = await axios.get(`https://${process.env.SERVER}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline?api_key=${process.env.RIOT_API_KEY}`);
        const matchData = matchDataResponse.data;
        return matchData;
    } catch (error) {
        console.log(error);
        throw error;   
    }
}

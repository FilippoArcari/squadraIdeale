/**
 * Regole di assegnazione punti versionate per stagione.
 *
 * Perche' e' versionato e non un'unica costante globale: le statistiche di
 * ogni stagione (vedi lib/seasonStats.ts) sono sempre ricalcolate al volo dai
 * documenti Game, non salvate. Se la formula punti fosse una singola costante,
 * cambiarla riscriverebbe istantaneamente anche le classifiche delle stagioni
 * gia' concluse. Per evitarlo, ogni Turnament tiene uno storico di regole
 * (`pointsRuleHistory`), ciascuna valida "a partire dalla stagione fromSeason
 * in poi", finche' non arriva una regola piu' recente. Le stagioni chiuse
 * restano quindi ancorate alla regola che era in vigore quando sono state
 * giocate.
 */

export type MatchOutcome = "winner" | "loser" | "draw" | "absent";

export interface PointsRule {
    fromSeason: number;
    winner: number;
    loser: number;
    draw: number;
    absent: number;
}

/** Regola storica in vigore prima dell'introduzione delle regole versionate. */
export const LEGACY_POINTS_RULE: PointsRule = {
    fromSeason: 1,
    winner: 3,
    loser: 0,
    draw: 1,
    absent: 0,
};

/**
 * Trova la regola applicabile a una data stagione: quella con il fromSeason
 * piu' alto che sia comunque <= season. Se lo storico e' vuoto o non ha una
 * voce che copra la stagione richiesta, ricade sulla regola storica 3/1/0
 * (garantisce continuita' per i tornei creati prima di questa feature).
 */
export function resolvePointsRule(ruleHistory: PointsRule[] | undefined | null, season: number): PointsRule {
    if (!ruleHistory || ruleHistory.length === 0) {
        return LEGACY_POINTS_RULE;
    }

    const applicable = ruleHistory
        .filter((r) => r.fromSeason <= season)
        .sort((a, b) => b.fromSeason - a.fromSeason)[0];

    return applicable || LEGACY_POINTS_RULE;
}

export function pointsForOutcome(rule: PointsRule, outcome: MatchOutcome): number {
    return rule[outcome];
}

export function outcomeFor(isWinner: boolean, isDraw: boolean): MatchOutcome {
    if (isDraw) return "draw";
    return isWinner ? "winner" : "loser";
}

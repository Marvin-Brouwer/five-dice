import type { ValidScore, ScoreContainer } from "../../game/score/score";
import type { DieValue } from '../../game/gameConstants';

type Group = {
    values: Array<DieValue>,
    value: DieValue
} 
function groupBy(array: ValidScore) {
    const groupedArray =  array.reduce((accumulator, die) => {
       
        if (accumulator.has(die)) {
            const group = accumulator.get(die)!;
            group.values.push(die);

            accumulator.set(die, group);
        }
        else {
            accumulator.set(die, { value: die, values: [die] })
        }

        return accumulator;
        
    }, new Map<DieValue, Group>());
    
    return Array.from(groupedArray.values());
        
};
export type ScoreGroup = [smallGroup: Array<DieValue>, largeGroup: Array<DieValue>]

export function sortSimpleScore(amount: number, score: ValidScore):  ScoreGroup{

    const groupedResults = groupBy(score);

    const smallGroup = groupedResults
        .filter(group => group.value != amount)
        .sort((a, b) => a.value - b.value)
        .flatMap(group => group.values);
    const largeGroup = groupedResults
        .filter(group => group.value == amount)
        .flatMap(group => group.values);

    return [smallGroup, largeGroup] 
}

export function sortSomeOfKind(amount: number, score: ValidScore):  ScoreGroup{

    const sortedResults = groupBy(score)
        .sort((a, b) => 
            (a.values.length - b.values.length) + 
            (a.value - b.value)
        )
        .flatMap(group => group.values);
        
    const smallGroup = sortedResults.slice(0, 5- amount);
    const largeGroup = sortedResults.slice(5- amount);

    return [smallGroup, largeGroup] 
}

export function sortFullHouse(score: ValidScore):  ScoreGroup{

    const sortedResults = groupBy(score)
        .sort((a, b) => a.values.length - b.values.length)
        .flatMap(group => group.values);
        
    const smallGroup = sortedResults.slice(0, 2);
    const largeGroup = sortedResults.slice(2);

    return [smallGroup, largeGroup];
}

export function sortStraight(score: ValidScore):  ScoreGroup{

    const smallGroup = groupBy(score)
        .filter(group => group.values.length > 1)
        .sort((a, b) => a.value - b.value)
        .flatMap(group => group.value);
    const largeGroup = groupBy(score)
        .filter(group => group.values.length = 1)
        .sort((a, b) => a.value - b.value)
        .flatMap(group => group.value);

    return [smallGroup, largeGroup] 
}
export type Face = {
    top: Row,
    middle: Row,
    bottom: Row
};
 
export type Row = {
    name: keyof Face,
    left: Dot, middle: Dot, right: Dot
};

type Dot = boolean;

type FaceInput = [
    top: RowInput,
    middle: RowInput,
    bottom: RowInput
];
 
type RowInput = [
    left: Dot, middle: Dot, right: Dot
];

function fromArray(input: FaceInput): Face {
    return {
        top: { name: 'top', left: input[0][0], middle: input[0][1], right: input[0][2] },
        middle: { name: 'middle', left: input[1][0], middle: input[1][1], right: input[1][2] },
        bottom: { name: 'bottom', left: input[2][0], middle: input[2][1], right: input[2][2] }
    };
}

export function calculateFace(amount: 0 | 1 | 2 | 3 | 4 | 5 | 6): Face {

    const _ = false;
    const x = true;

    if (amount === 0) return fromArray([
        [_,_,_],
        [_,_,_],
        [_,_,_]
    ]);

    if (amount === 1) return fromArray([
        [_,_,_],
        [_,x,_],
        [_,_,_]
    ]);

    if (amount === 2) return fromArray([
        [x,_,_],
        [_,_,_],
        [_,_,x]
    ]);

    if (amount === 3) return fromArray([
        [x,_,_],
        [_,x,_],
        [_,_,x]
    ]);

    if (amount === 4) return fromArray([
        [x,_,x],
        [_,_,_],
        [x,_,x]
    ]);

    if (amount === 5) return fromArray([
        [x,_,x],
        [_,x,_],
        [x,_,x]
    ]);

    if (amount === 6) return fromArray([
        [x,_,x],
        [x,_,x],
        [x,_,x]
    ]);

    else throw RangeError(`The value of amount has to be within 0-6. The value '${amount}' is not.`);
}
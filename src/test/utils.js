import { expect } from 'chai';

export function assertArrayShallowEquals(a, b) {
    expect(a).to.have.lengthOf(b.length);
    for (let i = 0; i < a.length; i++) {
        expect(a[i]).to.equal(b[i]);
    }
}

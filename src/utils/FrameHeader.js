'use strict';

// | ID (4) | index (4) | isLast (1) (170 === true) |

class FrameHeader {
    constructor(fields = {}) {
        this._fields = fields;
    }

    // TODO: add frame length to validate length
    toBuffer() {
        let buffer = Buffer.alloc(FrameHeader.headerLength());

        buffer.writeUInt32LE(this._fields.id, 0);
        buffer.writeUInt32LE(this._fields.index, 4);

        let endInt = this._fields.end ? 2 : 1;
        buffer.writeUInt8(endInt, 8);

        return buffer;
    }

    toObject() {
        return { id: this._fields.id, index: this._fields.index, end: this._fields.end };
    }


    set id(id) { this._fields.id = id; }
    get id() { return this._fields.id; }

    set index(index) { this._fields.index = index; }
    get index() { return this._fields.index; }

    set end(end) { this._fields.end = (end ? true : false); }
    get end() { return this._fields.end; }

    static headerLength() {
        return 9;
    }

    static removeHeader(buffer) {
        return buffer.slice(FrameHeader.headerLength());
    }

    static parseBuffer(buffer) {
        return new FrameHeader({ id: buffer.readUInt32LE(0), index: buffer.readUInt32LE(4), end: buffer.readUInt8(8) === 2 });
    }
}

module.exports = FrameHeader;
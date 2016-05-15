'use strict';

const Transform = require("stream").Transform;

const UnknownMessage = require("./UnknownMessage");
const FrameHeader = require("../response/FrameHeader");

// Get packets and reads the header of the packet
// then distribute these to the correct message

class PacketSorter extends Transform {
    constructor() {
        super({ readableObjectMode: true });
        this._messages = {};
    }

    _transform(packet, encoding, next) {
        // parse Frame header
        let header = FrameHeader.parseBuffer(packet).toObject();

        // get remaining content
        packet = packet.slice(9);

        let message = this.createMessage(header.id);
        
        // add packet to header object
        header.packet = packet;

        // write packet to message
        message.write(header);

        // remove message when all packets have arrived
        if( this._messages[header.id].hasAllPackets() ) {
            this.removeMessage(header.id);
        }

        next();
    }

    createMessage(id) {
        if( !this._messages[id] ) {

            // create new message when id isn't present yet
            this._messages[id] = new UnknownMessage( { id } );

            // remove message when message is done
            const onEnd = function() { 
                this._messages[id].removeListener('end', onEnd);
                this.removeMessage(id); 
            };
            this._messages[id].on('end', onEnd);

            // push new message
            this.push(this._messages[id]);
        }
        
        return this._messages[id];
    }

    removeMessage(id) {
        if( this._messages[id] ) {
            this._messages[id] = null;
        }
    }

}

module.exports = PacketSorter;
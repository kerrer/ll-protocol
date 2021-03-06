# ll-protocol
Node.js custom TCP protocol

### Characteristics
- Send multiple messages at the same time on the same socket
- listen to a type of message by adding a event listener
- Allow streaming of messages
- Message body can be raw bytes
- protocol is written with es2015 (es6) syntax

### Usage
	
Server

	const net = require("net");
	const fs = require("fs");
	const LLProtocol = require("ll-protocol");

    server = new net.Server();

    server.on("connection", (socket) => {
        let protocol = new LLProtocol(socket);

        // accept a file
        protocol.on("someFile", (request) => {
        	const filename = request.headers.filename;

        	const writer = fs.createWriteStream(filename);

        	request.pipe(writer);
        });


        // send a basic string message ('makeResponse' already calls 'send' for response)
        const response = protocol.makeResponse('someMessage', 'This is some content to send');

    });

    server.listen(8000);

Client

	const net = require("net");
	const fs = require("fs");
	const LLProtocol = require("ll-protocol");

	const StringRequest = LLProtocol.request.StringRequest;

    const client = new net.Socket();

    client.connect(8000, () => {
        const protocol = new LLProtocol(client);

        // accept a basic string message
        protocol.setReader('someMessage', StringRequest);

        protocol.on("someMessage", (content) => {
        	console.log("someMessage event fired with content:", content);
        });


        // Send a file
        const filename = "thisissomecoolfilename.txt";
        const reader = fs.createReadStream(filename);

        const response = new LLProtocol.Response({ type: 'someFile', filename });

        reader.pipe(response);

        protocol.send(response);

    });

### Protocol

#### Message

	---------------------------
	|      Header (json)      |
	| { type: 'messageType' } |
	---------------------------
	|      HEADERSEQUENCE     |
	---------------------------
	|      Message Content    |
	|      (raw bytes)        |
	---------------------------

#### Frame
When a message is streamed to the protocol,
all chunks get into its own frame.
A frameheader and frame sequence are added to the frame.

	---------------------------
	|  Frameheader (9 bytes)  |
	---------------------------
	|      Frame Content      |
	|      (raw bytes)        |
	---------------------------
	|      FRAMESEQUENCE      |
	---------------------------

#### Frameheader

	------------------------------
	|    Message Id (4 bytes)    |
	------------------------------
	|    Frame index (4 bytes)   |
	------------------------------
	| Last frame (bool) (1 byte) |
	------------------------------

#### HEADERSEQUENCE and FRAMESEQUENCE
The sequences are both an array of bytes.
The numbers are a decimal representation of the byte value (min: 0, max 255)

	LLProtocol.config.SEQUENCES.header = [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ];
	LLProtocol.config.SEQUENCES.frame = [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ];

Because the sequences are the same for 10 bytes, when going through the chunks, it only need to check once every 10 bytes.
This makes it a lot faster.
